import { randomUUID } from 'node:crypto'
import { devices, expect, test } from '@playwright/test'

// The e2e server must use its own freshly seeded D1 database. This test deliberately
// writes real records and never deletes data or intercepts API responses.
test.describe('Fitness V1 persisted training loop', () => {
  test.describe.configure({ mode: 'serial', retries: 0 })

  test('shares sessions across devices, protects writes, and preserves real history', async ({
    browser,
    baseURL
  }, testInfo) => {
    test.setTimeout(testInfo.project.name === 'webkit' ? 300_000 : 120_000)
    const origin = new URL(baseURL).origin
    const desktopContext = await browser.newContext({
      baseURL,
      viewport: { width: 1440, height: 1000 }
    })
    const phoneContext = await browser.newContext({
      baseURL,
      viewport: { width: 390, height: 844 },
      userAgent: devices['iPhone 13'].userAgent,
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true
    })
    const desktop = await desktopContext.newPage()
    const phone = await phoneContext.newPage()
    const errors = []
    for (const page of [desktop, phone]) {
      page.on('pageerror', (error) => errors.push(error.message))
      page.on('console', (message) => {
        if (
          message.type() === 'error' &&
          /content security policy|refused to (apply|execute|load)/i.test(message.text())
        ) {
          errors.push(message.text())
        }
      })
    }

    async function state(context = desktopContext) {
      const response = await context.request.get('/fitness/api/state')
      expect(response.status()).toBe(200)
      expect(response.headers()['cache-control']).toContain('no-store')
      return response.json()
    }

    async function goto(page, path) {
      return page.goto(path, { waitUntil: 'domcontentloaded' })
    }

    async function post(context, action, body, status = 200, requestOrigin = origin) {
      const response = await context.request.post(`/fitness/api/${action}`, {
        headers: {
          Origin: requestOrigin,
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        data: body
      })
      expect(response.status(), `${action}: ${await response.text()}`).toBe(status)
      return response.json()
    }

    async function weight(context, date, weightKg, status = 303) {
      const response = await context.request.post('/fitness/api/weight', {
        headers: { Origin: origin, Accept: 'application/json' },
        form: { date, weightKg },
        maxRedirects: 0
      })
      expect(response.status(), `weight: ${await response.text()}`).toBe(status)
      if (status === 303) {
        expect(response.headers().location).toBe('/fitness/progress?saved=1')
      }
    }

    async function usableWorkout(page) {
      const form = page.locator('[data-action="set"]')
      await expect(form).toBeVisible()
      for (const [name, mode] of [
        ['weight', 'decimal'],
        ['reps', 'numeric'],
        ['rpe', 'decimal']
      ]) {
        const input = form.locator(`[name="${name}"]`)
        await expect(input).toBeVisible()
        await expect(input).toHaveAttribute('type', 'number')
        await expect(input).toHaveAttribute('inputmode', mode)
        const box = await input.boundingBox()
        expect(box.height, `${name} touch height`).toBeGreaterThanOrEqual(44)
        expect(box.width, `${name} input width`).toBeGreaterThanOrEqual(60)
        expect(
          await input.evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize)),
          `${name} mobile zoom prevention`
        ).toBeGreaterThanOrEqual(16)
      }
      const button = form.getByRole('button', { name: /完成本组/ })
      await expect(button).toBeEnabled()
      expect((await button.boundingBox()).height).toBeGreaterThanOrEqual(44)
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth),
        'workout must not overflow the viewport horizontally'
      ).toBeLessThanOrEqual(1)
    }

    try {
      let data = await state()
      expect(data.sessions, 'Use an empty, isolated e2e database').toEqual([])
      expect(data.sets).toEqual([])
      expect(data.weights).toEqual([])
      expect(data.exercises.length).toBeGreaterThanOrEqual(30)
      expect(data.exercises.length).toBeLessThanOrEqual(50)
      const days = [...data.days].sort((a, b) => a.position - b.position)
      expect(days.map((day) => day.id)).toEqual(['A', 'B', 'C', 'D'])
      const equipment = [...new Set(data.exercises.flatMap((exercise) => exercise.equipment))]
      const startBody = (id) => ({ id, location: '健身房', equipment })

      await goto(desktop, '/fitness/history')
      await expect(desktop.getByRole('heading', { name: '训练日记还是空白' })).toBeVisible()
      await goto(phone, '/fitness/workout')
      await expect(phone.getByRole('button', { name: /开始 Day A 训练/ })).toBeVisible()

      const firstId = randomUUID()
      const secondId = randomUUID()
      await Promise.all([
        post(desktopContext, 'start', startBody(firstId)),
        post(phoneContext, 'start', startBody(secondId))
      ])
      data = await state(phoneContext)
      expect(data.sessions).toHaveLength(1)
      const session = data.sessions[0]
      expect([firstId, secondId]).toContain(session.id)
      expect(session.status).toBe('active')
      expect(session.dayId).toBe('A')
      const slots = data.sessionExercises
        .filter((slot) => slot.sessionId === session.id)
        .sort((a, b) => a.position - b.position)
      expect(slots).toHaveLength(data.plan.filter((slot) => slot.dayId === 'A').length)
      const firstSlot = slots[0]
      expect(firstSlot.exerciseId).toBe('barbell-bench-press')
      expect(firstSlot.sets).toBe(3)

      for (const page of [desktop, phone]) {
        await goto(page, '/fitness/workout')
        await usableWorkout(page)
      }
      await desktop.screenshot({ path: testInfo.outputPath('fitness-workout-desktop.png') })
      await phone.screenshot({ path: testInfo.outputPath('fitness-workout-iphone-390.png') })

      const firstSet = {
        sessionExerciseId: firstSlot.id,
        setNumber: 1,
        weight: 50,
        reps: 10,
        rpe: 7.5,
        version: 0
      }
      data = await post(desktopContext, 'set', firstSet)
      expect(data.sets).toHaveLength(1)
      expect(data.sets[0]).toMatchObject({ weight: 50, reps: 10, rpe: 7.5, version: 1 })
      const savedId = data.sets[0].id
      await post(phoneContext, 'set', firstSet)
      data = await state(phoneContext)
      expect(data.sets).toHaveLength(1)
      expect(data.sets[0].id).toBe(savedId)

      data = await post(phoneContext, 'set', { ...firstSet, weight: 52.5, version: 1 })
      expect(data.sets[0]).toMatchObject({ id: savedId, weight: 52.5, version: 2 })
      await post(desktopContext, 'set', { ...firstSet, weight: 47.5, version: 1 }, 409)
      data = await state()
      expect(data.sets).toHaveLength(1)
      expect(data.sets[0]).toMatchObject({ weight: 52.5, version: 2 })

      await post(
        phoneContext,
        'set',
        { ...firstSet, setNumber: 2 },
        403,
        'https://unrelated.example'
      )
      expect((await state()).sets).toHaveLength(1)
      await post(desktopContext, 'finish', { id: session.id }, 409)
      await post(
        desktopContext,
        'replace',
        {
          sessionExerciseId: firstSlot.id,
          previousExerciseId: firstSlot.exerciseId,
          exerciseId: 'push-up'
        },
        409
      )
      data = await state()
      expect(data.sessions[0].status).toBe('active')
      expect(data.sessionExercises.find((slot) => slot.id === firstSlot.id).exerciseId).toBe(
        'barbell-bench-press'
      )

      // A real mobile form submission writes the next group to the same server record.
      await phone.reload()
      await usableWorkout(phone)
      const form = phone.locator('[data-action="set"]')
      await expect(form.locator('[name="setNumber"]')).toHaveValue('2')
      await form.locator('[name="weight"]').fill('45')
      await form.locator('[name="reps"]').fill('9')
      await form.locator('[name="rpe"]').fill('7.5')
      await form.getByRole('button', { name: /完成本组/ }).click()
      await expect(phone.locator('[data-feedback]')).toContainText('已保存到服务器')
      data = await state(desktopContext)
      expect(data.sets).toHaveLength(2)
      expect(data.sets.find((set) => set.setNumber === 2)).toMatchObject({
        weight: 45,
        reps: 9,
        rpe: 7.5
      })
      await desktop.reload()
      await expect(desktop.locator('#fitness-workout')).toContainText('已保存 2 组')

      const preservedSets = data.sets
      data = await post(phoneContext, 'skip', { sessionExerciseId: firstSlot.id, skipped: true })
      expect(data.sets).toEqual(preservedSets)
      expect(data.sessionExercises.find((slot) => slot.id === firstSlot.id)).toMatchObject({
        sets: 3,
        skipped: 1
      })
      for (const slot of slots.slice(1)) {
        await post(desktopContext, 'skip', { sessionExerciseId: slot.id, skipped: true })
      }
      data = await post(desktopContext, 'finish', { id: session.id, notes: 'E2E 部分组真实保存' })
      const finished = data.sessions.find((item) => item.id === session.id)
      expect(finished).toMatchObject({ status: 'completed', notes: 'E2E 部分组真实保存' })
      expect(finished.finishedAt).toBeTruthy()
      expect(finished.duration).toBeGreaterThanOrEqual(0)
      expect(data.sets).toEqual(preservedSets)
      expect(
        data.achievements.find((achievement) => achievement.id === 'first-workout').unlockedAt
      ).toBeTruthy()
      data = await post(phoneContext, 'finish', { id: session.id, notes: '重复提交' })
      expect(data.sessions.find((item) => item.id === session.id)).toEqual(finished)
      expect(data.sessions.filter((item) => item.status === 'completed')).toHaveLength(1)

      await goto(desktop, '/fitness/dashboard')
      await expect(desktop.locator('#fit-next-title')).toHaveText(days[1].name)
      await goto(desktop, '/fitness/history')
      await expect(
        desktop.locator(`a.fit-session-row[href="/fitness/history/${session.id}"]`)
      ).toContainText('2 组')
      await goto(desktop, `/fitness/history/${session.id}`)
      const table = desktop.getByRole('table', { name: '杠铃卧推每组记录' })
      await expect(table.locator('tbody tr')).toHaveCount(2)
      await expect(table.locator('tbody tr').first()).toContainText('52.5')
      await expect(table.locator('tbody tr').nth(1)).toContainText('45')
      await expect(desktop.getByText('E2E 部分组真实保存', { exact: true })).toBeVisible()
      await goto(phone, '/fitness/exercises/barbell-bench-press')
      await expect(phone.locator('.fit-history-sets')).toContainText('52.5 kg × 10 · RPE 7.5')
      await expect(phone.locator('.fit-history-sets')).toContainText('45 kg × 9 · RPE 7.5')
      await expect(
        phone.getByRole('img', { name: '每次训练最高重量趋势', exact: true })
      ).toBeVisible()
      await goto(phone, '/fitness/exercises/goblet-squat')
      await expect(
        phone.locator('img[src="/static/fitness/media/goblet-squat-0.png"]')
      ).toHaveCount(1)
      await expect(
        phone.locator('video source[src="/static/fitness/media/kettlebell-goblet-squat.webm"]')
      ).toHaveCount(1)
      await expect(phone.locator('video')).toHaveAttribute('playsinline', '')
      await goto(phone, '/fitness/exercises/incline-walk')
      await expect(
        phone.locator('img[src="/static/fitness/media/incline-walk-0.png"]')
      ).toHaveCount(1)

      const dayBId = randomUUID()
      data = await post(phoneContext, 'start', startBody(dayBId))
      expect(data.sessions.find((item) => item.id === dayBId)).toMatchObject({
        dayId: 'B',
        status: 'active'
      })
      data = await post(desktopContext, 'finish', { id: dayBId, abandon: true })
      expect(data.sessions.find((item) => item.id === dayBId).status).toBe('abandoned')
      expect(data.sessions.filter((item) => item.status === 'completed')).toHaveLength(1)
      const resumedBId = randomUUID()
      data = await post(desktopContext, 'start', startBody(resumedBId))
      expect(data.sessions.find((item) => item.id === resumedBId).dayId).toBe('B')
      await post(phoneContext, 'finish', { id: resumedBId, abandon: true })

      const date = new Intl.DateTimeFormat('en-CA', {
        timeZone: data.profile.timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(new Date())
      const tomorrow = new Date(`${date}T12:00:00Z`)
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
      await weight(desktopContext, date, '70')
      await weight(phoneContext, date, '69.8')
      await weight(phoneContext, '2026-02-30', '70', 400)
      await weight(phoneContext, 'not-a-date', '70', 400)
      await weight(phoneContext, tomorrow.toISOString().slice(0, 10), '70', 400)
      data = await state()
      expect(data.weights).toEqual([{ date, weightKg: 69.8 }])
      await goto(desktop, '/fitness/progress')
      const weights = desktop.getByRole('table', { name: '体重记录' })
      await expect(weights.locator('tbody tr')).toHaveCount(1)
      await expect(weights).toContainText('69.8')
      expect(data.sessions).toHaveLength(3)
      expect(data.sessions.filter((item) => item.status === 'active')).toEqual([])
      expect(errors).toEqual([])
    } finally {
      await desktopContext.close()
      await phoneContext.close()
    }
  })
})

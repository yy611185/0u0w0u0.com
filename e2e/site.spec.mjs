import { expect, test } from '@playwright/test'

function collectCspErrors(page) {
  const errors = []
  page.on('console', (message) => {
    if (message.type() !== 'error') return
    const text = message.text()
    if (/content security policy|refused to (apply|execute|load)/i.test(text)) errors.push(text)
  })
  page.on('pageerror', (error) => errors.push(error.message))
  return errors
}

test('homepage renders without CSP errors and same-page contact navigation works', async ({ page }) => {
  const errors = collectCspErrors(page)
  await page.goto('/')

  await expect(page.locator('h1')).toContainText('OuOwOuO')
  await page.locator('.nav-cta').click()
  await expect(page).toHaveURL(/#contact$/)
  await expect(page.locator('#contact')).toBeInViewport()
  expect(errors).toEqual([])
})

test('search index is lazy-loaded once and keyboard activation navigates', async ({ page }) => {
  let indexRequests = 0
  page.on('request', (request) => {
    if (new URL(request.url()).pathname === '/api/search-index') indexRequests += 1
  })

  await page.goto('/notes')
  expect(indexRequests).toBe(0)

  await page.keyboard.press('Control+K')
  await expect(page.locator('#search-modal')).toHaveAttribute('aria-hidden', 'false')
  await expect.poll(() => indexRequests).toBe(1)
  await page.locator('#search-input').fill('Hermes')
  await expect(page.locator('.search-item-title', { hasText: 'Hermes' })).toBeVisible()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/projects\/hermes$/)

  await page.keyboard.press('Control+K')
  await page.keyboard.press('Escape')
  expect(indexRequests).toBe(1)
})

test('mobile drawer traps interaction and Escape restores the trigger', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')

  const toggle = page.locator('[data-menu-toggle]')
  const menu = page.locator('#mobile-menu')
  await toggle.click()
  await expect(menu).toHaveAttribute('aria-hidden', 'false')
  await expect(menu.locator('a').first()).toBeFocused()

  await page.keyboard.press('Escape')
  await expect(menu).toHaveAttribute('aria-hidden', 'true')
  await expect(toggle).toBeFocused()
})

test('photo lightbox supports keyboard navigation and closes cleanly', async ({ page }) => {
  await page.goto('/photos')

  await page.locator('.photo-btn').first().click()
  const lightbox = page.locator('#lightbox')
  await expect(lightbox).toHaveAttribute('aria-hidden', 'false')
  await expect(page.locator('#lightbox-count')).toHaveText('1 / 4')

  await page.keyboard.press('ArrowRight')
  await expect(page.locator('#lightbox-count')).toHaveText('2 / 4')
  await page.keyboard.press('Escape')
  await expect(lightbox).toHaveAttribute('aria-hidden', 'true')
})

test('project pages publish accurate social image dimensions', async ({ page }) => {
  await page.goto('/projects/hermes')

  await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute('content', '1024')
  await expect(page.locator('meta[property="og:image:height"]')).toHaveAttribute('content', '768')
})

test('404 responses keep the HTTP status and noindex policy', async ({ page }) => {
  const response = await page.goto('/definitely-missing-page')

  expect(response?.status()).toBe(404)
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow')
})

test('switching to reduced motion stops active hero parallax', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/')
  await page.evaluate(() => window.scrollTo(0, 320))
  await expect
    .poll(() => page.locator('.hero-text').evaluate((element) => element.style.transform))
    .not.toBe('')

  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect
    .poll(() => page.locator('.hero-text').evaluate((element) => element.style.transform))
    .toBe('')
  await expect
    .poll(() => page.locator('.hero').evaluate((element) => element.style.backgroundPosition))
    .toBe('')
})

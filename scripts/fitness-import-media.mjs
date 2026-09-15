import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

// Pin the exact dataset and retain its license alongside the hosted assets.
const commit = 'a859101d633a01c4a1a920d6a8ce41dabba0705f'
const upstream = `https://raw.githubusercontent.com/yuhonas/free-exercise-db/${commit}`
const root = fileURLToPath(new URL('../', import.meta.url))
const mediaDirectory = path.join(root, 'public/static/fitness/media')
const catalog = JSON.parse(await readFile(path.join(root, 'src/fitness/catalog.json'), 'utf8'))
const verify = process.argv.includes('--verify')
const manifestPath = path.join(mediaDirectory, 'manifest.json')
const generatedManifestPath = path.join(mediaDirectory, 'generated-manifest.json')
const hash = (data) => createHash('sha256').update(data).digest('hex')

async function download(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(30_000) })
  if (!response.ok) throw new Error(`Download failed: ${response.status} ${url}`)
  return Buffer.from(await response.arrayBuffer())
}

if (verify) {
  const manifests = [
    JSON.parse(await readFile(manifestPath, 'utf8')),
    JSON.parse(await readFile(generatedManifestPath, 'utf8'))
  ]
  if (manifests[0].commit !== commit) throw new Error('Unexpected media manifest revision')
  for (const manifest of manifests) {
    for (const item of manifest.files) {
      const bytes = await readFile(path.join(mediaDirectory, item.file))
      if (bytes.length !== item.bytes || hash(bytes) !== item.sha256)
        throw new Error(`Media checksum mismatch: ${item.file}`)
    }
  }
  const files = new Set(
    manifests.flatMap((manifest) =>
      manifest.files.map((item) => `/static/fitness/media/${item.file}`)
    )
  )
  for (const exercise of catalog) {
    const references = [
      exercise.mediaUrl,
      ...exercise.mediaFrames,
      exercise.video?.url,
      exercise.video?.poster
    ].filter((reference) => reference?.startsWith('/static/fitness/media/'))
    for (const reference of references) {
      if (!files.has(reference)) throw new Error(`Untracked media: ${reference}`)
    }
  }
  console.log(
    `Verified ${manifests.reduce((total, manifest) => total + manifest.files.length, 0)} files for ${catalog.length} exercises.`
  )
} else {
  await mkdir(mediaDirectory, { recursive: true })
  const files = []
  for (const name of ['LICENSE.md', 'README.md']) {
    const bytes = await download(`${upstream}/${name}`)
    const file = `free-exercise-db-${name}`
    await writeFile(path.join(mediaDirectory, file), bytes)
    files.push({ file, sourceUrl: `${upstream}/${name}`, sha256: hash(bytes), bytes: bytes.length })
  }
  const freeExerciseDbPrefix = `https://github.com/yuhonas/free-exercise-db/blob/${commit}/exercises/`
  for (const exercise of catalog.filter((item) =>
    item.sourceUrl.startsWith(freeExerciseDbPrefix)
  )) {
    const sourceId = exercise.sourceUrl
      .split('/')
      .at(-1)
      .replace(/\.json$/, '')
    const source = JSON.parse(await download(`${upstream}/exercises/${sourceId}.json`))
    if (source.images.length !== exercise.mediaFrames.length) {
      throw new Error(`Source frame count changed: ${exercise.id}`)
    }
    for (const [index, sourceImage] of source.images.entries()) {
      const sourceUrl = `${upstream}/exercises/${sourceImage}`
      const bytes = await download(sourceUrl)
      if (bytes[0] !== 0xff || bytes[1] !== 0xd8) throw new Error(`Invalid JPEG: ${sourceUrl}`)
      const file = path.basename(exercise.mediaFrames[index])
      await writeFile(path.join(mediaDirectory, file), bytes)
      files.push({
        file,
        exerciseId: exercise.id,
        sourceUrl,
        sha256: hash(bytes),
        bytes: bytes.length
      })
    }
  }
  await writeFile(
    manifestPath,
    `${JSON.stringify({ source: 'Free Exercise DB', commit, license: 'Unlicense', files }, null, 2)}\n`
  )
  console.log(`Imported ${files.length - 2} local images from ${commit}.`)
}

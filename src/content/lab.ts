import { buildCollection, parseLabItem } from './shared'

const sources = import.meta.glob('../../content/lab/*.md', {
  eager: true,
  query: '?raw',
  import: 'default'
})

const collection = buildCollection(
  Object.entries(sources).map(([file, source]) => parseLabItem(source, file)),
  'lab'
)

export const getAllLabItems = collection.all
export const getLabItemBySlug = collection.bySlug

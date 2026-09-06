import { buildCollection, parseNote } from './shared'

const sources = import.meta.glob('../../content/notes/*.md', {
  eager: true,
  query: '?raw',
  import: 'default'
})

const collection = buildCollection(
  Object.entries(sources).map(([file, source]) => parseNote(source, file)),
  'note'
)

export const getAllNotes = collection.all
export const getNoteBySlug = collection.bySlug

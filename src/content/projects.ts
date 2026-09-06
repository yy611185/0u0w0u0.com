import { IMAGES } from '../data'
import { buildCollection, parseProject } from './shared'

const sources = import.meta.glob('../../content/projects/*.md', {
  eager: true,
  query: '?raw',
  import: 'default'
})

const covers = {
  yangfolio: IMAGES.projectYangfolio,
  blood: IMAGES.projectBlood,
  hermes: IMAGES.projectHermes
}

const collection = buildCollection(
  Object.entries(sources).map(([file, source]) => parseProject(source, file, covers)),
  'project'
)

export const getAllProjects = collection.all
export const getProjectBySlug = collection.bySlug

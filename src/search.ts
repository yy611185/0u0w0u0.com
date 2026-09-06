import { getAllLabItems, getAllNotes, getAllProjects } from './content'

export type SearchItem = {
  kind: 'project' | 'note' | 'lab' | 'page'
  icon: string
  title: string
  desc: string
  href: string
  tags: string[]
}

export function createSearchIndex(
  projects = getAllProjects(),
  notes = getAllNotes(),
  labItems = getAllLabItems()
): SearchItem[] {
  return [
    ...projects.map((item) => ({
      kind: 'project' as const,
      icon: '🎨',
      title: item.title,
      desc: item.tagline,
      href: `/projects/${item.slug}`,
      tags: item.tags
    })),
    ...notes.map((item) => ({
      kind: 'note' as const,
      icon: '📝',
      title: item.title,
      desc: item.description,
      href: `/notes/${item.slug}`,
      tags: item.tags
    })),
    ...labItems.map((item) => ({
      kind: 'lab' as const,
      icon: '🧪',
      title: item.title,
      desc: item.description,
      href: `/lab/${item.slug}`,
      tags: item.stack
    })),
    { kind: 'page', icon: '🏠', title: '首页', desc: '数字花园入口', href: '/', tags: ['首页'] },
    {
      kind: 'page',
      icon: '🎨',
      title: '项目',
      desc: '成熟作品与开发记录',
      href: '/projects',
      tags: ['作品']
    },
    {
      kind: 'page',
      icon: '📝',
      title: '笔记',
      desc: '想法、学习与写作',
      href: '/notes',
      tags: ['写作']
    },
    {
      kind: 'page',
      icon: '🧪',
      title: '实验室',
      desc: 'WIP、探索与原型',
      href: '/lab',
      tags: ['实验']
    },
    {
      kind: 'page',
      icon: '🌱',
      title: '近况',
      desc: '正在读、写、学、想什么',
      href: '/now',
      tags: ['现在']
    },
    {
      kind: 'page',
      icon: '📷',
      title: '照片',
      desc: '值得记录的瞬间',
      href: '/photos',
      tags: ['生活']
    },
    {
      kind: 'page',
      icon: '👋',
      title: '关于',
      desc: '关于 Yang 与这个数字花园',
      href: '/about',
      tags: ['Yang']
    }
  ]
}

export const SEARCH_INDEX = createSearchIndex()

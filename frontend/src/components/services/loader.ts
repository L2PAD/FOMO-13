import { loaderApi } from './config'

export default (path: string | undefined): string => {
  if (!path) return ''

  const normalizedPath = path.trim()

  if (
    normalizedPath.startsWith('http://') ||
    normalizedPath.startsWith('https://') ||
    normalizedPath.startsWith('//') ||
    normalizedPath.startsWith('data:') ||
    normalizedPath.startsWith('blob:')
  ) return normalizedPath

  if (/^\/?uploads(?:\/|$)/i.test(normalizedPath)) {
    const filePath = normalizedPath.replace(/^\/?uploads\/?/i, '')
    return filePath ? `${loaderApi}/uploads/${filePath}` : `${loaderApi}/uploads`
  }

  if (normalizedPath.startsWith('/')) return `${loaderApi}/uploads${normalizedPath}`

  return `${loaderApi}/uploads/${normalizedPath}`
}

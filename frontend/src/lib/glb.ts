const GLB_EXTENSION = '.glb'

/** API proxy URLs stream GLB without .glb suffix */
function isGlbStreamUrl(url: string): boolean {
  const path = url.split('?')[0].toLowerCase()
  return (
    path.endsWith('/model/file') ||
    /\/models\/[^/]+\/file$/.test(path) ||
    (path.includes('/storage/') && path.endsWith('.glb'))
  )
}

export function isGlbUrl(url: string): boolean {
  const lower = url.toLowerCase()
  return lower.startsWith('blob:') || lower.endsWith(GLB_EXTENSION) || isGlbStreamUrl(url)
}

export function assertGlbUrl(url: string): string {
  if (!isGlbUrl(url)) {
    throw new Error(`Only .glb supported, got: ${url}`)
  }
  return url
}

export { GLB_EXTENSION }

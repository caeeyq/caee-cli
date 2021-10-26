export interface NpmInfo {
  name: string
  'dist-tags': { latest: string }
  versions: Record<string, { name: string; version: string }>
}

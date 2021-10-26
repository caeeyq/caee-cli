import axios from 'axios'
import urljoin from 'url-join'
import semver from 'semver'
import { NpmInfo } from './types'

export async function getNpmInfo(pkgName: string, registry?: string) {
  const registryUrl: string = registry || getDefaultRegistryUrl()
  const npmInfoUrl = urljoin(registryUrl, pkgName)
  return axios.get<NpmInfo>(npmInfoUrl).then(res => res.data)
}

function getDefaultRegistryUrl(isOriginal = true) {
  const originalUrl = 'https://registry.npmjs.org'
  const taobaoUrl = 'https://registry.npm.taobao.org'
  return isOriginal ? originalUrl : taobaoUrl
}

export async function getNpmVersions(pkgName: string, registry?: string) {
  const npmInfo = await getNpmInfo(pkgName, registry)
  return Object.keys(npmInfo.versions)
}

export async function getGtNpmVersions(baseVersion: string, pkgName: string, registry?: string) {
  const versions = await getNpmVersions(pkgName, registry)
  return versions
    .filter(version => semver.gt(version, baseVersion))
    .sort((a, b) => (semver.gt(a, b) ? -1 : 1))
}

export async function getLastVersion(baseVersion: string, pkgName: string, registry?: string) {
  const newVersions = await getGtNpmVersions(baseVersion, pkgName, registry)
  if (newVersions.length > 0) {
    return newVersions[0]
  }
}

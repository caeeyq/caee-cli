const axios = require('axios')
const urljoin = require('url-join')
const semver = require('semver')

async function getNpmInfo(pkgName, registry) {
  const registryUrl = registry || getDefaultRegistryUrl()
  const npmInfoUrl = urljoin(registryUrl, pkgName)
  return axios.get(npmInfoUrl).then(res => res.data)
}

function getDefaultRegistryUrl(isOriginal = true) {
  const originalUrl = 'https://registry.npmjs.org'
  const taobaoUrl = 'https://registry.npm.taobao.org'
  return isOriginal ? originalUrl : taobaoUrl
}

async function getNpmVersions(pkgName, registry) {
  const npmInfo = await getNpmInfo(pkgName, registry)
  return Object.keys(npmInfo.versions)
}

async function getGtNpmVersions(baseVersion, pkgName, registry) {
  const versions = await getNpmVersions(pkgName, registry)
  return versions
    .filter(version => semver.gt(version, baseVersion))
    .sort((a, b) => (semver.gt(a, b) ? -1 : 1))
}

async function getLastVersion(baseVersion, pkgName, registry) {
  const newVersions = await getGtNpmVersions(baseVersion, pkgName, registry)
  if (newVersions.length > 0) {
    return newVersions[0]
  }
}

module.exports = {
  getNpmInfo,
  getDefaultRegistryUrl,
  getNpmVersions,
  getGtNpmVersions,
  getLastVersion,
}

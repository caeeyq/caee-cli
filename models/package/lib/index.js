const pkgDir = require('pkg-dir')
const path = require('path')
const npminstall = require('npminstall')
const pathExists = require('path-exists')
const { mkdirpSync } = require('fs-extra')

const { formatPath } = require('@caee/cli-utils-common')
const { getDefaultRegistryUrl, getLastVersion } = require('@caee/cli-utils-get-npm-info')
const { log } = require('@caee/cli-utils-log')

class Package {
  /** package路径 */
  targetPath
  /** 包缓存路径? */
  storePath
  /** package名字 */
  packageName
  /** package版本 */
  packageVersion
  /** 缓存路径前缀 */
  catchFilePathPrefix
  /** 缓存路径后缀 */
  catchFilePathSuffix
  /** package缓存文件夹 */
  packageFileCollection

  constructor(packageName_, packageVersion_, targetPath_, storePath_) {
    this.packageName = packageName_
    this.packageVersion = packageVersion_
    this.targetPath = targetPath_
    this.storePath = storePath_
    this.catchFilePathPrefix = this.packageName.replace('/', '_')
    this.catchFilePathSuffix = this.packageName.split('/')[0]
    this.packageFileCollection = this.packageName.split('/')[1]

    log.verbose('package construct', 'packageName', this.packageName)
    log.verbose('package construct', 'packageVersion', this.packageVersion)
    log.verbose('package construct', 'targetPath', this.targetPath)
    log.verbose('package construct', 'storePath', this.storePath)
    log.verbose('package construct', 'catchFilePathPrefix', this.catchFilePathPrefix)
    log.verbose('package construct', 'catchFilePathSuffix', this.catchFilePathSuffix)
    log.verbose('package construct', 'packageFileCollection', this.packageFileCollection)
  }

  async prepare() {
    if (this.storePath && !pathExists.sync(this.storePath)) {
      mkdirpSync(this.storePath)
    }
    if (this.packageVersion === 'latest') {
      this.packageVersion = (await getLastVersion('0.0.0', this.packageName)) || 'latest'
    }
  }

  get catchFilePath() {
    // _@caee_cli-command-init@0.0.13@@caee
    const fileName = `_${this.catchFilePathPrefix}@${this.packageVersion}@${this.catchFilePathSuffix}`
    const catchPath = path.resolve(this.storePath, fileName)
    log.verbose('package get catchFilePath', 'value', catchPath)
    return catchPath
  }

  getSpecificCatchFilePath(version) {
    const fileName = `_${this.catchFilePathPrefix}@${version}@${this.catchFilePathSuffix}`
    const catchPath = path.resolve(this.storePath, fileName)
    log.verbose('package getSpecificCatchFilePath', 'catchPath', catchPath)
    return catchPath
  }

  /**
   * 检查包是否存在
   */
  async exists() {
    if (this.storePath) {
      // 如果指定缓存路径
      await this.prepare()
      return pathExists.sync(this.catchFilePath)
    } else if (this.targetPath) {
      return pathExists.sync(this.targetPath)
    }
  }

  /**
   * 安装包
   */
  async install() {
    await this.prepare()
    this.storePath &&
      (await npminstall({
        root: this.targetPath,
        storeDir: this.storePath,
        registry: getDefaultRegistryUrl(),
        pkgs: [{ name: this.packageName, version: this.packageVersion }],
      }))
  }

  /**
   * 更新包
   */
  async update() {
    await this.prepare()
    const pkgLastVersion = await getLastVersion('0.0.0', this.packageName)
    log.verbose(
      `package update ${this.packageName}`,
      `获取到最新版本号${pkgLastVersion}, 查看是否需要更新...`,
    )
    if (pkgLastVersion) {
      const catchPath = this.getSpecificCatchFilePath(pkgLastVersion)
      if (!pathExists.sync(catchPath)) {
        log.verbose(
          `package update ${this.packageName}`,
          `本地版本${this.packageVersion}过旧, 正在更新最新版本...`,
        )
        await npminstall({
          root: this.targetPath,
          storeDir: this.storePath,
          registry: getDefaultRegistryUrl(),
          pkgs: [{ name: this.packageName, version: pkgLastVersion }],
        })
        this.packageVersion = pkgLastVersion
      }
      return catchPath
    }
  }

  /**
   * 获取入口文件地址
   */
  getRootFilePath() {
    function _getRootPath(targetPath) {
      const rootDir = pkgDir.sync(targetPath)
      if (rootDir) {
        const pkgPath = path.resolve(rootDir, 'package.json')
        const pkgFile = require(pkgPath)
        if (pkgFile && pkgFile.main) {
          const rootFilePath = formatPath(path.resolve(rootDir, pkgFile.main))
          log.verbose('package getRootFilePath', 'rootFilePath', rootFilePath)
          return rootFilePath
        }
      }
    }
    if (this.storePath) {
      return _getRootPath(path.resolve(this.catchFilePath, this.packageFileCollection))
    } else {
      return _getRootPath(this.targetPath)
    }
  }
}

module.exports = {
  Package,
}

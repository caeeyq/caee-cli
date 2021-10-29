import pkgDir from 'pkg-dir'
import path from 'path'
import npminstall from 'npminstall'
import pathExists from 'path-exists'
import { mkdirpSync } from 'fs-extra'

import { formatPath } from '@caee/cli-utils-common'
import { getDefaultRegistryUrl, getLastVersion } from '@caee/cli-utils-get-npm-info'
import { log } from '@caee/cli-utils-log'

export class Package {
  /** package路径 */
  private targetPath: string
  /** 包缓存路径 */
  private storePath?: string
  /** package名字 */
  private packageName: string
  /** package版本 */
  private packageVersion: string

  private catchFilePathPrefix: string

  private catchFilePathSuffix: string

  /** package缓存文件夹 */
  private packageFileCollection: string

  constructor(
    packageName_: string,
    packageVersion_: string,
    targetPath_: string,
    storePath_?: string,
  ) {
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

    // _@caee_cli-command-init@0.0.13@@caee
  }

  async prepare() {
    if (this.storePath && !pathExists.sync(this.storePath)) {
      mkdirpSync(this.storePath)
    }
    if (this.packageVersion === 'latest') {
      this.packageVersion = (await getLastVersion('0.0.0', this.packageName)) || 'latest'
    }
  }

  private get catchFilePath() {
    const fileName = `_${this.catchFilePathPrefix}@${this.packageVersion}@${this.catchFilePathSuffix}`
    const catchPath = path.resolve(this.storePath!, fileName)
    log.verbose('package get catchFilePath', 'value', catchPath)
    return catchPath
  }

  getSpecificCatchFilePath(version: string) {
    const fileName = `_${this.catchFilePathPrefix}@${version}@${this.catchFilePathSuffix}`
    const catchPath = path.resolve(this.storePath!, fileName)
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
          storeDir: this.storePath!,
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
    function _getRootPath(targetPath: string) {
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

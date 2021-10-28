import pkgDir from 'pkg-dir'
import path from 'path'
import npminstall from 'npminstall'

import { formatPath } from '@caee/cli-utils-common'
import { getDefaultRegistryUrl } from '@caee/cli-utils-get-npm-info'

export class Package {
  /** package路径 */
  private targetPath: string
  /** 包缓存路径 */
  private storePath: string
  /** package名字 */
  private packageName: string
  /** package版本 */
  private packageVersion: string

  constructor(
    packageName_: string,
    packageVersion_: string,
    targetPath_: string,
    storePath_?: string,
  ) {
    this.packageName = packageName_
    this.packageVersion = packageVersion_
    this.targetPath = targetPath_
    if (!storePath_) {
      this.storePath = path.resolve(this.targetPath, 'node_modules')
    } else {
      this.storePath = storePath_
    }
  }

  /**
   * 检查包是否存在
   */
  exists() {
    return false
  }

  /**
   * 安装包
   */
  async install() {
    await npminstall({
      root: this.targetPath,
      storeDir: this.storePath,
      registry: getDefaultRegistryUrl(),
      pkgs: [{ name: this.packageName, version: this.packageVersion }],
    })
  }

  /**
   * 更新包
   */
  update() {}

  /**
   * 获取入口文件地址
   */
  getRootFilePath() {
    const rootDir = pkgDir.sync(this.targetPath)
    if (rootDir) {
      const pkgPath = path.resolve(rootDir, 'package.json')
      const pkgFile = require(pkgPath)
      if (pkgFile && pkgFile.main) {
        const rootFilePath = path.resolve(rootDir, pkgFile.main)
        return formatPath(rootFilePath)
      }
    }
  }
}

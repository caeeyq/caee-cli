import pkgDir from 'pkg-dir'
import path from 'path'

import { formatPath } from '@caee/cli-utils-common'

export class Package {
  /** package路径 */
  private targetPath: string
  /** package名字 */
  private packageName: string
  /** package版本 */
  private packageVersion: string

  constructor(targetPath_: string, packageName_: string, packageVersion_: string) {
    this.targetPath = targetPath_
    this.packageName = packageName_
    this.packageVersion = packageVersion_
  }

  /**
   * 检查包是否存在
   */
  exists() {}

  /**
   * 安装包
   */
  install() {}

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

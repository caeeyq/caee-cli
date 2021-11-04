const fs = require('fs')
const inquirer = require('inquirer')
const fse = require('fs-extra')
const path = require('path')
const semver = require('semver')
const ejs = require('ejs')

const {Command} = require('@caee/cli-models-command')
const {Package} = require('@caee/cli-models-package')
const {startLoading, execAsync, globAsync} = require('@caee/cli-utils-common')
const {log} = require('@caee/cli-utils-log')

const {getTemplateInfo} = require('./api')

const TYPE_PROJECT = 'project'
const TYPE_COMPONENT = 'component'

const TEMPLATE_CATCH_DIR = 'template'

const TEMPLATE_NORMAL_TYPE = 'normal'
const TEMPLATE_CUSTOM_TYPE = 'custom'

const WHITE_TEMPLATE_CMD = ['npm', 'cnpm']

class InitCommand extends Command {
  /** 项目名称 */
  projectName
  /** 是否强制更新 */
  force
  /** 用户输入的项目信息 */
  projectInfo
  /** 远端获取的项目模板信息列表 */
  templateList
  /**
   * 模板包实例
   * @type Package
   */
  templatePackage

  constructor(argv) {
    super(argv)
  }

  init() {
    this.projectName = this.values[0]
    this.force = !!this.opts.force
    this.templateList = []
    log.verbose('InitCommand init', 'projectName', this.projectName)
    log.verbose('InitCommand init', 'force', this.force)
  }

  async exec() {
    try {
      this.projectInfo = await this.prepare()
      if (!this.projectInfo) return
      log.verbose('InitCommand', 'exec projectInfo', this.projectInfo)
      await this.downloadTemplate()
      await this.installTemplate()
    } catch (e) {
      log.error('InitCommand', 'exec', e.message)
    }
  }

  /**
   * 安装模板
   * @returns {Promise<void>}
   */
  async installTemplate() {
    const {templateInfo} = this.projectInfo
    if (!templateInfo) throw new Error('模板信息不存在！')
    if (!templateInfo.type) templateInfo.type = TEMPLATE_NORMAL_TYPE
    switch (templateInfo.type) {
      case TEMPLATE_NORMAL_TYPE:
        await this.installNormalTemplate()
        break
      case TEMPLATE_CUSTOM_TYPE:
        await this.installCustomTemplate()
        break
      default:
        throw new Error('未知的模板类型！')
    }
  }

  /**
   * 安装标准模板
   * @returns {Promise<void>}
   */
  async installNormalTemplate() {
    const spinner = startLoading('正在安装模板...')
    const {packageFileCollection} = this.templatePackage
    const {templateInfo} = this.projectInfo
    try {
      const templatePath = path.resolve(this.templatePackage.catchFilePath, packageFileCollection, 'template')
      const targetPath = process.cwd()
      fse.ensureDirSync(templatePath)
      fse.ensureDirSync(targetPath)
      fse.copySync(templatePath, targetPath)
    } catch (e) {
      throw e
    } finally {
      spinner.stop(true)
    }
    const ignore = ['node_modules/**', '**/public/**', '**/assets/**']
    await this.ejsRender({ignore})
    log.info('installNormalTemplate', `${templateInfo.name} 模板安装完成:)`)
    log.info('installNormalTemplate', `执行 ${templateInfo.name} 模板依赖安装`)
    const {installCommand = 'npm install', startCommand = 'npm run dev'} = templateInfo
    await this.execCommand(installCommand, '依赖安装过程出错！')
    await this.execCommand(startCommand, '启动模板过程出错！')
  }

  /**
   * 安装自定义模板
   * @returns {Promise<void>}
   */
  async installCustomTemplate() {
    console.log('安装自定义模板...')
  }

  /**
   * ejs渲染
   * @param option
   * @returns {Promise<unknown[]>}
   */
  async ejsRender(option) {
    const targetPath = process.cwd()
    const filesPathList = await globAsync('**', {ignore: option.ignore, cwd: targetPath, nodir: true})
    const renderPromiseList = filesPathList.map(filePath => new Promise((resolve, reject) => {
      ejs.renderFile(filePath, this.projectInfo, {}, (err, str) => {
        if (err) reject(err)
        fse.writeFileSync(filePath, str)
        resolve()
      })
    }))
    return Promise.all(renderPromiseList)
  }

  /**
   * 执行指定命令
   * @param commandStr
   * @param errMessage
   * @returns {Promise<void>}
   */
  async execCommand(commandStr, errMessage) {
    const commandList = commandStr.split(' ')
    const cmd = this.checkCmd(commandList[0])
    const args = commandList.splice(1)
    log.verbose('InitCommand', 'execCommand', commandList, cmd, args)

    if (!cmd) throw new Error(`异常命令，无法执行，命令：${commandStr}`)
    const res = await execAsync(cmd, args, {stdio: 'inherit'})
    if (res !== 0) throw new Error(errMessage)
  }

  checkCmd(cmd) {
    if (WHITE_TEMPLATE_CMD.includes(cmd)) return cmd
    return null
  }

  /**
   * 下载更新本地模板缓存
   * @returns {Promise<void>}
   */
  async downloadTemplate() {
    const {templateInfo} = this.projectInfo
    const targetPath = path.resolve(process.env.CAEE_CLI_HOME_PATH, TEMPLATE_CATCH_DIR)
    const storePath = path.resolve(targetPath, 'node_modules')
    const {npmName, version, name} = templateInfo
    this.templatePackage = new Package(npmName, version, targetPath, storePath)
    const spinner = startLoading(`正在下载 ${name} 模板...`)
    try {
      if (await this.templatePackage.exists()) {
        await this.templatePackage.update()
      } else {
        await this.templatePackage.install()
      }
    } catch (e) {
      throw e
    } finally {
      spinner.stop(true)
    }
    log.info('installTemplate', `${name} 模板下载完成`)
  }

  async prepare() {
    this.templateList = await getTemplateInfo()
    if (this.templateList.length <= 0) {
      throw new Error('远端无模板数据！')
    }
    log.verbose('InitCommand', 'prepare templateInfo', this.templateList)
    const cwdPath = process.cwd()
    // 1. 判断当前目录是否为空
    if (!this.isDirEmpty(cwdPath)) {
      let ifContinue = false
      if (!this.force) {
        // 1.1 询问是否继续创建
        ifContinue = (await inquirer.prompt({
          type: 'confirm',
          name: 'ifContinue',
          default: false,
          message: '当前文件夹不为空,是否继续创建?',
        })).ifContinue
        if (!ifContinue) return
      }
      // 2. 是否启用强制更新
      if (ifContinue || this.force) {
        const {clearDir} = await inquirer.prompt({
          type: 'confirm',
          name: 'clearDir',
          default: false,
          message: '是否确认清空当前目录?'
        })
        if (clearDir) {
          const spinner = startLoading('正在删除当前目录下所有文件...')
          log.verbose('InitCommand', 'prepare', '清空当前目录...')
          await fse.emptyDir(cwdPath)
          spinner.stop(true)
        }
      }
    }
    return this.getProjectInfo()
  }

  /**
   * 获取用户输入需要创建的项目信息
   * @returns {Promise<{}>}
   */
  async getProjectInfo() {
    let projectInfo = {}
    // 3. 选择创建项目还是组件
    const {type} = await inquirer.prompt(
      {
        type: 'list',
        name: 'type',
        message: '请选择创建类型',
        default: TYPE_PROJECT,
        choices: [{value: TYPE_PROJECT, name: '项目'}, {value: TYPE_COMPONENT, name: '组件'}]
      }
    )
    log.verbose('InitCommand', 'getProjectInfo type: ', type)
    if (type === TYPE_PROJECT) {
      log.verbose('InitCommand', '当前为项目类型,进入项目信息获取流程...')
      const info = await inquirer.prompt([
        {
          type: 'input',
          name: 'projectName',
          message: '请输入项目名称',
          default: this.projectName || 'caee-demo',
          validate: function (v) {
            // 1. 首字符必须为英文字符
            // 2. 尾字符必须为英文或者数字
            // right: a-b, a_b, aaa, bbb, aa11
            // wrong: a_ a-
            const reg = /^[a-zA-Z]+([-][a-zA-Z][a-zA-Z0-9]*|[_][a-zA-Z][a-zA-Z0-9]*|[a-zA-Z0-9]*$)/
            const done = this.async();
            setTimeout(function () {
              if (!reg.test(v)) {
                done('请输入合法的项目名称！');
                return;
              }
              done(null, true);
            }, 0);
          }
        },
        {
          type: 'input',
          name: 'projectVersion',
          message: '请输入项目版本号',
          default: '0.0.0',
          validate: function (v) {
            const done = this.async();
            setTimeout(function () {
              if (!(!!semver.valid(v))) {
                done('请输入合法的版本号！');
                return;
              }
              done(null, true);
            }, 0);
          },
          filter: (v) => semver.valid(v) || v
        },
        {
          type: 'list',
          name: 'templateInfo',
          message: '请选择合适的模板',
          choices: this.getTemplateChoices(),
          filter: (templateId) => {
            return this.templateList.find(template => template._id === templateId)
          }
        }
      ])
      projectInfo = {type, ...info}
    } else if (type === TYPE_COMPONENT) {

    }
    if (projectInfo.projectName) {
      projectInfo.packageJsonName = require('kebab-case')(projectInfo.projectName).replace(/^-/, '')
    }
    // 4. 获取项目的基本信息
    return projectInfo
  }

  isDirEmpty(targetPath) {
    const fileList = fs.readdirSync(targetPath).filter(fileName => {
      const whiteList = ['node_modules']
      return !fileName.startsWith('.') && !whiteList.includes(fileName)
    })
    return fileList.length <= 0
  }

  getTemplateChoices() {
    return this.templateList.map(template => {
      return {
        value: template._id,
        name: template.name
      }
    })
  }
}

function init(argv) {
  return new InitCommand(argv)
}

module.exports = init
module.exports.InitCommand = InitCommand

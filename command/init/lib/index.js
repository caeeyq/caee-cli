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
   * 做一些准备工作
   * 1. 获取服务端模板列表
   * 2. 判断当前执行目录是否为空，并做一些目录的清理工作
   * 3. 执行一些后续的项目信息获取流程 getProjectInfo
   * @returns {Promise<{}>}
   */
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
    const {ejsIgnore = [], installCommand = 'npm install', startCommand = 'npm run dev'} = templateInfo
    log.verbose('InitCommand', 'installNormalTemplate ejsIgnore', ejsIgnore)
    await this.ejsRender({ignore: ejsIgnore})
    log.info('installNormalTemplate', `${templateInfo.name} 模板安装完成:)`)
    log.info('installNormalTemplate', `执行 ${templateInfo.name} 模板依赖安装`)
    await this.execCommand(installCommand, '依赖安装过程出错！')
    await this.execCommand(startCommand, '启动模板过程出错！')
  }

  /**
   * 安装自定义模板
   * @returns {Promise<void>}
   */
  async installCustomTemplate() {
    log.notice('installCustomTemplate', '执行安装自定义模板流程...')
    if (!await this.templatePackage.exists()) throw new Error('模板文件不存在！')
    const rootFilePath = this.templatePackage.getRootFilePath()
    if (!fse.existsSync(rootFilePath)) throw new Error('模板入口文件不存在！')

    const sourcePath = path.resolve(this.templatePackage.catchFilePath, this.templatePackage.packageFileCollection, 'template')
    const targetPath = process.cwd()
    const options = {...this.projectInfo, sourcePath, targetPath}
    const code = `require('${rootFilePath}')(${JSON.stringify(options)})`
    await execAsync('node', ['-e', code], {stdio: 'inherit', cwd: process.cwd()})
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

  /**
   * 检查执行命令，防止风险命令被执行
   * @param cmd
   * @returns {null|*}
   */
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

  /**
   * 获取用户输入需要创建的项目信息
   * @returns {Promise<{}>}
   */
  async getProjectInfo() {
    let projectInfo
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
    // 筛选模板
    this.templateList = this.templateList.filter(template => {
      const {tags = []} = template
      return tags.includes(type)
    })
    log.verbose('InitCommand', `当前为${type}类型,进入信息获取流程...`)
    const info = await inquirer.prompt(this.getInquirePromptInfo(type))
    projectInfo = {type, ...info}
    // 得到非驼峰命名
    if (projectInfo.projectName) {
      projectInfo.packageJsonName = require('kebab-case')(projectInfo.projectName).replace(/^-/, '')
    }
    return projectInfo
  }

  /**
   * 收集项目信息表单项
   * @param type
   * @returns {[{default: string, name: string, type: string, message: string, validate: validate}, {filter: (function(*=)), default: string, name: string, type: string, message: string, validate: validate}, {filter: (function(*): *), name: string, type: string, message: string, choices: *}]}
   */
  getInquirePromptInfo(type) {
    let keywords = '项目'
    switch (type) {
      case TYPE_PROJECT:
        keywords = '项目'
        break
      case TYPE_COMPONENT:
        keywords = '组件库'
    }
    const basePrompt = [
      {
        type: 'input',
        name: 'projectName',
        message: `请输入${keywords}名称`,
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
              done(`请输入合法的${keywords}名称！`);
              return;
            }
            done(null, true);
          }, 0);
        }
      },
      {
        type: 'input',
        name: 'projectVersion',
        message: `请输入${keywords}版本号`,
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
    ]
    if (type === TYPE_COMPONENT) {
      const descriptionPrompt = {
        type: 'input',
        name: 'componentLibDesc',
        message: `请输入组件库描述`,
        default: '',
        validate: function (v) {
          const done = this.async();
          setTimeout(function () {
            if (!v) {
              done(`组件库描述不能为空！`);
              return;
            }
            done(null, true);
          }, 0);
        }
      }
      basePrompt.splice(1, 0, descriptionPrompt)
    }
    return basePrompt
  }

  /**
   * 目标目录下是否为空
   * @param targetPath
   * @returns {boolean}
   */
  isDirEmpty(targetPath) {
    const fileList = fs.readdirSync(targetPath).filter(fileName => {
      const whiteList = ['node_modules']
      return !fileName.startsWith('.') && !whiteList.includes(fileName)
    })
    return fileList.length <= 0
  }

  /**
   * 格式化模板列表信息，使其符合 inquirer 列表的数据结构
   * @returns {*}
   */
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

const fs = require('fs')
const inquirer = require('inquirer')
const fse = require('fs-extra')
const path = require('path')
const semver = require('semver')

const {Command} = require('@caee/cli-models-command')
const {Package} = require('@caee/cli-models-package')
const {startLoading} = require('@caee/cli-utils-common')
const {log} = require('@caee/cli-utils-log')

const {getTemplateInfo} = require('./api')

const TYPE_PROJECT = 'project'
const TYPE_COMPONENT = 'component'
const TEMPLATE_CATCH_DIR = 'template'

class InitCommand extends Command {
  /** 项目名称 */
  projectName
  /** 是否强制更新 */
  force
  /** 用户输入的项目信息 */
  projectInfo
  /** 项目模板信息 */
  templateList

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
      log.verbose('InitCommand', 'exec projectInfo', this.projectInfo)
      await this.downloadTemplate()
    } catch (e) {
      log.error('InitCommand', 'exec', e.message)
    }
  }

  async downloadTemplate() {
    const {templateInfo} = this.projectInfo
    const targetPath = path.resolve(process.env.CAEE_CLI_HOME_PATH, TEMPLATE_CATCH_DIR)
    const storePath = path.resolve(targetPath, 'node_modules')
    const {npmName, version, name} = templateInfo
    const pkg = new Package(npmName, version, targetPath, storePath)
    const spinner = startLoading(`正在下载 ${name} 模板...`)
    if (await pkg.exists()) {
      await pkg.update()
    } else {
      await pkg.install()
    }
    spinner.stop(true)
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
          log.verbose('InitCommand', 'prepare', '清空当前目录...')
          fse.emptyDirSync(cwdPath)
        }
      }
    }
    return this.getProjectInfo()
  }

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
          default: 'caee-demo',
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

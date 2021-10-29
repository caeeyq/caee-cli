interface InitOpts {
  force: boolean
}

export default function init(projectName: string, opts: InitOpts) {
  console.log('进入init命令', projectName)
  console.log('init command opts', opts)
  console.log('init command targetPath', process.env.CAEE_CLI_TARGET_PATH)
}

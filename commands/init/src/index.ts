interface InitOpts {
  force: boolean
}

export function init(projectName: string, opts: InitOpts) {
  console.log('init command projectName', projectName)
  console.log('init command opts', opts)
  console.log('init command targetPath', process.env.CAEE_CLI_TARGET_PATH)
}

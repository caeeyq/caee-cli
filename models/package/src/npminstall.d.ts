interface NpmInstallOptions {
  root: string
  pkgs: { name: string; version: string }[]
  targetDir?: string
  registry: string
  storeDir: string
}

declare module 'npminstall' {
  export default function npminstall(optioins: NpmInstallOptions): Promise<any>
}

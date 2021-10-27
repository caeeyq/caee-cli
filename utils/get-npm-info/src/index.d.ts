import { NpmInfo } from './types';
export declare function getNpmInfo(pkgName: string, registry?: string): Promise<NpmInfo>;
export declare function getNpmVersions(pkgName: string, registry?: string): Promise<string[]>;
export declare function getGtNpmVersions(baseVersion: string, pkgName: string, registry?: string): Promise<string[]>;
export declare function getLastVersion(baseVersion: string, pkgName: string, registry?: string): Promise<string | undefined>;

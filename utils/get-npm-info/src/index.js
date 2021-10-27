"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLastVersion = exports.getGtNpmVersions = exports.getNpmVersions = exports.getNpmInfo = void 0;
const axios_1 = __importDefault(require("axios"));
const url_join_1 = __importDefault(require("url-join"));
const semver_1 = __importDefault(require("semver"));
async function getNpmInfo(pkgName, registry) {
    const registryUrl = registry || getDefaultRegistryUrl();
    const npmInfoUrl = (0, url_join_1.default)(registryUrl, pkgName);
    return axios_1.default.get(npmInfoUrl).then(res => res.data);
}
exports.getNpmInfo = getNpmInfo;
function getDefaultRegistryUrl(isOriginal = true) {
    const originalUrl = 'https://registry.npmjs.org';
    const taobaoUrl = 'https://registry.npm.taobao.org';
    return isOriginal ? originalUrl : taobaoUrl;
}
async function getNpmVersions(pkgName, registry) {
    const npmInfo = await getNpmInfo(pkgName, registry);
    return Object.keys(npmInfo.versions);
}
exports.getNpmVersions = getNpmVersions;
async function getGtNpmVersions(baseVersion, pkgName, registry) {
    const versions = await getNpmVersions(pkgName, registry);
    return versions
        .filter(version => semver_1.default.gt(version, baseVersion))
        .sort((a, b) => (semver_1.default.gt(a, b) ? -1 : 1));
}
exports.getGtNpmVersions = getGtNpmVersions;
async function getLastVersion(baseVersion, pkgName, registry) {
    const newVersions = await getGtNpmVersions(baseVersion, pkgName, registry);
    if (newVersions.length > 0) {
        return newVersions[0];
    }
}
exports.getLastVersion = getLastVersion;

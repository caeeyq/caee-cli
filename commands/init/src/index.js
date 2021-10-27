"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.init = void 0;
function init(projectName, opts) {
    console.log('init command projectName', projectName);
    console.log('init command opts', opts);
    console.log('init command targetPath', process.env.CAEE_CLI_TARGET_PATH);
}
exports.init = init;

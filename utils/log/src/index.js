"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.log = void 0;
const npmlog_1 = __importDefault(require("npmlog"));
npmlog_1.default.level = process.env.CAEE_CLI_LOG_LEVEL ? process.env.CAEE_CLI_LOG_LEVEL : 'info';
npmlog_1.default.heading = 'caee';
exports.log = npmlog_1.default;

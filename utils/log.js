let util = require("util");
/** 日志等级 */
let LEVEL = {
    ALL: Infinity,
    INFO: 3,
    WARN: 2,
    ERROR: 1,
    NONE: -Infinity
};
/** 日志颜色 */
let COLOR = {
    RESET: '\u001b[0m',
    /** 绿色 */
    INFO: '\u001b[32m',
    /** 黄色 */
    WARN: '\u001b[33m',
    /** 红色 */
    ERROR: '\u001b[31m',
}
/** 全局日志等级 */
let globalLevel = LEVEL.ALL;
/** 是否日志应该输出颜色 */
let coloredOutput = true;
/**
 * 设置等级
 * @param {*} level 等级
 */
function setLevel(level) {
    globalLevel = level;
}
/**
 * 设置是否显示颜色
 * @param {*} bool bool值
 */
function setColoredOutput(bool) {
    coloredOutput = bool;
}
/** 打印info */
function info() {
    if (LEVEL.INFO <= globalLevel) {
        log(LEVEL.INFO, util.format.apply(this, arguments));
    }
}
/** 打印warn */
function warn() {
    if (LEVEL.WARN <= globalLevel) {
        log(LEVEL.WARN, util.format.apply(this, arguments));
    }
}
/** 打印error */
function error() {
    if (LEVEL.ERROR <= globalLevel) {
        log(LEVEL.ERROR, util.format.apply(this, arguments));
    }
}
function newPrepareStackTrace(error, structuredStack) {
    return structuredStack;
}
/**
 * 输出
 * @param {*} level 等级
 * @param {*} message 消息
 */
function log(level, message) {
    let oldPrepareStackTrace = Error.prepareStackTrace;
    Error.prepareStackTrace = newPrepareStackTrace;
    let structuredStack = new Error().stack;
    Error.prepareStackTrace = oldPrepareStackTrace;
    let caller = structuredStack[2];

    let lineSep = process.platform == 'win32' ? '\\' : '/';
    let fileNameSplited = caller.getFileName().split(lineSep);
    let fileName = fileNameSplited[fileNameSplited.length - 1];
    let lineNumber = caller.getLineNumber();
    let columnNumber = caller.getColumnNumber();
    
    //function name may be empty if it is a global call
    // let functionName = caller.getFunctionName();

    let levelString;
    switch (level) {
        case LEVEL.INFO: {
            levelString = '[INFO]';
        } break;
        case LEVEL.WARN: {
            levelString = '[WARN]';
        } break;
        case LEVEL.ERROR: {
            levelString = '[ERROR]';
        } break;
        default: {
            levelString = '[]';
        } break;
    }
    let output = util.format('%s %s(%d,%d) %s', levelString, fileName, lineNumber, columnNumber, message);
    if (!coloredOutput) {
        process.stdout.write(output + '\n');
    } else {
        switch (level) {
            case LEVEL.INFO: {
                process.stdout.write(COLOR.INFO + output + COLOR.RESET + '\n');
            } break;
            case LEVEL.WARN: {
                process.stdout.write(COLOR.WARN + output + COLOR.RESET + '\n');
            } break;
            case LEVEL.ERROR: {
                process.stdout.write(COLOR.ERROR + output + COLOR.RESET + '\n');
            } break;
            default: {
            } break;
        }
    }
}

module.exports = {
    /** 打印info */
    info: info,
    /** 打印warn */
    warn: warn,
    /** 打印error */
    error: error,
    /** 颜色等级 */
    LEVEL: LEVEL,
    /** 设置颜色等级 */
    setLevel: setLevel,
    /** 设置是否输出颜色 */
    setColoredOutput: setColoredOutput,
};

const log = require("../utils/log");
const proto_tools = require("./proto_tools");
/**
 * 协议管理模块
 * （1）服务号、命令号不能为0
 * （2）服务号与命令号大小不能超过2个字节整数
 * （3）buf协议里花费从0开始的2个字节存放服务号、命令号，
 * （4）加密，解密 
 * （5）都用小尾存储
 * （6）utf-8
 */
let proto_mgr = {
    /** json协议 */
    PROTO_JSON: 1,
    /** 二进制协议 */
    PROTO_BUFF: 2,
    /** 编码 */
    encode_cmd: encode_cmd,
    /** 解码 */
    decode_cmd: decode_cmd,
    /** 二进制编码 */
    reg_encoder: reg_buf_encoder,
    /** 二进制解码 */
    reg_decoder: reg_buf_decoder,
    /** 加密 */
    encrypt_cmd: encrypt_cmd,
    /** 解密 */
    decrypt_cmd: decrypt_cmd,
    /** 解码出头 */
    decode_cmd_header: decode_cmd_header,
}
/**
 * 加密
 * @param {*} str_or_buf 
 */
function encrypt_cmd(str_or_buf) {
    return str_or_buf;
}
/**
 * 解密
 * @param {*} str_or_buf 
 */
function decrypt_cmd(str_or_buf) {
    return str_or_buf;
}

/**
 * json数据编码
 * @param {*} stype 服务号
 * @param {*} ctype 命令号
 * @param {*} body 数据
 */
function _json_encode(stype, ctype, body) {
    let cmd = {};
    cmd[0] = stype;
    cmd[1] = ctype;
    cmd[2] = body;
    return JSON.stringify(cmd);
}
/**
 * json解码 
 * @param {*} cmd_json 数据
 */
function _json_decode(cmd_json) {
    let cmd = null;
    try {
        cmd = JSON.parse(cmd_json);
    } catch (e) {
        log.error(e);
    }
    if (!cmd || !cmd[0] || !cmd[1]) {
        return null;
    }
    return cmd;
}
/**
 * 编码 返回编码后的数据 ""
 * @param {*} proto_type 协议类型 json , buf 
 * @param {*} stype 服务号
 * @param {*} ctype 命令号
 * @param {*} body 数据
 */
function encode_cmd(proto_type, stype, ctype, body) {
    let buf = null;
    if (proto_type == proto_mgr.PROTO_JSON) {
        let str = _json_encode(stype, ctype, body);
        // return encrypt_cmd(str);
        return str;
    } else {
        //buf协议
        let key = get_key(stype, ctype);
        if (!encoders[key]) {
            return null;
        }
        // buf = encoders[key](body);//为了通用
        buf = encoders[key](stype, ctype, body);
    }
    //加密
    // buf = encrypt_cmd(buf);
    return buf;
}
/** 解码出头 */
function decode_cmd_header(proto_type, str_or_buf) {
    let cmd = {};
    if (proto_type == proto_mgr.PROTO_JSON) {
        let json_cmd = _json_decode(str_or_buf);//这里还要改  半成品
        cmd[0] = json_cmd[0];
        cmd[1] = json_cmd[1];
        return cmd;
    }
    if (str_or_buf.length < 4) {
        return null;
    }
    //buf协议

    cmd[0] = proto_tools.read_int16(str_or_buf, 0);
    cmd[1] = proto_tools.read_int16(str_or_buf, 2);
    return cmd;
}
/**
 * 解码 返回{0:stype, 1: ctype, 2: body}
 * @param {*} proto_type 协议类型
 * @param {*} str_or_buf 接收到的数据命令
 */
function decode_cmd(proto_type, str_or_buf) {
    //解密
    // str_or_buf = decrypt_cmd(str_or_buf);
    //json协议
    if (proto_type == proto_mgr.PROTO_JSON) {
        return _json_decode(str_or_buf);
    }
    if (str_or_buf.length < 4) {
        return null;
    }
    //buf协议
    let stype = str_or_buf.readUInt16LE(0);
    let ctype = str_or_buf.readUInt16LE(2);
    let key = get_key(stype, ctype);
    if (!decoders[key]) {
        return null;
    }
    let cmd = decoders[key](str_or_buf);
    return cmd;
}



//buf协议编码/解码管理
/** buf协议的所有解码函数 */
let decoders = {};
/** 所有编码函数 */
let encoders = {};
/**
 * 获取服务号和命令号合成的key 各占两个字节2^16=65536;
 * @param {*} stype 服务号
 * @param {*} ctype 命令号
 */
function get_key(stype, ctype) {
    return (stype * 65536 + ctype);
}
/**
 * 二进制编码
 * @param {*} stype 服务号
 * @param {*} ctype 命令号
 * @param {*} encode_func 编码函数 func(body) return buf;
 */
function reg_buf_encoder(stype, ctype, encode_func) {
    let key = get_key(stype, ctype);
    if (encoders[key]) {
        log.warn("encoders--> stype: " + stype + ", ctype: " + ctype + ", is reged!!!");
    }
    encoders[key] = encode_func;
}
/**
 * 二进制解码
 * @param {*} stype 服务号
 * @param {*} ctype 命令号
 * @param {*} decode_func 解码函数 func(cmd_buf) return cmd{0:服务号，1:命令号，2: body};
 */
function reg_buf_decoder(stype, ctype, decode_func) {
    let key = get_key(stype, ctype);
    if (decoders[key]) {
        log.warn("decoders--> stype: " + stype + ", ctype: " + ctype + ", is reged!!!");
    }
    decoders[key] = decode_func;
}



module.exports = proto_mgr;

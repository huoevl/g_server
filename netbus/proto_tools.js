// require("../3rd/extends");
let proto_tools = {
    // 原操作
    read_int8: read_int8,
    write_int8: write_int8,

    read_int16: read_int16,
    write_int16, write_int16,

    read_int32: read_int32,
    write_int32, write_int32,

    read_uint32: read_uint32,
    write_uint32, write_uint32,

    read_float: read_float,
    write_float: write_float,

    alloc_buffer: alloc_buffer,

    // 通用操作
    write_cmd_header_inbuf: write_cmd_header_inbuf,
    write_str_inbuf: write_str_inbuf,
    read_str_inbuf: read_str_inbuf,
    // end

    // 模板编码解码器
    encode_str_cmd: encode_str_cmd,
    encode_status_cmd: encode_status_cmd,
    encode_empty_cmd: encode_empty_cmd,

    decode_str_cmd: decode_str_cmd,
    decode_status_cmd: decode_status_cmd,
    decode_empty_cmd: decode_empty_cmd,
    // 
};


function read_int8(cmd_buf, offset) {
    return cmd_buf.readInt8(offset);
}
function write_int8(cmd_buf, offset, value) {
    cmd_buf.writeInt8(value, offset);
}
function read_int16(cmd_buf, offset) {
    return cmd_buf.readInt16LE(offset);
}
function write_int16(cmd_buf, offset, value) {
    cmd_buf.writeInt16LE(value, offset);
}
function read_int32(cmd_buf, offset) {
    return cmd_buf.readInt32LE(offset);
}
function write_int32(cmd_buf, offset, value) {
    cmd_buf.writeInt132LE(value, offset);
}

function read_uint32(cmd_buf, offset) {
    return cmd_buf.readUInt32LE(offset);
}
function write_uint32(cmd_buf, offset, value) {
    cmd_buf.writeUInt132LE(value, offset);
}

function read_float(cmd_buf, offset) {
    return cmd_buf.readFloatLE(offset);
}
function write_float(cmd_buf, offset, value) {
    cmd_buf.writeFloatLE(value, offset);
}

/**
 * 读字符串 utf8
 * @param {*} cmd_buf 
 * @param {*} offset 
 * @param {*} byte_len 
 */
function read_str(cmd_buf, offset, byte_len) {
    return cmd_buf.toString("utf8", offset, offset + byte_len);
}
/** 读字符串 返回 str, offset*/
function read_str_inbuf(cmd_buf, offset) {
    var byte_len = read_int16(cmd_buf, offset);
    offset += 2;
    var str = read_str(cmd_buf, offset, byte_len);
    offset += byte_len;
    return [str, offset];
}
/**
 * 写字符串 utf8
 * @param {*} cmd_buf 
 * @param {*} offset 
 * @param {*} str 
 */
function write_str(cmd_buf, offset, str) {
    cmd_buf.write(str, offset)
}
/** 字符串写入bug */
function write_str_inbuf(cmd_buf, offset, str, byte_len) {
    // 写入2个字节字符串长度信息;
    write_int16(cmd_buf, offset, byte_len);
    offset += 2;

    write_str(cmd_buf, offset, str);
    offset += byte_len;

    return offset;
}


/**
 * 分配缓存区
 * @param {*} total_len 
 */
function alloc_buffer(total_len) {
    return Buffer.allocUnsafe(total_len);
}


/**
 * 把数据头写入buf
 * @param {*} cmd_buf 
 * @param {*} stype 
 * @param {*} ctype 
 */
function write_cmd_header_inbuf(cmd_buf, stype, ctype) {
    write_int16(cmd_buf, 0, stype);
    write_int16(cmd_buf, 2, ctype);

    return 4;
}

/** 解码空字符 */
function decode_empty_cmd(cmd_buf) {
    let cmd = {};
    cmd[0] = read_int16(cmd_buf, 0);
    cmd[1] = read_int16(cmd_buf, 2);
    cmd[2] = null;
    return cmd;
}
/** 编码空字符 */
function encode_empty_cmd(stype, ctype, body) {
    let cmd_buf = alloc_buffer(4);
    write_cmd_header_inbuf(cmd_buf, stype, ctype);
    return cmd_buf;
}
/** 编码状态 */
function encode_status_cmd(stype, ctype, status) {
    let cmd_buf = alloc_buffer(6);
    write_cmd_header_inbuf(cmd_buf, stype, ctype);
    write_int16(cmd_buf, 4, status);
    return cmd_buf;
}
/** 解码状态 */
function decode_status_cmd(cmd_buf) {
    let cmd = {};
    cmd[0] = read_int16(cmd_buf, 0);
    cmd[1] = read_int16(cmd_buf, 2);
    cmd[2] = read_int16(cmd_buf, 4);
    return cmd;
}
/** 编码字符串 */
function encode_str_cmd(stype, ctype, str) {
    let byte_len = str.utf8_byte_len();
    let total_len = 2 + 2 + 2 + byte_len;
    let cmd_buf = alloc_buffer(total_len);

    let offset = write_cmd_header_inbuf(cmd_buf, stype, ctype, byte_len);
    offset = write_str_inbuf(cmd_buf, offset, str, byte_len);
    return cmd_buf;
}
/** 解码字符串 */
function decode_str_cmd(cmd_buf) {
    let cmd = {};
    cmd[0] = read_int16(cmd_buf, 0);
    cmd[1] = read_int16(cmd_buf, 2);
    var ret = read_str_inbuf(cmd_buf, 4);
    cmd[2] = ret[0];
    return cmd;
}




module.exports = proto_tools;


const netbus = require("../netbus/netbus");
const proto_mgr = require("../netbus/proto_mgr");
const log = require("../utils/log");

//json
let test = {
    name: "哈哈",
    age: "9000"
}
let buf = proto_mgr.encode_cmd(proto_mgr.PROTO_JSON, 1, 1, test);
log.info("json encode_cmd buf: ", buf);
log.error("json encode_cmd length: ", buf.length);

let str = proto_mgr.decode_cmd(proto_mgr.PROTO_JSON, buf);
log.info("json decode_cmd buf: ", str);
//二进制
proto_mgr.reg_buf_encoder(1, 1, encode_cmd_1_1);
proto_mgr.reg_buf_decoder(1, 1, decode_cmd_1_1);
buf = proto_mgr.encode_cmd(proto_mgr.PROTO_BUFF, 1, 1, test);
log.info("buff encode_cmd buf: ", buf);
log.error("buff encode_cmd length: ", buf.length);
str = proto_mgr.decode_cmd(proto_mgr.PROTO_BUFF, buf);
log.info("buff decode_cmd buf: ", str);

//二进制 编码解码
function encode_cmd_1_1(body) {
    let offset = body["name"].utf8_byte_len();
    let len = 2 + 2 + 2 + offset + 2 + body["age"].utf8_byte_len();
    let buf = Buffer.allocUnsafe(len);
    buf.writeUInt16LE(1, 0);
    buf.writeUInt16LE(1, 2);

    buf.writeUInt16LE(offset, 4);
    buf.write(body["name"], 4 + 2,);

    offset = 6 + offset;
    buf.writeUInt16LE(body["age"].utf8_byte_len(), offset);
    buf.fill(body["age"], offset + 2);

    return buf;
}
function decode_cmd_1_1(buf) {
    let cmd = {};
    let stype = buf.readUInt16LE(0);
    let ctype = buf.readUInt16LE(2);

    let len = buf.readUInt16LE(4)
    if ((len + 2 + 2 + 2) > buf.length) {
        return null;
    }
    let name = buf.toString("utf8", 6, 6 + len);
    if (!name) {
        return null;
    }

    let offset = 6 + len;
    let ageLen = buf.readUInt16LE(offset);
    if ((ageLen + offset + 2) > buf.len) {
        return null;
    }
    let age = buf.toString("utf8", offset + 2, offset + 2 + ageLen);
    if (!age) {
        return null;
    }
    cmd[0] = stype;
    cmd[1] = ctype;
    cmd[2] = {
        name: name,
        age: age,
    }
    return cmd;
}
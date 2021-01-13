const proto_mgr = require("../netbus/proto_mgr");
require("../3rd/extends");
/*
客户端：进入
    1,1,body={uname:"名字",usex: 0|1};
    返回：
    1,1,status=OK
客户端：离开
    1，2，null,
    返回：
    1,2,status=OK;
UserEnter 主动发送：
    1,3,body=uinfo{uname:"名字",usex: 0|1};
UserExit 主动发送
    1,4,body=uinfo{uname:"名字",usex: 0|1};
客户端请求发送消息
    1,5,body="消息内容"
    返回：
    1,5,body={0:status,1:uname,2:usex,3:msg};
Usermsg：服务器主动发送
    1,6,body={0:uname,1:usex,2:msg};
*/

/**
 * 二进制 编码解码
 * @param {*} body 
 */
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

proto_mgr.reg_buf_encoder(1, 1, encode_cmd_1_1);
proto_mgr.reg_buf_decoder(1, 1, decode_cmd_1_1);
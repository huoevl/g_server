const net = require("net");
const ws = require("ws");
const proto_mgr = require("../netbus/proto_mgr");
const tcppkg = require("../netbus/tcppkg");
require("./talk_room_proto");
//tcp test
let sock = net.connect({
    port: 7080,
    host: "127.0.0.1",
});
sock.on("connect", () => {
    console.log("client connect !!!");

    //================tcp test==============
    // sock.write(tcppkg.package_data("Hello"));

    // let strArr = testTimout("Hel", "lo");
    // sock.write(strArr[0]);
    // setTimeout(() => {
    //     sock.write(strArr[1]);
    // }, 2000);

    // sock.write(testTwo("start", "hello"));

    //==============test service mgr===========
    //1,2,body='hello talk room !!!';  json
    // let cmd = proto_mgr.encode_cmd(proto_mgr.PROTO_JSON, 1, 2, 'hello talk room !!!');
    // cmd = tcppkg.package_data(cmd);
    // sock.write(cmd);

    //1,1,body={name:xxx,age:xxx};  buf
    // let data = { name: "Black", age: "10" };
    // let cmd = proto_mgr.encode_cmd(proto_mgr.PROTO_BUFF, 1, 1, data);
    // cmd = tcppkg.package_data(cmd);
    // sock.write(cmd);
})
sock.on("error", () => {
    console.error("退出")
})
sock.on("close", () => {
    console.error("关闭")
})

/** 测试 模拟一个大数据包分两次发送 */
function testTimout(data1, data2) {
    let buf = Buffer.allocUnsafe(2 + data1.length);
    buf.writeInt16LE(2 + data1.length + data2.length, 0);
    buf.fill(data1, 2);

    let buf2 = Buffer.allocUnsafe(data2.length);
    buf2.fill(data2);
    return [buf, buf2];
}

/** 测试 一个包带两个数据 模拟粘包*/
function testTwo(data1, data2) {
    let buf = Buffer.allocUnsafe(proto_tools.header_size + data1.length + data2.length);
    buf.writeInt16LE(2 + data1.length, 0);
    buf.fill(data1, 2);
    let offset = 2 + data1.length;
    buf.writeInt16LE(2 + data2.length, offset);
    buf.fill(data2, offset + 2);
    return buf;
}


//test ws
let ws_sock = new ws('ws://127.0.0.1:7082/');
ws_sock.on("open", () => {
    console.log("ws client connect !!!");
    // let buf = Buffer.from("呵呵呵2");
    // // ws_sock.send(buf);
    // ws_sock.send("呵呵呵呵")
    let data = { name: "Black", age: "10" };
    let cmd = proto_mgr.encode_cmd(proto_mgr.PROTO_BUFF, 1, 1, data)
    ws_sock.send(cmd);
})
ws_sock.on("error", (err) => {
    console.log("ws error")
})
ws_sock.on("close", () => {
    console.log("ws close");
})




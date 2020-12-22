const net = require("net");
const tcppkg = require("../netbus/tcppkg");

//tcp test
let sock = net.connect({
    port: 7080,
    host: "127.0.0.1",
});
sock.on("connect",() => {
    console.log("client connect !!!");
    let buf = tcppkg.package_data("哈哈");
    sock.write(buf);
})
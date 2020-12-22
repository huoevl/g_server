const net = require("net");
const log = require("../utils/log");
const tcppkg = require("./tcppkg");

let netbus = {
    PROTO_JSON: 1,
    PROTO_BUG: 2,
};

let global_session_map = {};
let global_session_key = 0;

/**
 * 启动tcp服务
 * @param {*} ip ip
 * @param {*} port 端口
 * @param {*} protoType 协议类型
 */
function start_tcp_server(ip, port, protoType) {
    log.info("start server ...", ip, port);
    let server = net.createServer((session) => {
        add_client_session_event(session, protoType);
    });
    //server
    server.listen({
        host: ip,
        port: port,
        exclusive: true,
    })
    server.on("error", (err) => {
        log.error("server listen error");
    });
    server.on("close", () => {
        log.error("server listen close");
    })
}
/** 给客户端添加监听 */
function add_client_session_event(session, proto_type) {
    on_session_enter(session, proto_type, false);

    session.on("close", () => {
        on_session_exit(session);
    });
    session.on("data", (data) => {
        let last_pkg = session.last_pkg;
        if (last_pkg != null) {
            let buf = Buffer.concat([last_pkg, data], last_pkg.length + data.length);
            last_pkg = buf;
        } else {
            last_pkg = data;
        }
        let offset = 0;
        let pkg_len = tcppkg.red_pkg_size(last_pkg, offset);
        if (pkg_len < 0) {
            return;
        }
        while (offset + pkg_len <= last_pkg.length) {
            let cmd_buf = Buffer.allocUnsafe(pkg_len - 2);
            last_pkg.copy(cmd_buf, 0, offset + 2, offset + pkg_len);

            on_session_recv_cmd(session, cmd_buf);//数据解析完成

            offset += pkg_len;
            if (offset >= last_pkg.length) {
                break;
            }
            pkg_len = tcppkg.red_pkg_size(last_pkg, offset);
            if (pkg_len < 0) {
                break;
            }
        }
        if (offset >= last_pkg.length) {
            last_pkg = null;
        } else {
            let buf = Buffer.allocUnsafe(last_pkg.length - offset);
            last_pkg.copy(buf, 0, offset, last_pkg.length);
            last_pkg = buf;
        }
        session.last_pkg = last_pkg;
    });
    session.on("error", (err) => {
        on_session_exit(session);
    });
}
/** 客户端退出 */
function on_session_exit(session) {
    log.info("session exit !!!");
    session.last_pkg = null;
    if (global_session_map[global_session_key]) {
        global_session_map[global_session_key] = null;
        delete global_session_map[global_session_key];
    }
}
/** 客户端进来 */
function on_session_enter(session, proto_type, is_ws) {
    log.info("client coming ", session.remoteAddress, session.remotePort);
    session.last_pkg = null;
    session.is_ws = is_ws;

    global_session_map[global_session_key] = session;
    session.session_key = global_session_key;
    global_session_key++;
}
/** 数据 */
function on_session_recv_cmd(session, cmd) {
    log.info(cmd);
}

netbus.start_tcp_server = start_tcp_server;
module.exports = netbus;
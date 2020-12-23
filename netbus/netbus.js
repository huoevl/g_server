const net = require("net");
const ws = require("ws");
const log = require("../utils/log");
const tcppkg = require("./tcppkg");

let netbus = {
    /** json协议 */
    PROTO_JSON: 1,
    /** 二进制协议 */
    PROTO_BUFF: 2,
    /** 开启tcp服务器 */
    start_tcp_server: start_tcp_server,
    /** 发送数据 */
    session_send: session_send,
    /** 关闭客户端 */
    session_close: session_close,
    /** 开启ws服务器 */
    start_ws_server: start_ws_server,
};

let global_session_map = {};
let global_session_key = 0;

/**
 * 启动tcp服务
 * @param {*} ip ip
 * @param {*} port 端口
 * @param {*} proto_type 协议类型
 */
function start_tcp_server(ip, port, proto_type) {
    log.info("start tcp server ...", ip, port);
    let server = net.createServer((session) => {
        add_client_session_event(session, proto_type);
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
        if (!Buffer.isBuffer(data)) {//tcp传输必须用buffer 我们定义的拆封包
            session_close(session);
            return;
        }

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
            if (session.proto_type == netbus.PROTO_JSON) {
                //json协议
                let json_str = last_pkg.toString("utf-8", offset + 2, offset + pkg_len);
                if (!json_str) {
                    session_close(session);
                    return;
                }
                on_session_recv_cmd(session, json_str);//数据解析完成
            } else {
                let cmd_buf = Buffer.allocUnsafe(pkg_len - 2);
                last_pkg.copy(cmd_buf, 0, offset + 2, offset + pkg_len);
                on_session_recv_cmd(session, cmd_buf);//数据解析完成
            }

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
    if (is_ws) {
        log.info("ws client comming", session._socket.remoteAddress, session._socket.remotePort);
    } else {
        log.info("tcp client comming ", session.remoteAddress, session.remotePort);
    }
    session.last_pkg = null;
    session.is_ws = is_ws;
    session.proto_type = proto_type;

    global_session_map[global_session_key] = session;
    session.session_key = global_session_key;
    global_session_key++;
}
/** 数据 */
function on_session_recv_cmd(session, str_or_buf) {
    // log.info(str_or_buf);
    log.info(str_or_buf.toString());
}
/** 发送数据包 */
function session_send(session, cmd) {
    if (!session.is_ws) {
        let data = tcppkg.package_data(cmd);
        session.wirte(data)
    } else {
        session.send(cmd);
    }
}
/** 关闭session */
function session_close(session) {
    if (!session.is_ws) {
        session.end();
        return;
    } else {
        session.close();
    }
}
//===============ws====================
/**
 * 启动ws服务器
 * @param {*} ip 
 * @param {*} port 
 * @param {*} proto_type 
 */
function start_ws_server(ip, port, proto_type) {
    log.info("start ws server ...", ip, port);
    let server = new ws.Server({
        port: port,
        host: ip,
    })
    server.on("connection", (session) => {
        ws_add_session_event(session, proto_type);
    })
    server.on("error", (err) => {
        log.error("ws server listen error");
    })
    server.on("close", () => {
        log.error("ws server listen close");
    })
}
/** 添加事件 */
function ws_add_session_event(session, proto_type) {
    on_session_enter(session, proto_type, true);
    session.on("close", (err) => {
        on_session_exit(session)
    })
    session.on("error", (err) => {
        on_session_exit(session)
    })
    session.on("message", (data) => {
        if (session.proto_type == netbus.PROTO_JSON) {
            if (!isString(data)) {
                session_close(session);
                return;
            }
        } else {
            if (!Buffer.isBuffer(data)) {
                session_close(session);
                return;
            }
        }
        on_session_recv_cmd(session, data);//不用拆包封包
    })
}
/** 是否字符串 */
function isString(obj) {
    return Object.prototype.toString.call(obj) === "[object String]";
}


module.exports = netbus;
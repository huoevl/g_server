const log = require("../utils/log");
const proto_mgr = require("./proto_mgr");

let service_mgr = {
    /** 客户端掉线 */
    on_client_lost_connect: on_client_lost_connect,
    /** 收到客户端数据 */
    on_recv_client_cmd: on_recv_client_cmd,
    /** 注册服务 */
    register_service: register_service,
}
let service_modules = {};
/** 注册服务 */
function register_service(stype, service) {
    if (service_modules[stype]) {
        log.warn(service_modules[stype].name + ": service is registed!!!");
    }
    service_modules[stype] = service;
    service.init();
}

/**
 * 客户端掉线
 * @param {*} session 
 */
function on_client_lost_connect(session) {
    log.info("session lost", session.session_key);
    for (let key in service_modules) {
        service_modules[key].on_player_disconnect(session);
    }
}
/**
 * 接收到数据
 * @param {*} session 
 * @param {*} str_or_buf 
 */
function on_recv_client_cmd(session, str_or_buf) {
    //解码命令
    let cmd = proto_mgr.decode_cmd(session.proto_type, str_or_buf);
    if (!cmd) {
        return false;
    }
    let stype = cmd[0];
    let ctype = cmd[1];
    let body = cmd[2];
    log.info(stype, ctype, body);
    if (service_modules[stype]) {
        service_modules[stype].on_recv_player_cmd(session, ctype, body);
    }
    return true;
}

module.exports = service_mgr;
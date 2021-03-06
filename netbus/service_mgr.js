const log = require("../utils/log");
const proto_mgr = require("./proto_mgr");

let service_mgr = {
    /** 客户端掉线 */
    on_client_lost_connect: on_client_lost_connect,
    /** 收到客户端数据 */
    on_recv_client_cmd: on_recv_client_cmd,
    /** 注册服务 */
    register_service: register_service,
    /** 收到服务端数据 */
    on_recv_server_return: on_recv_server_return,
}
let service_modules = {};
/** 注册服务 */
function register_service(stype, service) {
    if (service_modules[stype]) {
        log.warn(service_modules[stype].name + ": service is registed!!!");
    }
    service_modules[stype] = service;
}

/**
 * 客户端掉线
 * @param {*} session 
 */
function on_client_lost_connect(session) {
    log.info("session lost", session.session_key);
    for (let key in service_modules) {
        service_modules[key].on_player_disconnect(key, session);
    }
}
/**
 * 接收到数据
 * @param {*} session 
 * @param {*} str_or_buf 
 */
function on_recv_client_cmd(session, str_or_buf) {
    //解码命令
    if (session.is_encrypt) {
        str_or_buf = proto_mgr.decrypt_cmd(str_or_buf);
    }
    let cmd = proto_mgr.decode_cmd_header(str_or_buf);
    if (!cmd) {
        return false;
    }
    let stype = cmd[0];
    let ctype = cmd[1];
    let utag = cmd[2];
    let proto_type = cmd[3];
    if (!service_modules[stype]) {
        return false;
    }
    if (service_modules[stype].is_transfer) {
        service_modules[stype].on_recv_player_cmd(session, stype, ctype, null, utag, proto_type, str_or_buf);
        return true;
    }
    cmd = proto_mgr.decode_cmd(proto_type, stype, ctype, str_or_buf);
    if (!cmd) {
        return false;
    }
    let body = cmd[2];
    log.info(stype, ctype, body);
    service_modules[stype].on_recv_player_cmd(session, stype, ctype, body, utag, proto_type, str_or_buf);
    return true;
}



/**
 * 接收到数据
 * @param {*} session 
 * @param {*} str_or_buf 
 */
function on_recv_server_return(session, str_or_buf) {
    //解码命令
    if (session.is_encrypt) {
        str_or_buf = proto_mgr.decrypt_cmd(str_or_buf);
    }
    let cmd = proto_mgr.decode_cmd_header(str_or_buf);
    if (!cmd) {
        return false;
    }
    let stype = cmd[0];
    let ctype = cmd[1];
    let utag = cmd[2];
    let proto_type = cmd[3];

    if (service_modules[stype].is_transfer) {
        service_modules[stype].on_recv_server_returen(session, stype, ctype, null, utag, proto_type, str_or_buf);
        return true;
    }
    cmd = proto_mgr.decode_cmd(proto_type, stype, ctype, str_or_buf);
    if (!cmd) {
        return false;
    }
    let body = cmd[2];
    log.info(stype, ctype, body);
    service_modules[stype].on_recv_server_returen(session, stype, ctype, body, utag, proto_type, str_or_buf);
    return true;
}

module.exports = service_mgr;
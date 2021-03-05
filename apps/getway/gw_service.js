const netbus = require("../../netbus/netbus");
const proto_mgr = require("../../netbus/proto_mgr");
const proto_tools = require("../../netbus/proto_tools");

let service = {
    /** 服务名 */
    name: "gw_service",
    /** 是否为转发模块 */
    is_transfer: true,
    /** 收到客户端发来的数据 转服务器*/
    on_recv_player_cmd: function (session, stype, ctype, body, utag, proto_type, raw_cmd) {
        //不会有body
        let server_session = netbus.get_server_session(stype);
        if (!server_session) {
            return;
        }
        //打入能够标识client的utag  uid或者session_key
        utag = session.session_key;
        proto_tools.write_utag_inbuf(raw_cmd, utag);
        //中转到服务
        server_session.send_encoded_cmd(raw_cmd);


    },
    /** 收到客户端断开连接  被动离开*/
    on_player_disconnect: function (stype, session) {
        let utag = session.session_key;
        //强制掉线
        let server_session = netbus.get_server_session(stype);
        if (!server_session) {
            return;
        }
        let utag = session.session_key;
        server_session.send_cmd(stype, proto_mgr.GW_DisConnect, null, utag, proto_mgr.PROTO_JSON);
    },

    /** 收到连接的服务发过来数据 转客户端*/
    on_recv_server_returen: function (session, stype, ctype, body, utag, proto_type, raw_cmd) {
        let client_session = netbus.get_client_session(utag);
        if (!client_session) {
            return;
        }
        //擦除utag
        proto_tools.clear_utag_inbuf(raw_cmd);
        client_session.send_encoded_cmd(raw_cmd);
    },
}
module.exports = service;
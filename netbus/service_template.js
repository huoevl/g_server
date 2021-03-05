let service = {
    /** 服务名 */
    name: "service tempalte",
    /** 是否为转发模块 */
    is_transfer: false,
    /** 收到客户端发来的数据 */
    on_recv_player_cmd: function (session, stype, ctype, body, utag, proto_type, raw_cmd) {

    },
    /** 每个服务连接丢失调用  被动离开*/
    on_player_disconnect: function (stype, session) {

    },

    /** 收到连接的服务发过来数据 */
    on_recv_server_returen: function (session, stype, ctype, body, utag, proto_type, raw_cmd) {

    },
}
module.exports = service;
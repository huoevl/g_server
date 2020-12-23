let service = {
    /** 服务号 */
    stype: 1,
    /** 服务名 */
    name: "service tempalte",
    /** 每个服务初始化调用 */
    init: function () {

    },
    /** 每个服务受到数据调用 */
    on_recv_player_cmd: function (session, ctype, body) {

    },
    /** 每个服务连接丢失调用  被动离开*/
    on_player_disconnect: function (session) {

    },
}
module.exports = service;
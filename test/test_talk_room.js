const log = require("../utils/log");
require("./talk_room_proto");
let service = {
    /** 服务号 */
    stype: 1,
    /** 服务名 */
    name: "talk room",
    /** 每个服务初始化调用 */
    init: function () {
        let self = this;
        log.info(self.name + " service init!!!");
    },
    /** 每个服务受到数据调用 */
    on_recv_player_cmd: function (session, ctype, body) {
        let self = this;
        log.info(self.name + " on_recv_player_cmd: ", ctype, body);
    },
    /** 每个服务连接丢失调用  被动离开*/
    on_player_disconnect: function (session) {
        let self = this;
        log.info(self.name + " on_player_disconnect：", session.session_key);
    },
}
module.exports = service;
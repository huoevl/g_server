const proto_mgr = require("../../netbus/proto_mgr");
const log = require("../../utils/log");
require("./talkroom_proto");
/** 聊天室协议 */
let TalkCmd = {
    /** 用户进来 */
    Enter: 1,
    /** 用户离开 */
    Exit: 2,
    /** 别人进来 */
    UserArrrived: 3,
    /** 别人离开 */
    UserExit: 4,
    /** 自己发送消息 */
    SendMsg: 5,
    /** 收到别人的消息 */
    UserMsg: 6,
}
let STYPE_TALKROOM = 1;

/** 返回状态 */
let Response = {
    OK: 1,
    IS_IN_TALKROOM: -100,//已经在聊天室了
    NOT_IN_TALKROOM: -101,//不在聊天室了
    INVALD_OPT: -102,//玩家非法操作
    INVALD_PARMAS: -103,//参数不对
}

/** 聊天室所有用户 */
let room = {};

let service = {
    /** 服务名 */
    name: "talk room",
    /** 是否为转发模块 */
    is_transfer: false,


    /** 每个服务受到数据调用 */
    on_recv_player_cmd: function (session, stype, ctype, body, utag, proto_type, raw_cmd) {
        let self = this;
        log.info(self.name + " on_recv_player_cmd: ", ctype, body);
        switch (ctype) {
            case TalkCmd.Enter: {
                on_user_enter_talkRoom(session, body);
            } break;
            case TalkCmd.Exit: {//主动离开
                on_user_exit_talkroom(session, false);
            } break;
            case TalkCmd.SendMsg: {
                on_user_send_msg(session, body);
            } break;
        }
    },
    /** 每个服务连接丢失调用  被动离开*/
    on_player_disconnect: function (session) {
        let self = this;
        log.info(self.name + " on_player_disconnect：", session.session_key);
        on_user_exit_talkroom(session, true);
    },
}
/** 用户进来 */
function on_user_enter_talkRoom(session, body) {
    if (body.uname == void (0) || body.usex == void (0)) {
        session.send_cmd(STYPE_TALKROOM, TalkCmd.Enter, Response.INVALD_PARMAS);
        return;
    }
    if (room[session.session_key]) {
        session.send_cmd(STYPE_TALKROOM, TalkCmd.Enter, Response.IS_IN_TALKROOM);
        return;
    }
    //告诉客户端进来成功
    session.send_cmd(STYPE_TALKROOM, TalkCmd.Enter, Response.OK);
    //进来的消息广播给其他人
    broadcast_cmd(TalkCmd.UserArrrived, body, session)
    //广播聊天室的人给客户端
    for (let key in room) {
        session.send_cmd(STYPE_TALKROOM, TalkCmd.UserArrrived, room[key].uinfo);
    }
    //保存自己
    let talk_man = { session: session, uinfo: body };
    room[session.session_key] = talk_man;
}
/**
 * 广播
 * @param {*} ctype 
 * @param {*} body 
 * @param {*} not_user 不给广播的session
 */
function broadcast_cmd(ctype, body, not_user) {
    let json_encoded = null;
    let buf_encoded = null;
    for (let key in room) {
        let session = room[key].session;
        if (session == not_user) {
            continue;
        }
        if (session.proto_type == proto_mgr.PROTO_JSON) {
            if (!json_encoded) {
                json_encoded = proto_mgr.encode_cmd(proto_mgr.PROTO_JSON, STYPE_TALKROOM, ctype, body);
            }
            session.send_encoded_cmd(json_encoded);
        }
        if (session.proto_type == proto_mgr.PROTO_BUFF) {
            if (!buf_encoded) {
                buf_encoded = proto_mgr.encode_cmd(proto_mgr.PROTO_BUFF, STYPE_TALKROOM, ctype, body);
            }
            session.send_encoded_cmd(buf_encoded);
        }
    }
}

function on_user_exit_talkroom(session, is_lost_connect) {
    if (!room[session.session_key]) {
        if (!is_lost_connect) {
            session.send_cmd(STYPE_TALKROOM, TalkCmd.Enter, Response.NOT_IN_TALKROOM);
        }
        return;
    }
    //广播给别人
    broadcast_cmd(TalkCmd.UserExit, room[session.session_key].uinfo, session);
    //删除
    room[session.session_key] = null;
    delete room[session.session_key];
    //发送成功离开
    if (!is_lost_connect) {
        session.send_cmd(STYPE_TALKROOM, TalkCmd.Exit, Response.OK);
    }
}

/** 客户端发送消息 */
function on_user_send_msg(session, msg) {
    if (!room[session.session_key]) {
        session.send_cmd(STYPE_TALKROOM, TalkCmd.SendMsg, {
            0: Response.INVALD_OPT,
        });
        return;
    }
    //发送成功 发给客户端
    session.send_cmd(STYPE_TALKROOM, TalkCmd.SendMsg, {
        0: Response.OK,
        1: room[session.session_key].uinfo.uname,
        2: room[session.session_key].uinfo.usex,
        3: msg
    })
    //广播给其他的人
    broadcast_cmd(TalkCmd.UserMsg, {
        0: room[session.session_key].uinfo.uname,
        1: room[session.session_key].uinfo.usex,
        2: msg
    }, session)
}
module.exports = service;
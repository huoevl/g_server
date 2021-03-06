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
                on_user_enter_talkRoom(session, body, utag, proto_type);
            } break;
            case TalkCmd.Exit: {//主动离开
                on_user_exit_talkroom(session, false, utag, proto_type,);
            } break;
            case TalkCmd.SendMsg: {
                on_user_send_msg(session, body, utag, proto_type,);
            } break;
            case proto_mgr.GW_DisConnect: {//网关转发过来 用户被迫掉线
                on_user_exit_talkroom(session, true, utag, proto_type,);
            } break;
        }
    },
    /** 每个服务连接丢失调用  被动离开*/
    on_player_disconnect: function (stype, session) {
        let self = this;
        // log.info(self.name + " on_player_disconnect：", session.session_key);
        // on_user_exit_talkroom(session, true);
        log.info("lost connect with gateway!!!", stype);

        let utag = session.session_key;
        room[utag] = null;
        delete room[utag];

        console.log("强制断线删除utag", utag);

    },
}
/**
 * 用户进来
 * @param {*} session 这里是网关
 * @param {*} body 
 * @param {*} utag 
 * @param {*} proto_type 
 */
function on_user_enter_talkRoom(session, body, utag, proto_type) {
    if (body.uname == void (0) || body.usex == void (0)) {
        session.send_cmd(STYPE_TALKROOM, TalkCmd.Enter, Response.INVALD_PARMAS, utag, proto_type);
        return;
    }
    if (room[utag]) {
        session.send_cmd(STYPE_TALKROOM, TalkCmd.Enter, Response.IS_IN_TALKROOM, utag, proto_type);
        return;
    }
    console.log("进入聊天室utag", utag);
    //告诉客户端进来成功
    session.send_cmd(STYPE_TALKROOM, TalkCmd.Enter, Response.OK, utag, proto_type);
    //进来的消息广播给其他人
    broadcast_cmd(TalkCmd.UserArrrived, body, utag)
    //广播聊天室的人给客户端
    for (let key in room) {
        session.send_cmd(STYPE_TALKROOM, TalkCmd.UserArrrived, room[key].uinfo, utag, proto_type);
    }
    //保存自己
    let talk_man = { session: session, utag: utag, proto_type: proto_type, uinfo: body };
    room[utag] = talk_man;
}
/**
 * 广播
 * @param {*} ctype 
 * @param {*} body 
 * @param {*} notUser 不给广播的session
 */
function broadcast_cmd(ctype, body, notUser) {
    let json_encoded = null;
    let buf_encoded = null;

    console.log("广播 notUser", notUser);
    for (let key in room) {
        console.log(room[key].utag);
    }
    for (let key in room) {
        let session = room[key].session;
        let utag = room[key].utag;
        if (notUser == utag) {
            continue;
        }
        let proto_type = room[key].proto_type;
        if (proto_type == proto_mgr.PROTO_JSON) {
            if (!json_encoded) {
                json_encoded = proto_mgr.encode_cmd(utag, proto_type, STYPE_TALKROOM, ctype, body);
            }
            session.send_encoded_cmd(json_encoded);
        }
        if (proto_type == proto_mgr.PROTO_BUFF) {
            if (!buf_encoded) {
                buf_encoded = proto_mgr.encode_cmd(utag, proto_type, STYPE_TALKROOM, ctype, body);
            }
            session.send_encoded_cmd(buf_encoded);
        }
    }
}

function on_user_exit_talkroom(session, is_lost_connect, utag, proto_type) {
    if (!room[utag]) {
        if (!is_lost_connect) {
            session.send_cmd(STYPE_TALKROOM, TalkCmd.Enter, Response.NOT_IN_TALKROOM, utag, proto_type);
        }
        return;
    }
    //广播给别人
    broadcast_cmd(TalkCmd.UserExit, room[utag].uinfo, utag);
    //删除
    room[utag] = null;
    delete room[utag];

    console.log("断线删除，utag", utag);
    //发送成功离开
    if (!is_lost_connect) {
        session.send_cmd(STYPE_TALKROOM, TalkCmd.Exit, Response.OK, utag, proto_type);
    }
}

/** 客户端发送消息 */
function on_user_send_msg(session, msg, utag, proto_type) {
    console.log("客户端发送消息 utag", utag);
    for (let key in room) {
        console.log(room[key].utag);
    }
    if (!room[utag]) {
        session.send_cmd(STYPE_TALKROOM, TalkCmd.SendMsg, {
            0: Response.INVALD_OPT,
        }, utag, proto_type);
        return;
    }
    //发送成功 发给客户端
    session.send_cmd(STYPE_TALKROOM, TalkCmd.SendMsg, {
        0: Response.OK,
        1: room[utag].uinfo.uname,
        2: room[utag].uinfo.usex,
        3: msg
    }, utag, proto_type)
    //广播给其他的人
    broadcast_cmd(TalkCmd.UserMsg, {
        0: room[utag].uinfo.uname,
        1: room[utag].uinfo.usex,
        2: msg
    }, utag)
}
module.exports = service;
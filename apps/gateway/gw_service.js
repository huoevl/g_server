var netbus = require("../../netbus/netbus.js");
var proto_tools = require("../../netbus/proto_tools.js");
var proto_man = require("../../netbus/proto_man.js");
var log = require("../../utils/log.js");

var service = {
	name: "gw_service", // 服务名称
	is_transfer: true, // 是否为转发模块,

	// 收到客户端给我们发来的数据
	on_recv_player_cmd: function(session, stype, ctype, body, utag, proto_type, raw_cmd) {
		log.info(raw_cmd);
		var server_session = netbus.get_server_session(stype);
		if (!server_session) {
			return;
		}

		// 打入能够标识client的utag, uid, session.session_key,
		utag = session.session_key;
		proto_tools.write_utag_inbuf(raw_cmd, utag);
		// end 

		server_session.send_encoded_cmd(raw_cmd);
	},

	// 收到我们连接的服务给我们发过来的数据;
	on_recv_server_return: function (session, stype, ctype, body, utag, proto_type, raw_cmd) {
		log.info(raw_cmd);
		var client_session = netbus.get_client_session(utag);
		if (!client_session) {
			return;
		}

		proto_tools.clear_utag_inbuf(raw_cmd);
		client_session.send_encoded_cmd(raw_cmd);
	}, 

	// 收到客户端断开连接;
	on_player_disconnect: function(stype, session) {
		var server_session = netbus.get_server_session(stype);
		if (!server_session) {
			return;
		}

		var utag = session.session_key;
		server_session.send_cmd(stype, proto_man.GW_Disconnect, null, utag, proto_man.PROTO_JSON);
	},
};

module.exports = service;

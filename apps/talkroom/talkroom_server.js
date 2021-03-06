require("../../init");
const netbus = require("../../netbus/netbus");
const proto_mgr = require("../../netbus/proto_mgr");
const service_mgr = require("../../netbus/service_mgr");
const talk_room = require("./talkromm");


netbus.start_tcp_server("127.0.0.1", 7084, proto_mgr.PROTO_BUFF, false);
netbus.start_tcp_server("127.0.0.1", 7085, proto_mgr.PROTO_JSON, false);

// netbus.start_ws_server("127.0.0.1", 7082, proto_mgr.PROTO_BUFF, false);
// netbus.start_ws_server("127.0.0.1", 7083, proto_mgr.PROTO_JSON, false);

service_mgr.register_service(1, talk_room);
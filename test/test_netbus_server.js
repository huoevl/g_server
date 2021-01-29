require("../init");
const netbus = require("../netbus/netbus");
const proto_mgr = require("../netbus/proto_mgr");
const service_mgr = require("../netbus/service_mgr");
const talk_room = require("./test_talk_room");


netbus.start_tcp_server("127.0.0.1", 7080, proto_mgr.PROTO_BUFF);
netbus.start_tcp_server("127.0.0.1", 7081, proto_mgr.PROTO_JSON);

netbus.start_ws_server("127.0.0.1", 7082, proto_mgr.PROTO_BUFF);
netbus.start_ws_server("127.0.0.1", 7083, proto_mgr.PROTO_JSON);

service_mgr.register_service(1, talk_room);
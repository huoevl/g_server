const netbus = require("../netbus/netbus");
const proto_mgr = require("../netbus/proto_mgr");

netbus.start_tcp_server("127.0.0.1", 7080, proto_mgr.PROTO_BUFF);
netbus.start_tcp_server("127.0.0.1", 7081, proto_mgr.PROTO_JSON);

netbus.start_ws_server("127.0.0.1", 7082, proto_mgr.PROTO_BUFF);
netbus.start_ws_server("127.0.0.1", 7083, proto_mgr.PROTO_JSON);
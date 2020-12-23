const netbus = require("../netbus/netbus");

netbus.start_tcp_server("127.0.0.1", 7080, netbus.PROTO_BUFF);
netbus.start_ws_server("127.0.0.1", 7081, netbus.PROTO_BUFF);
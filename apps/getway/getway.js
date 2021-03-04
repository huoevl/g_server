//网关服务

require("../../init");
const netbus = require("../../netbus/netbus");
const proto_mgr = require("../../netbus/proto_mgr");
const service_mgr = require("../../netbus/service_mgr");
const game_config = require("../game_config");

let host = game_config.getway_config.host;
let posts = game_config.getway_config.ports;

netbus.start_tcp_server(host, posts[0], proto_mgr.PROTO_BUFF, true);
netbus.start_tcp_server(host, posts[1], proto_mgr.PROTO_JSON, true);

netbus.start_ws_server(host, posts[2], proto_mgr.PROTO_BUFF, true);
netbus.start_ws_server(host, posts[3], proto_mgr.PROTO_JSON, true);

//连接到服务器
let game_server = game_config.game_server;
for (let key in game_server) {
    let server = game_server[key];
    netbus.connect_tcp_server(server.stype, server.host, server.port, proto_mgr.PROTO_BUFF, false);
}

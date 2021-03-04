const Stype = require("./Stype");

let game_config = {
    getway_config: {
        host: "127.0.0.1",
        ports: [7080, 7081, 7082, 7083],
    },
    game_server: {
        0: {
            stype: Stype.TalkRoom,
            host: "127.0.0.1",
            port: 7084,
        },
        1: {
            stype: Stype.Auth,
            host: "127.0.0.1",
            port: 7086,
        }
    }
}
module.exports = game_config;
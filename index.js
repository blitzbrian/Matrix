// Config
const config = {
    host: "0.0.0.0",
    port: 25565,
    maxPlayers: 10,
    version: "auto",
    // Use a cracked server to allow you to join cracked servers through the proxy
    // You will still need to have a minecraft account to join the proxy
    defaultServer: "sus.shhnowisnottheti.me",
    onlineMode: true
};
// End Config

const version = "1.0";

const LunarClient = require("@minecraft-js/lunarbukkitapi");
const mc = require("minecraft-protocol");
const mcData = require("minecraft-data");

const commands = require("./commands");
const createClient = require("./client");
const { switchGamemode } = require("./utils");


const server = mc.createServer({
    maxPlayers: config.maxPlayers,
    host: config.host,
    port: config.port,
    // Don't disable this, if disabled it would be a huge security hazard
    "online-mode": config.onlineMode,
    version: config.version === "auto" ? false : config.version,
    motd:
        "\u00a7l \u00a7a                            Matrix\u00a7r\n\u00a7l  \u00a7b                            v" +
        version,
    favicon:
        "data:image/png;base64,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",
});

server.on("listening", () => {
    console.log("Matrix v" + version);
    console.log("Config:", config);
});

server.on("login", function (client) {
    client.mcData = mcData(client.version);

    client.lunarPlayerChannel = "";
    client.lunarPlayer = new LunarClient.LunarClientPlayer({
        customHandling: {
            registerPluginChannel(channel) {
                client.lunarPlayerChannel = channel;

                client.write("custom_payload", {
                    channel: "REGISTER",
                    data: Buffer.from(channel + "\0"),
                });
            },

            sendPacket(buffer) {
                client.write("custom_payload", {
                    channel: client.lunarPlayerChannel,
                    data: buffer,
                });
            },
        },
    });

    client.trackers = {
        gamemode: 0,
        bars: [],
        players: {
            uuids: [],
            uuidToName: {},
            idToName: {},
        },
    };

    client.clientVersion = client.version;

    client.forwardAll = true;

    client.offline = client.username;

    createClient(client, config.defaultServer, 25565);

    // Commands

    client.on("chat_message", (data) => {
        if (!data.message.startsWith(".")) return;
        let args = data.message.split(" ");
        commands(args, client, config);
    });

    client.on("chat", (data) => {
        if (!data.message.startsWith(".")) return;
        let args = data.message.split(" ");
        commands(args, client, config);
    });

    // End local client on error or disconnect

    client.on("end", () => {
        if (client.localClient) client.localClient.end();
        if(client.killaura) clearInterval(client.killaura);
    });

    client.on("error", () => {
        if (client.localClient) client.localClient.end();
        if(client.killaura) clearInterval(client.killaura);
    });

    // Forward packets to server
    client.on("packet", (data, metadata) => {
        // The proxy responds to these
        if(metadata.name === 'use_entity') console.log(data)
        if (metadata.name === "teleport_confirm") return;
        if (
            (metadata.name === "chat_message" || metadata.name === "chat") &&
            data.message.startsWith(".")
        )
            return;
        if (metadata.name === "position" || metadata.name === "position_look") {
            if (client.vclip) {
                // Velocity cap bypass
                for (let i = 0; i < 8; i++) {
                    client.localClient.write("position", data);
                }
                // Teleport
                client.write("position", {
                    ...data,
                    y: data.y + client.vclip,
                    flags: 0x00,
                });
                client.vclip = false;
            } else if (client.freecam === true) return;
            else if (client.freecam === "tp") {
                // Velocity cap bypass
                for (let i = 0; i < 8; i++) {
                    client.localClient.write("position", client.freecamPos);
                }
                // Teleport
                client.localClient.write("position", data);

                // Disable Freecam

                client.freecam = false;
                // Reset players gamemode
                switchGamemode(client, client.trackers.gamemode)
            } else if (client.tp === true) {
                // Velocity cap bypass
                for (let i = 0; i < 8; i++) {
                    client.localClient.write("position", data);
                }
                // Teleport
                client.write("position", client.tpPos);

                client.tp = false;
            } else if (client.tp === "waiting") {
                // Save position
                client.tpPos = data;
                client.tp = false;

                // client.write('named_entity_spawn', {
                // 	entityId: 696969,
                // 	playerUUID: client.fakePlayer,
                // 	x: data.x,
                // 	y: data.y,
                // 	z: data.z,
                // 	yaw: data.yaw | 0,
                // 	pitch: data.pitch | 0,
                // });
            } else if (client.freecam === "waiting") {
                // Enable position blocker
                client.freecam = true;
                // Save current position
                client.freecamPos = data;
                // Set player to spectator mode
                switchGamemode(client, 3)
            }
        }
        if (
            client.forwardAll ||
            (client.localClient?.state === mc.states.PLAY &&
                metadata.state === mc.states.PLAY)
        ) {
            // console.log("From Client" + metadata.name, ": " + data);
            client.localClient.write(metadata.name, data);
        }
    });
});

const { sendMessage, switchGamemode } = require("./utils");
const createClient = require("./client");

class Command {
    constructor(name, description, args) {
        this.name = name;
        this.description = description;
        this.args = args;
    }

    run(args, client, config) {
        if (args[0] === "." + this.name) {
            this.command(args, client, config);
            return true;
        }
    }
}

class Fly extends Command {
    constructor() {
        super("fly", "Let's you fly", "(on / off / speed)");
    }

    command(args, client) {
        sendMessage(
            client,
            `[{"text":"[Matrix] ", "color": "green"}, {"text":"${
                args[1] === "on" || !isNaN(parseInt(args[1]))
                    ? "Enabled"
                    : "Disabled"
            } fly", "color": "white"}]`
        );
        client.write("abilities", {
            flags: args[1] === "on" || !isNaN(parseInt(args[1])) ? 4 : 0,
            flyingSpeed:
                (isNaN(parseInt(args[1])) ? 1 : parseInt(args[1])) / 20,
        });
    }
}

// class Speed extends Command {
//     constructor() {
//         super('speed', 'Gotta go fast', '(speed / off)')
//     }

//     command(args, client) {
//         if(args[1] === 'off') {
//             client.write('remove_entity_effect', {
//                 entityId: client.realId,
//                 effectId: 1
//             });
//             return;
//         }
//         client.write('entity_effect', {
//             entityId: client.realId || client.id,
//             effectId: 1,
//             amplifier: parseInt(args[1]) - 1,
//             duration: 9999999,
//             hideParticles: 0
//         });
//     }
// }

class Freecam extends Command {
    constructor() {
        super(
            "freecam",
            "Look around the world without moving yourself",
            "(on / off / tp)"
        );
    }

    command(args, client) {
        if (args[1] === "tp") {
            if (client.freecam === true) {
                // Teleport
                client.freecam = "tp";
                sendMessage(
                    client,
                    `[{"text":"[Matrix] ", "color": "green"}, {"text":"Poof!", "color": "white"}]`
                );
            } else {
                sendMessage(
                    client,
                    `[{"text":"[Matrix] ", "color": "green"}, {"text":"You need to enable freecam first", "color": "white"}]`
                );
            }
            return;
        }

        sendMessage(
            client,
            `[{"text":"[Matrix] ", "color": "green"}, {"text":"${
                args[1] === "on" ? "Enabled" : "Disabled"
            } freecam", "color": "white"}]`
        );

        if (args[1] !== "on" && client.freecam === true) {
            // Reset players gamemode
            switchGamemode(client, client.trackers.gamemode)

            // Teleport the player back
            client.write("position", client.freecamPos);

            client.freecam = false;
        }
        if (args[1] === "on" && !client.freecam) {
            // Generate UUID for fake player
            // client.fakePlayer = crypto.randomUUID();

            // console.log(client.fakePlayer);

            // client.write('player_info', {
            // 	action: 1,
            // 	data: [
            // 		{
            // 			uuid: client.fakePlayer,
            // 			player: {
            // 				name: client.username,
            // 				properties: []
            // 			}
            // 		}
            // 	]
            // });

            // This saves the current position and enables the position blocker
            client.freecam = "waiting";
        }
    }
}

class Tp extends Command {
    constructor() {
        super("tp", "Teleport you to a saved position", "(save)");
    }

    command(args, client) {
        if (args[1] === "save") {
            client.tp = "waiting";
            sendMessage(
                client,
                `[{"text":"[Matrix] ", "color": "green"}, {"text":"Saved position", "color": "white"}]`
            );
        } else if (!client.tpPos) {
            sendMessage(
                client,
                `[{"text":"[Matrix] ", "color": "green"}, {"text":"Save a position first", "color": "white"}]`
            );
        } else {
            sendMessage(
                client,
                `[{"text":"[Matrix] ", "color": "green"}, {"text":"Poof!", "color": "white"}]`
            );
            client.tp = true;
        }
    }
}

class Gamemode extends Command {
    constructor() {
        super("gamemode", "Switches your client gamemode", "[number]");
    }

    command(args, client) {
        sendMessage(
            client,
            `[{"text":"[Matrix] ", "color": "green"}, {"text":"Gamemode changed to ${parseInt(
                args[1]
            )}", "color": "white"}]`
        );
        switchGamemode(client, parseInt(args[1]))
    }
}

class Autoreconnect extends Command {
    constructor() {
        super(
            "autoreconnect",
            "Automatically reconnects on kick",
            "(on / off)"
        );
    }

    command(args, client) {
        sendMessage(client, `[{"text":"[Matrix] ", "color": "green"}, {"text":"${
                args[1] === "on" ? "Enabled" : "Disabled"
            } autoreconnect", "color": "white"}]`)
        client.autoreconnect = true;
    }
}

class Vclip extends Command {
    constructor() {
        super("vclip", "Teleports you up or down", "[distance]");
    }

    command(args, client) {
        sendMessage(client, `[{"text":"[Matrix] ", "color": "green"}, {"text":"Poof!", "color": "white"}]`)
        client.vclip = parseInt(args[1]);
    }
}

class Health extends Command {
    constructor() {
        super("health", "Shows you the health of another player", "(on / off)");
    }

    command(args, client) {
        sendMessage(client, `[{"text":"[Matrix] ", "color": "green"}, {"text":"${
                args[1] === "on" ? "Enabled" : "Disabled"
            } health", "color": "white"}]`)

        if (args[1] === "on") {
            // Create scoreboard
            client.write("scoreboard_objective", {
                name: "matrix_health",
                // Create
                action: 0,
                displayText: '{"text":"❤", "color":"red"}',
                type: client.mcData.version['>=']('1.13') ? 1 : 'integer',
            });

            // Set display below name
            client.write("scoreboard_display_objective", {
                position: 2,
                name: "matrix_health",
            });
        } else {
            // Remove scoreboard
            client.write("scoreboard_objective", {
                name: "matrix_health",
                // Remove
                action: 1,
            });
        }
        client.health = args[1] === "on";
    }
}

class Disconnect extends Command {
    constructor() {
        super("disconnect", "Disconnects you from a server");
    }

    command(args, client) {
        sendMessage(client, `[{"text":"[Matrix] ", "color": "green"}, {"text":"Disconnected", "color": "white"}]`)

        if (client.localClient) client.localClient.end();
    }
}

class Server extends Command {
    constructor() {
        super("server", "Connects you to a server", "[host] (port)");
    }

    command(args, client) {
        if (!args[1]) {
            sendMessage(client, `[{"text":"[Matrix] ", "color": "green"}, {"text":"Correct usage: .server [host] (port)", "color": "white"}]`)
            return;
        }
        sendMessage(client, `[{"text":"[Matrix] ", "color": "green"}, {"text":"Connecting you with ${args[1]}", "color": "white"}]`)

        // End client
        if (client.localClient) client.localClient.end();

        // Make new client
        createClient(client, args[1], args[2] || 25565);
    }
}

class Offline extends Command {
    constructor() {
        super("offline", "Enables offline mode", "[username]");
    }

    command(args, client) {
        client.offline = args[1];
        sendMessage(client, `[{"text":"[Matrix] ", "color": "green"}, {"text":"Enabled offline mode with username '${args[1]}'", "color": "white"}]`)
    }
}

class Online extends Command {
    constructor() {
        super("online", "Enables online mode");
    }

    command(args, client, config) {
        if (!config.onlineMode) {
            sendMessage(client, `[{"text":"[Matrix] ", "color": "green"}, {"text":"Enable online mode on the server for this to work", "color": "white"}]`)
            return;
        }
        client.offline = false;
        sendMessage(client, `[{"text":"[Matrix] ", "color": "green"}, {"text":"Enabled online mode", "color": "white"}]`)
    }
}

class Reconnect extends Command {
    constructor() {
        super("reconnect", "Reconnect you to the server");
    }

    command(args, client) {
        if (client.localClient) client.localClient.end();

        // Make new client
        createClient(
            client,
            client.localClient?.socket?._host,
            client.localClient?.authflow?.options?.port
        );
    }
}

class Resourcepack extends Command {
    constructor() {
        super("resourcepack", "Disables server resourcepacks", "(on / off)");
    }

    command(args, client) {
        sendMessage(client, `[{"text":"[Matrix] ", "color": "green"}, {"text":"${
                args[1] === "on" ? "Enabled" : "Disabled"
            } resourcepack", "color": "white"}]`)
        client.resourcepack = args[1] === "on";
    }
}

class Help extends Command {
    constructor() {
        super("help", "Shows this help page");
    }

    command(args, client) {
        sendMessage(
            client,
            `[{"text":"[Matrix] ", "color": "green"}, {"text":"Help:", "color": "white"}]`
        );

        commands.forEach((command) => {
            sendMessage(
                client,
                `{"text":".${command.name}${
                    command.args ? " " + command.args : ""
                }: ${command.description}", "color": "white"}`
            );
        });
    }
}

class Lunar extends Command {
    constructor() {
        super("lunar", "xray for lunarclient");
    }

    command(args, client) {
        client.lunarPlayer.setStaffModState("XRAY", true);
        sendMessage(
            client,
            `[{"text":"[Matrix] ", "color": "green"}, {"text":"Enabled xray for lunarclient", "color": "white"}]`
        );
    }
}

class Version extends Command {
    constructor() {
        super("version", "Change the version of the proxy", "[version]");
    }

    command(args, client) {
        client.clientVersion = args[1];
    }
}

class List extends Command {
    constructor() {
        super("list", "List all players", "(all / loaded)");
    }

    command(args, client) {
        if(args[1] === 'loaded') {
            const ids = Object.keys(client.trackers.players.idToName)
            sendMessage(
                client,
                `[{"text":"[Matrix] ", "color": "green"}, {"text":"Total loaded players: ${ids.length}", "color": "white"}]`
            );
            ids.forEach(id => {
                sendMessage(client, `{"text": "${client.trackers.players.idToName[id]}"}`)
            });
        } else {
            const uuids = Object.keys(client.trackers.players.uuidToName)
            sendMessage(
                client,
                `[{"text":"[Matrix] ", "color": "green"}, {"text":"Total players: ${uuids.length}", "color": "white"}]`
            );
            uuids.forEach(uuid => {
                sendMessage(client, `{"text": "${client.trackers.players.uuidToName[uuid]}"}`)
            });
        }

    }
}

class KillAura extends Command {
    constructor() {
        super("killaura", "Automatically hit a certain player in a range", "[player / off] (cps)");
    }

    command(args, client) {
        if(args[1] === 'off') {
            if(client.killaura) clearInterval(client.killaura);
            sendMessage(
                client,
                `[{"text":"[Matrix] ", "color": "green"}, {"text":"Turned off killaura", "color": "white"}]`
            );
            return;
        }

        const cps = args[2] || 5

        let entityId;

        Object.keys(client.trackers.players.idToName).forEach(id => {
            if(client.trackers.players.idToName[id] === args[1]) entityId = id;
        });

        if(!entityId) {
            sendMessage(
                client,
                `[{"text":"[Matrix] ", "color": "green"}, {"text":"Player not found, make sure the name shows up in .list This is case sensitive.", "color": "white"}]`
            );
            return;
        }

        sendMessage(
            client,
            `[{"text":"[Matrix] ", "color": "green"}, {"text":"Enabled killaura for ${args[1]}", "color": "white"}]`
        );

        client.killaura = setInterval(() => {
            let entityId;

            Object.keys(client.trackers.players.idToName).forEach(id => {
                if(client.trackers.players.idToName[id] === args[1]) entityId = id;
            });
    
            if(!entityId) {
                clearInterval(client.killaura);
                return
            };

            client.localClient.write('use_entity', {
                target: entityId,
                mouse: 1,
                sneaking: false
            })
            client.localClient.write('arm_animation', {})
        }, 1000 / cps)
    }
}

// class Template extends Command {
//     constructor() {
//         super('name', 'description', 'args');
//     }

//     command(args, client) {

//     }
// }

let commands = [
    new Server(),
    new Fly(),
    // new Speed(),
    new Freecam(),
    new Tp(),
    new Vclip(),
    new Health(),
    new Autoreconnect(),
    new Disconnect(),
    new Offline(),
    new Online(),
    new Reconnect(),
    new Gamemode(),
    new Resourcepack(),
    new Help(),
    new Lunar(),
    new Version(),
    new List(),
    new KillAura()
];

const Handler = (args, client, config) => {
    let run = false;
    commands.forEach((command) => {
        if (command.run(args, client, config)) run = true;
    });
    if (run === false) {
        sendMessage(
            client,
            `[{"text":"[Matrix] ", "color": "green"}, {"text":"Command not found", "color": "white"}]`
        );
    }
};

module.exports = Handler;

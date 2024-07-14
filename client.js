const mc = require("minecraft-protocol");

const { sendMessage } = require("./utils");

const createClient = (client, host, port) => {
    if (client.killaura) {
        clearInterval(client.killaura);
    }

    // Remove boss bars
    client.trackers.bars.forEach((uuid) => {
        client.write("boss_bar", {
            entityUUID: uuid,
            action: 1,
        });
    });

    // Reset tab list headers
    client.write("playerlist_header", {
        header: '{"text":""}',
        footer: '{"text":""}',
    });

    // Reset tab list players
    if (client.mcData.supportFeature("playerInfoActionIsBitfield"))
        client.write("player_remove", {
            players: client.trackers.players.uuids,
        });
    else
        client.write("player_info", {
            action: 4,
            data: client.trackers.players.uuids.map((uuid) => ({ UUID: uuid })),
        });

    client.trackers.bars = [];
    client.trackers.players.uuids = [];
    client.trackers.players.uuidToName = {};
    client.trackers.players.idToName = {};
    client.trackers.uuid = "";

    client.localClient = mc.createClient({
        host: host,
        port: port,
        username: client.offline ? client.offline : client.username,
        auth: client.offline ? undefined : "microsoft",
        version: client.clientVersion,
        onMsaCode: (data) => {
            sendMessage(
                client,
                '{"text":"To use this proxy in online mode you need to log in with your minecraft account"}'
            );
            sendMessage(
                client,
                `{"text":"Go to https://www.microsoft.com/link?otc=${data["user_code"]}, and login", "clickEvent":{"action":"open_url","value":"https://www.microsoft.com/link?otc=${data["user_code"]}"}}`
            );
        },
    });

    // Forward packets to client
    client.localClient.on("packet", (data, metadata) => {
        if (metadata.name === "bundle_delimiter") return;
        if (metadata.name === "resource_pack_send" && client.resourcepack)
            return;
        if (metadata.name === "kick_disconnect") return;
        if (metadata.name === "keep_alive") return;
        if (metadata.name === "custom_payload") {
            if (!data.channel.startsWith("minecraft:")) return;
            if (data.channel === "minecraft:register") return;
        }
        if (
            client.state === mc.states.PLAY &&
            metadata.state === mc.states.PLAY
        ) {
            client.write(metadata.name, data);
        }
    });

    // Respond with a teleport confirm packet
    client.localClient.on("position", (data, metadata) => {
        if (!data.teleportId) return;
        client.localClient.write("teleport_confirm", {
            teleportId: data.teleportId,
        });
    });

    // Compression Threshold
    client.localClient.on("set_compression", (data, metadata) => {
        // Set compression
        client.compressionThreshold = data.threshold;
    });

    client.localClient.on("resource_pack_send", (data, metadata) => {
        if (!client.resourcepack) return;
        // Accept
        client.localClient.write("resource_pack_receive", {
            result: 3,
        });
        // Successfully loaded
        setTimeout(() => {
            client.localClient.write("resource_pack_receive", {
                result: 0,
            });
            sendMessage(
                client,
                `[{"text":"[Matrix] ", "color": "green"}, {"text":"Spoofed resourcepack packet", "color": "white"}]`
            );
        }, Math.round(Math.random() * 1000));
    });

    // Reset entity id on login
    client.localClient.on("login", (data, metadata) => {
        // Save the entity id so we can use it in our spoofed packets
        client.realId = data.entityId;
        client.trackers.gamemode = data.gameMode;
        client.write("respawn", {
            dimension: data.worldType,
            worldType: data.worldType,
            levelType: data.levelType,
            worldName: data.worldName,
            hashedSeed: data.hashedSeed,
            gamemode: data.gameMode,
            previousGameMode: data.previousGameMode,
            isDebug: data.isDebug,
            isFlat: data.isFlat,
            copyMetadata: false,
            death: data.death,
            difficulty: data.difficulty || "",
            portalCooldown: data.portalCooldown,
        });
        client.forwardAll = false;

        // Health

        if (!client.health) return;

        // Create scoreboard
        client.write("scoreboard_objective", {
            name: "matrix_health",
            // Create
            action: 0,
            displayText: '{"text":"❤", "color":"red"}',
            type: client.mcData.version[">="]("1.13") ? 1 : "integer",
        });

        // Set display below name
        client.write("scoreboard_display_objective", {
            position: 2,
            name: "matrix_health",
        });
    });

    // Trackers
    client.localClient.on("game_state_change", (data, metadata) => {
        if (data.reason === 3) client.trackers.gamemode = data.gameMode;
    });

    // Add player and remove player
    client.localClient.on("player_info", (data, metadata) => {
        data.data.forEach((player) => {
            const playerUUID = player.uuid || player.UUID;
            if (
                player.name === client.localClient.username ||
                player.player?.name === client.localClient.username
            )
                client.trackers.uuid = playerUUID;
            // For older clients that don't have the 'player_remove' packet
            if (data.action === 4 && !player.gamemode) {
                client.trackers.players.uuids =
                    client.trackers.players.uuids.filter((uuid) => {
                        if (uuid !== playerUUID) {
                            return uuid;
                        }
                    });
                Object.keys(client.trackers.players.uuidToName).forEach(
                    (uuid) => {
                        if (uuid === playerUUID) {
                            delete client.trackers.players.uuidToName[uuid]
                        }
                    }
                );
			// Add player
            } else if (!client.trackers.players.uuids.includes(playerUUID)) {
                client.trackers.players.uuids.push(playerUUID);
                if (player.name || player.player?.name) {
                    client.trackers.players.uuidToName[playerUUID] =
                        player.name || player.player?.name;
                }
            }
        });
    });

    // Remove player
    client.localClient.on("player_remove", (data, metadata) => {
        data.players.forEach((player) => {
            client.trackers.players.uuids =
                client.trackers.players.uuids.filter((uuid) => {
                    if (uuid !== player) return uuid;
                });
				Object.keys(client.trackers.players.uuidToName).forEach(
					(uuid) => {
						if (uuid === player) {
							delete client.trackers.players.uuidToName[uuid]
						}
					}
				);
        });
		
    });

	client.localClient.on("entity_destroy", (data, metadata) => {
		data.entityIds.forEach(entityId => {
			if(client.trackers.players.idToName[entityId]) delete client.trackers.players.idToName[entityId];
		});
	})


    // Save id with name
    client.localClient.on("named_entity_spawn", (data, metadata) => {
        if (
            typeof client.trackers.players.uuidToName[data.playerUUID] !==
            "string"
        )
            return;
        client.trackers.players.idToName[data.entityId] =
            client.trackers.players.uuidToName[data.playerUUID];
    });

    client.localClient.on("entity_metadata", (data, metadata) => {
        if (!client.health) return;
        if (typeof client.trackers.players.idToName[data.entityId] !== "string")
            return;

        data.metadata.forEach((meta) => {
            if (meta.type !== "float" || meta.key !== 9) return;
            client.write("scoreboard_score", {
                itemName: client.trackers.players.idToName[data.entityId],
                // Create / Update
                action: 0,
                scoreName: "matrix_health",
                value: meta.value,
            });
        });
    });

    client.localClient.on("boss_bar", (data, metadata) => {
        // Add bar
        if (data.action === 0) client.trackers.bars.push(data.entityUUID);
        // Remove bar
        else if (data.action === 1)
            client.trackers.bars = client.trackers.bars.filter((uuid) => {
                if (uuid !== data.entityUUID) return uuid;
            });
    });

    // Kick messages

    const onKick = (data, metadata) => {
        sendMessage(
            client,
            `[{"text":"[Matrix] ", "color": "green"}, {"text":"You got kicked for:", "color": "white"}]`
        );
        sendMessage(client, data.reason);

        if (client.autoreconnect) {
            sendMessage(
                client,
                `[{"text":"[Matrix] ", "color": "green"}, {"text":"Reconnecting in 5s", "color": "white"}]`
            );

            setTimeout(() => {
                // End client
                if (client.localClient) client.localClient.end();

                // Make new client
                createClient(
                    client,
                    client.localClient.socket._host,
                    client.localClient.authflow?.options?.port
                );
            }, 5000);
        }
    };

    client.localClient.on("disconnect", onKick);
    client.localClient.on("kick_disconnect", onKick);

    // Error handling

    client.localClient.on("end", () => {});
    client.localClient.on("error", (err) => {
        sendMessage(
            client,
            `[{"text":"[Matrix] ", "color": "green"}, {"text":"${err}", "color": "white"}]`
        );
    });
};

module.exports = createClient;

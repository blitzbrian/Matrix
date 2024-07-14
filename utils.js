const sendMessage = (client, message) => {
    const signedChat = client.mcData.supportFeature('signedChat')
    if(signedChat) client.write('system_chat', {
		content: message,
		isActionBar: false,
	});
    else client.write('chat', {
		message,
        position: 0,
        sender: 0
    });
}

const switchGamemode = (client, gamemode) => {
    client.write("game_state_change", {
        reason: 3,
        gameMode: gamemode,
    });

    client.write("player_info", {
        // Update Gamemode
        action: client.mcData.supportFeature("playerInfoActionIsBitfield") ? 4 : 1,
        data: [
            {
                uuid: client.trackers.uuid,
                UUID: client.trackers.uuid,
                gamemode
            },
        ],
    });
}

module.exports = { sendMessage, switchGamemode }
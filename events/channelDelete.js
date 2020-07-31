const { stopGuessing, stopWatching } = require('../utils/functions');
const { existsSync, unlinkSync } = require('fs');
const logger = require('../utils/logger');

module.exports = (client) => {
	client.on('channelDelete', (channel) => {
		if (client.watchingChannel && channel.id === client.watchingChannel.id) {
			logger.error('The GTN channel was removed !');
			if (existsSync('./toTry.json')) unlinkSync('./toTry.json');
			stopGuessing(client); stopWatching(client);
			logger.info('Stopped the bot.');
		}
	});
};
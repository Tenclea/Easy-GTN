const { saveAttempts, stopGuessing, stopWatching } = require('../utils/functions');
const logger = require('../utils/logger');

module.exports = {
	name: 'stop',
	aliases: [],
	description: 'Stops any current guesses collector (watch & guess)',
	usage: '',

	run: (client) => {
		if (!client.toTry) return logger.error('Could not stop : The bot is not trying to find any answers yet !');

		if (client.config.saveBeforeStop) saveAttempts(client, true);
		stopGuessing(client);
		stopWatching(client);
		return logger.info('Successfully stopped the guessing bot.');
	},
};
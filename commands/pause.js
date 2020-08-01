const { saveAttempts, startGuessing } = require('../utils/functions');
const logger = require('../utils/logger');

module.exports = {
	name: 'pause',
	aliases: ['p'],
	description: 'Pauses the guesses (will keep on watching)',
	usage: '',

	run: (client) => {
		if (!client.toTry) return logger.error('You need to start a session before using the pause command.');

		if (client.toTryLoop) {
			clearTimeout(client.toTryLoop); delete client.toTryLoop; saveAttempts(client);
			return logger.info('Successfully paused the guesses. Use the pause (or resume) command again to resume.');
		}
		else { startGuessing(client); return logger.info('Successfully resumed the guesses. Use the pause command again time to pause.'); }
	},
};
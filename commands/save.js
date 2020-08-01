const { saveAttempts } = require('../utils/functions');
const logger = require('../utils/logger');

module.exports = {
	name: 'save',
	aliases: [],
	description: 'Writes the current left attempts to the backup file.',
	usage: '',

	run: (client) => {
		if (!client.toTry) return logger.error('You need to start a session before using the save command.');
		return saveAttempts(client, true);
	},
};
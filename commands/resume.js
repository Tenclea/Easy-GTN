const { startGuessing, startWatching, tryLastMessages } = require('../utils/functions');
const { existsSync, readFileSync } = require('fs');
const logger = require('../utils/logger');

module.exports = {
	name: 'resume',
	aliases: [],
	description: 'Resumes a guessing session using the backup json file.',
	usage: '',

	run: (client, message) => {
		try {
			if (!existsSync('./toTry.json')) return logger.error('Could not find anything to resume.');
			if (!client.toTry) {
				const range = !isNaN(parseInt(client.config.defaultRange)) ? client.config.defaultRange : 1000000;
				client.toTry = [...Array(range + 1).keys()]; client.toTry.shift();
				client.watchingChannel = message.channel;

				setTimeout(() => {
					startGuessing(client);
					startWatching(client, message);
					tryLastMessages(client, message.channel);
				}, 2500);
			}
			if (!client.toTryLoop) {
				startGuessing(client);
			}

			// Removes every values that were used in the saved session.
			const toResume = JSON.parse(readFileSync('./toTry.json'));
			client.toTry = client.toTry.filter(value => toResume.includes(value));
			return logger.info(`Successfully removed the previously tried values. ${client.toTry.length} numbers left !`);
		}
		catch (e) { return logger.error('An error occurred : ' + e); }

	},
};
const { startWatching, stopGuessing, tryLastMessages } = require('../utils/functions');
const logger = require('../utils/logger');

module.exports = {
	name: 'watch',
	aliases: ['w'],
	description: 'Watches in che message\'s channel for any numbers.',
	usage: '[range]',

	run: (client, message, args) => {
		if (client.isWatching && !client.toTryLoop) return logger.error(`Could not start watching for guesses in ${message.guild.name}. It seems that the bot is already watching somewhere else.`);

		if (!client.toTry) {
			// Sets the game's range
			let range = client.config.defaultRange;
			if (args[0]) {
				const newRange = parseInt(args[0]);
				if (!isNaN(newRange) && newRange >= 2 && newRange <= 1000000) range = newRange;
				else logger.error('The input range seems to be incorrect. Switching to default one.');
			}

			// Array of all possible numbers in given range
			client.toTry = [...Array(range + 1).keys()]; client.toTry.shift();
		}
		else {
			const bckp = client.toTry;
			stopGuessing(client);
			client.toTry = bckp;
			logger.info('Switching from guessing to watching...');
		}
		startWatching(client, message);
		tryLastMessages(client, message.channel);

		return logger.info(`Started a new watching session in ${client.watchingChannel.name} ! ${client.toTry.length} numbers left.`);

	},
};
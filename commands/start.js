const { startGuessing, startWatching, tryLastMessages } = require('../utils/functions');
const logger = require('../utils/logger');

module.exports = {
	name: 'start',
	aliases: ['s'],
	description: 'Starts guessing numbers in the message\'s channel.',
	usage: '[range]',

	run: (client, message, args) => {
		if (client.toTryLoop) return logger.error(`Could not start guessing in ${message.guild.name}. It seems that the bot is already trying to guess the number somewhere else.`);

		if (!client.toTry || client.toTry.length === 0) {
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

		tryLastMessages(client, message.channel);
		startWatching(client, message);

		logger.info(`Starting a new guessing session in ${client.watchingChannel.name} ! ${client.toTry.length} guesses to go !`);

		startGuessing(client);

		message.channel.startTyping();
		return;
	},
};
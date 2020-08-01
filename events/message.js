const { startGuessing, stopGuessing, startWatching, stopWatching, tryLastMessages } = require('../utils/functions');
const { existsSync, unlinkSync } = require('fs');
const didYouMean = require('didyoumean2').default;
const logger = require('../utils/logger');

module.exports = (client) => {
	client.on('message', (message) => {

		const config = client.config;

		// Removes guesses from other users
		if (client.toTry && message.channel.id === client.watchingChannel.id && !isNaN(parseInt(message.content))) {
			const number = parseInt(message.content);
			if (!client.toTry.includes(number)) return;

			// Removes the number from toTry list
			client.attempts.users++;
			client.toTry.splice(client.toTry.indexOf(number), 1);

			if (message.author.id === client.user.id) logger.debug(`You tried ${number}`);
			else logger.debug(`Somebody else tried ${number}`);

			if (client.toTry.length === 1 && client.isWatching) logger.warn(`THERE IS ONLY ONE NUMBER LEFT TO TRY >>> ${client.toTry[0]} !!`);
			return;
		}

		// Check if the game's bot sends any messages
		if (message.author.id === config.botID) {
			// Check if a game just started
			if (message.embeds[0] && message.embeds[0].footer && message.embeds[0].footer.text && message.embeds[0].footer.text.includes('Started by:')) {
				if (!message.embeds[0].description) return;

				if (message.embeds[0].description.includes('game starting in')) { return logger.info(`A GTN game is about to start in ${message.guild.name} !`); }
				else if (message.embeds[0].description.includes(':tada: Guess that number!')) {
					// Scrape range from message's embed
					let range = parseInt(message.embeds[0].description.replace(/,/g, '').split('`').find(val => !isNaN(parseInt(val)) && parseInt(val) !== 1));
					if (!range) range = config.defaultRange;

					if (!config.autoStart) { return logger.info(`A GTN game just started in ${message.guild.name} ! Range : 1 to ${range}.`); }
					else if (client.toTry) { return logger.info(`Could not auto-start guessing in ${message.guild.name} : The bot is already watching/guessing somewhere else.`); }
					else {
						setTimeout(() => {
							client.toTry = [...Array(range + 1).keys()]; client.toTry.shift();

							tryLastMessages(client, message.channel);
							startWatching(client, message);

							logger.info(`Auto-starting a new guessing session in ${client.watchingChannel.name} ! ${client.toTry.length} guesses to go !`);

							startGuessing(client);
							message.channel.startTyping();
							return;
						}, 2500);
					}
				}
			}
			// Check if game ended
			else if (message.embeds[0] && message.embeds[0].description && message.embeds[0].description.startsWith(':tada:')) {
				if (message.embeds[0].author.name === client.user.tag) { logger.info('Congratulations, you won the game !'); }
				else if (message.channel.id === client.watchingChannel.id) { logger.info(`${message.embeds[0].author.name} won the GTN game.. You'll have better luck next time :(`); }
				else { logger.info(`${message.embeds[0].author.name} won a game of GTN in ${message.guild.name}.`); }

				if (client.toTry && message.channel.id === client.watchingChannel.id) {
					stopGuessing(client); stopWatching(client);
					if (existsSync('./toTry.json')) unlinkSync('./toTry.json');
				}

				return;
			}
		}

		// If not a command from the bot's user, ignores the message
		if ((!message.content.startsWith(config.prefix) || message.author.id !== client.user.id)) return;
		if (message.author.id === client.user.id) message.delete(100).catch(() => { });

		const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
		const cmd = args.shift().toLowerCase();

		const command = client.commands.get(cmd) || client.commands.get(client.aliases.get(cmd));
		if (command) { return command.run(client, message, args); }
		else {
			const hit = didYouMean(cmd, client.commands.keyArray());
			if (hit) return logger.error(`Could not find this command : "${cmd}". Did you mean "${hit}" ?`);
			else return logger.error(`Could not find this command : "${cmd}".`);
		}
	});
};
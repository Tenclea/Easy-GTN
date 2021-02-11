const logger = require('../utils/logger');
const { writeFileSync } = require('fs');

module.exports = {
	checkConfig: (conf) => {
		if (typeof conf.autoSave !== 'boolean') logger.error('The autoSave config variable is misconfigured. It should be true or false.');
		if (typeof conf.autoStart !== 'boolean') logger.error('The autoStart config variable is misconfigured. It should be true or false.');
		if (typeof conf.botID !== 'string') logger.error('The botID config variable is misconfigured. It should be a valid User/Bot ID string.');
		if (typeof conf.debugMode !== 'boolean') logger.error('The debugMode config variable is misconfigured. It should be true or false.');
		if (typeof conf.defaultRange !== 'number' || conf.defaultRange <= 2 || conf.defaultRange > 1000000) logger.error('The defaultRange config variable is misconfigured. Make sure to that the range is an integer between 2 and 1,000,000.');
		if (typeof conf.guessInterval !== 'number') logger.error('The guessInterval config variable is misconfigured. It should be an integer.');
		if (typeof conf.guessIntMaxTimeout !== 'number') logger.error('The guessIntMaxTimeout config variable is misconfigured. It should be an integer.');
		if (typeof conf.prefix !== 'string') logger.error('The prefix config variable is misconfigured. It should be a string.');
		if (typeof conf.saveBeforeStop !== 'boolean') logger.error('The saveBeforeStop config variable is misconfigured. It should be true or false.');
		if (typeof conf.token !== 'string') logger.error('The token config variable is misconfigured. It should be a string.');
		return;
	},

	saveAttempts: (client, manual = false) => {
		writeFileSync('./toTry.json', JSON.stringify(client.toTry));
		if (manual) return logger.info(`Successfully saved ${client.toTry.length} left attempts to "toTry.json"`);
		return logger.debug(`Auto-saved ${client.toTry.length} left attempts to "toTry.json"`);
	},

	startGuessing: (client) => {
		logger.info(`Starting a new guessing session in ${client.watchingChannel.name} ! ${client.toTry.length} guesses to go !`);

		client.watchingChannel.startTyping();
		const loop = () => {
			if (client.toTry.length === 0) { module.exports.stopGuessing(client); return logger.info('\nStopping the bot : All numbers have been tried !'); }

			const index = Math.floor(Math.random() * client.toTry.length);
			const letsTryThis = client.toTry[index];
			client.watchingChannel.send(letsTryThis)
				.then(() => {
					client.attempts.bot++;
					logger.debug(`Tried number ${letsTryThis}`);
					client.toTry.splice(index, 1);
				})
				.catch(e => { if (client.toTry) logger.error(`Could not try number ${letsTryThis} : ${e}`); });

			const timeout = client.config.guessInterval + (Math.random() * client.config.guessIntMaxTimeout);
			client.toTryLoop = setTimeout(loop, timeout);
		};
		// Basically a 'setInterval' with variable timeout.
		loop();
	},

	stopGuessing: (client) => {
		const GTNChannel = client.channels.get(client.watchingChannel.id);
		if (GTNChannel) GTNChannel.stopTyping(true);

		delete client.toTry;
		delete client.watchingChannel;
		if (client.toTryLoop) { clearTimeout(client.toTryLoop); delete client.toTryLoop; }

		return;
	},

	startWatching: (client, message) => {
		if (!client.attempts) client.attempts = { bot: 0, users: 0 };
		client.isWatching = true;
		client.watchingChannel = message.channel;

		client.watchingSince = +new Date();

		// Auto-save interval
		if (client.config.autoSave) {
			client.autoSave = setInterval(() => {
				try {
					if (!client.toTry || client.toTry.length === 0) return;
					return module.exports.saveAttempts(client);
				}
				catch (e) { logger.error(`The auto-save failed : ${e}`); }
			}, 60000);
		}
		return;
	},

	stopWatching: (client) => {
		if (client.isWatching) delete client.isWatching;
		if (client.watchingChannel) delete client.watchingChannel;
		if (client.autoSave) { clearInterval(client.autoSave); delete client.autoSave; }
		return;
	},

	tryLastMessages: async (client, channel) => {
		let last = null; let removed = 0;
		// while (!client.stopLastMessages && compt < 50) {
		// Might need deeper testing (50k messages seems quite enough, but idk if Discord will allow it)
		logger.debug('Fetching and removing old tried numbers in the gtn channel, this might take some time...');
		for (let compt = 0; compt < 50; compt++) {
			if (client.stopLastMessages) continue;
			const messages = await channel.fetchMessages({ limit: 100, before: last })
				.catch(e => logger.error(`Could not fetch last messages : ${e}.`));
			messages.forEach(msg => {
				if (msg.author.id === client.config.botID || client.stopLastMessages) { return client.stopLastMessages = true; }
				const number = parseInt(msg.content);
				if (!isNaN(number) && client.toTry.includes(number)) { client.toTry.splice(client.toTry.indexOf(parseInt(msg.content)), 1); removed++; }
			});
			last = messages.lastKey();
		}
		if (client.stopLastMessages) delete client.stopLastMessages;
		logger.info(`Scrapped and removed ${removed} last tried numbers from the GTN channel (${client.toTry.length} left).`);
	},
};
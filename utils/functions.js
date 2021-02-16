const chalk = require('chalk');
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
		const loop = async () => {
			if (client.toTry.length === 0) {
				module.exports.stopGuessing(client);
				return logger.info('Stopping the bot : All numbers have been tried !');
			}

			const letsTryThis = client.toTry[Math.floor(Math.random() * client.toTry.length)];
			await client.watchingChannel.send(letsTryThis)
				.then(() => {
					client.attempts.bot++;
					client.toTry.splice(client.toTry.indexOf(letsTryThis), 1);
					logger.debug(`Tried number ${letsTryThis}`);
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
		let removed = 0; let stop = false;

		logger.debug('Fetching and removing old tried numbers in the gtn channel, this might take a minute...');
		const fetchNumbers = async (last) => {
			let temp = 0;
			const messages = await channel.fetchMessages({ limit: 100, before: last })
				.catch(e => logger.error(`Could not fetch last messages : ${e}`));

			if (messages.size == 0) return logger.info(`Fetched and removed ${removed} messages.`);
			messages.forEach(msg => {
				if (stop) { return; }
				else if (msg.author.id === client.config.botID || !client.toTry) { return stop = true; }

				const number = parseInt(msg.content);
				if (!isNaN(number) && client.toTry.includes(number)) { client.toTry.splice(client.toTry.indexOf(parseInt(msg.content)), 1); temp++; }
			});

			removed += temp;
			logger.debug(chalk.cyan(`Removed ${removed - temp} more old attempts. (${removed} total)`));
			if (removed < 50000 && !stop) setTimeout(() => { fetchNumbers(messages.lastKey() ? messages.lastKey() : last); }, 1000);
			else return logger.info(`Fetched and removed ${removed} previously tried numbers from the GTN channel (${chalk.yellow(client.toTry ? client.toTry.length : -1)} numbers left to try).`);
		};

		return fetchNumbers(null);
	},
};
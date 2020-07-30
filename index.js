process.title = 'Easy-GTN - by Tenclea';
console.clear();

console.log(`
 _____                 _____ _____ _____ 
|   __|___ ___ _ _ ___|   __|_   _|   | |
|   __| .'|_ -| | |___|  |  | | | | | | |
|_____|__,|___|_  |   |_____| |_| |_|___|
              |___|          - by Tenclea
`);

// Client initialization
const { Client } = require('discord.js');
const client = new Client();

// Config variables
let config = require('./config.json');
const prefix = config.prefix;

// Useful functions & modules
const { existsSync, readFileSync, unlinkSync, watchFile, writeFileSync } = require('fs');
const { format, loggers, transports } = require('winston');
const chalk = require('chalk');

loggers.add('main', {
	transports: [new transports.Console()],
	format: format.printf(log => {
		const message = ` » ${log.message}`;
		if (log.level === 'info') return chalk.green(`[${log.level.toUpperCase()}] `) + message;
		else if (log.level === 'warn') return chalk.yellow(`[${log.level.toUpperCase()}] `) + message;
		else if (log.level === 'error') return chalk.red(`[${log.level.toUpperCase()}]`) + message;
		else if (log.level === 'debug') return chalk.blue(`[${log.level.toUpperCase()}]`) + message;
		else return `[${log.level.toUpperCase()}]` + message;
	}),
	level: config.debugMode ? 'debug' : 'info',
});
let logger = loggers.get('main');

// Watch for edits of the config file
watchFile('./config.json', () => {
	// Reads new config & updates it
	config = JSON.parse(readFileSync('./config.json'));
	// Updates logger
	loggers.get('main').level = config.debugMode ? 'debug' : 'info';
	logger = loggers.get('main');

	logger.info('Updated the config variables.');
	return checkConfig(config);
});

// Events
client.once('ready', () => { checkConfig(config); logger.info(`Logged in as ${client.user.tag} on ${new Date().toUTCString()}!\n`); });

client.on('message', (message) => {

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

						tryLastMessages(message.channel);
						startWatching(message);

						logger.info(`Auto-starting a new guessing session in ${client.watchingChannel.name} ! ${client.toTry.length} guesses to go !`);

						startGuessing();
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
				stopGuessing(); stopWatching();
				if (existsSync('./toTry.json')) unlinkSync('./toTry.json');
			}

			return;
		}
	}

	// If not a command from the bot's user, ignores the message
	if ((!message.content.startsWith(prefix) || message.author.id !== client.user.id)) return;
	if (message.author.id === client.user.id) message.delete(100).catch(() => { });

	const args = message.content.slice(prefix.length).trim().split(/ +/g);
	const command = args.shift().toLowerCase();

	if (!command) return;
	if (command === 'start') {
		if (client.toTryLoop) return logger.error(`Could not start guessing in ${message.guild.name}. It seems that the bot is already trying to guess the number somewhere else.`);

		if (!client.toTry || client.toTry.length === 0) {
			// Sets the game's range
			let range = config.defaultRange;
			if (args[0]) {
				const newRange = parseInt(args[0]);
				if (!isNaN(newRange) && newRange >= 2 && newRange <= 1000000) range = newRange;
				else logger.warn('The input range seems to be incorrect. Switching to default one.');
			}

			// Array of all possible numbers in given range
			client.toTry = [...Array(range + 1).keys()]; client.toTry.shift();
		}

		tryLastMessages(message.channel);
		startWatching(message);

		logger.info(`Starting a new guessing session in ${client.watchingChannel.name} ! ${client.toTry.length} guesses to go !`);

		startGuessing();

		message.channel.startTyping();
		return;
	}
	if (command === 'watch') {
		if (client.isWatching && !client.toTryLoop) return logger.error(`Could not start watching for guesses in ${message.guild.name}. It seems that the bot is already watching somewhere else.`);

		if (!client.toTry) {
			// Sets the game's range
			let range = config.defaultRange;
			if (args[0]) {
				const newRange = parseInt(args[0]);
				if (!isNaN(newRange) && newRange >= 2 && newRange <= 1000000) range = newRange;
				else logger.warn('The input range seems to be incorrect. Switching to default one.');
			}

			// Array of all possible numbers in given range
			client.toTry = [...Array(range + 1).keys()]; client.toTry.shift();
		}
		else {
			const bckp = client.toTry;
			stopGuessing();
			client.toTry = bckp;
			logger.info('Switching from guessing to watching...');
		}
		startWatching(message);
		tryLastMessages(message.channel);

		return logger.info(`Started a new watching session in ${client.watchingChannel.name} ! ${client.toTry.length} numbers left.`);
	}
	if (command === 'stop') {
		if (!client.toTry) return logger.error('Could not stop : The bot is not trying to find any answers yet !');

		if (config.saveBeforeStop) saveAttempts();
		stopGuessing();
		stopWatching();
		return logger.info('Successfully stopped the guessing bot.');
	}
	if (command === 'pause') {
		if (!client.toTry) return logger.error('You need to start a session before using the pause command.');

		if (client.toTryLoop) {
			clearTimeout(client.toTryLoop); delete client.toTryLoop;
			saveAttempts();
			return logger.info('Successfully paused the guesses. Use the pause command again to resume.');
		}
		else { startGuessing(); return logger.info('Successfully resumed the guesses. Use the pause command again time to pause.'); }
	}
	if (command === 'stats') {
		const uptime = client.watchingSince ? (+new Date() - client.watchingSince) : 0;
		const totalAtt = client.attempts ? client.attempts.bot + client.attempts.users : 0;
		return console.log(`
==================================
Statistics for nerds :
----------------------
Guessing for : ${(uptime / 1000 / 60).toFixed(2)} minutes
Numbers tried : 
  - Bot   : ${client.attempts ? client.attempts.bot : 0}
  - Users : ${client.attempts ? client.attempts.users : 0}
  - Total : ${totalAtt} | ~${(totalAtt / (uptime / 1000)).toFixed(2)}/s
Numbers left : ${client.toTry ? client.toTry.length : '0'}
Prob. next try correct : ${client.toTry ? ((1 / client.toTry.length) * 100).toFixed(4) + '%' : '0%'}
==================================
`);
	}
	if (command === 'save' || command === 'backup') {
		if (!client.toTry) return logger.error('You need to start a session before using the save command.');
		return saveAttempts(true);
	}
	if (command === 'resume' || command === 'restore') {
		try {
			if (!existsSync('./toTry.json')) return logger.error('Could not find anything to resume.');
			if (!client.toTry) {
				const range = !isNaN(parseInt(config.defaultRange)) ? config.defaultRange : 1000000;
				client.toTry = [...Array(range + 1).keys()]; client.toTry.shift();
				client.watchingChannel = message.channel;

				setTimeout(() => {
					startGuessing();
					startWatching(message);
					tryLastMessages(message.channel);
				}, 2500);
			}

			// Removes every values that were used in the saved session.
			const toResume = JSON.parse(readFileSync('./toTry.json'));
			client.toTry = client.toTry.filter(value => toResume.includes(value));
			return logger.info(`Successfully removed the previously tried values. ${client.toTry.length} numbers left !`);
		}
		catch (e) { return logger.error('An error occurred : ' + e); }
	}
	if (command === 'hint') {
		if (args[0] === 'help' || args[0] === '-h' || args[0] === '--help') {
			return console.log(`
=====================================================================
Hint command help :			
-------------------
Usage   : ${config.prefix}hint [type] [number]
Example : ${config.prefix}hint biggerThan 1000

All available types :
smallerThan (st) > Only keeps all numbers inferior to the chosen number.
biggerThan (bt) > Only keeps all numbers superior to the chosen number.
isEven (ie) > Keeps all even numbers.
isOdd (io) > Keeps all odd numbers.

hasMultiple (hm) > Keeps all numbers with multiple occurrences of the chosen number.
notHasMultiple (nhm) > Removes all numbers with multiple occurrences of the chosen number.

atPos (ap) > Only keeps all numbers with a specific number at the chosen position.
           > Usage : ${config.prefix}hint atPos [position] [number]
notAtPos (nap) > Only keeps all numbers without a specific number at the chosen position.
=====================================================================
`);
		}
		if (!client.toTry) return logger.error('You need to start a session before using this command.');

		if (!args[0]) return logger.error(`You need to choose a type of hint ! (see ${config.prefix}hint help)`);
		const type = args[0].toLowerCase();
		const number = parseInt(args[1]);

		const oldLength = client.toTry.length;

		if (type === 'biggerthan' || type === 'bt') {
			if (isNaN(number)) return logger.error(`You need to choose a valid number ! (see ${config.prefix}hint help)`);
			client.toTry = client.toTry.filter(value => value >= number);
			return logger.info(`Removed ${oldLength - client.toTry.length} numbers smaller than ${number}.`);
		}
		else if (type === 'smallerthan' || type === 'st') {
			if (isNaN(number)) return logger.error(`You need to choose a valid number ! (see ${config.prefix}hint help)`);
			client.toTry = client.toTry.filter(value => value <= number);
			return logger.info(`Removed ${oldLength - client.toTry.length} numbers bigger than ${number}.`);
		}
		else if (type === 'isodd' || type === 'io') {
			client.toTry = client.toTry.filter(value => value % 2 !== 0);
			return logger.info(`Removed ${oldLength - client.toTry.length} even numbers.`);
		}
		else if (type === 'iseven' || type === 'ie') {
			client.toTry = client.toTry.filter(value => value % 2 === 0);
			return logger.info(`Removed ${oldLength - client.toTry.length} odd numbers.`);
		}
		else if (type === 'hasmultiple' || type === 'hm') {
			if (isNaN(number)) return logger.error(`You need to choose a valid number ! (see ${config.prefix}hint help)`);
			client.toTry = client.toTry.filter(value => [...String(value).matchAll(new RegExp(number, 'gi'))].map(a => a[0]).length > 1);
			return logger.info(`Removed ${oldLength - client.toTry.length} numbers without multiple "${number}".`);
		}
		else if (type === 'nothasmultiple' || type === 'nhm') {
			if (isNaN(number)) return logger.error(`You need to choose a valid number ! (see ${config.prefix}hint help)`);

			client.toTry = client.toTry.filter(value => [...String(value).matchAll(new RegExp(number, 'gi'))].map(a => a[0]).length === 1);

			return logger.info(`Removed ${oldLength - client.toTry.length} numbers with multiple "${number}".`);
		}
		else if (type === 'atpos' || type === 'ap') {
			const position = number; const numb = parseInt(args[2]);
			if (isNaN(position)) return logger.error(`You need to choose a valid valid position ! (see ${config.prefix}hint help)`);
			if (isNaN(numb)) return logger.error(`You need to choose a valid valid number ! (see ${config.prefix}hint help)`);

			client.toTry = client.toTry.filter(value => String(value)[position - 1] == numb);
			return logger.info(`Removed ${oldLength - client.toTry.length} numbers without a "${numb}" on pos ${position}.`);
		}
		else if (type === 'notatpos' || type === 'nap') {
			const position = number; const numb = parseInt(args[2]);
			if (isNaN(position)) return logger.error(`You need to choose a valid valid position ! (see ${config.prefix}hint help)`);
			if (isNaN(numb)) return logger.error(`You need to choose a valid valid number ! (see ${config.prefix}hint help)`);

			client.toTry = client.toTry.filter(value => String(value)[position - 1] != numb);
			return logger.info(`Removed ${oldLength - client.toTry.length} numbers with a "${numb}" on pos ${position}.`);
		}
		else { return logger.error(`Could not find hint type : "${type}".`); }
	}
});

client.on('channelDelete', (channel) => {
	if (client.watchingChannel && channel.id === client.watchingChannel.id) {
		logger.warn('The GTN channel was removed !');
		if (existsSync('./toTry.json')) unlinkSync('./toTry.json');
		stopGuessing();
		stopWatching();
		logger.info('Stopped the bot.');
	}
});

// Loop with variable timeout
const startGuessing = async () => {
	// Added random timeout to make the bot look more 'human'.
	const timeout = config.guessInterval + Math.random() * 1500;

	if (client.toTry.length === 0) { stopGuessing(); return logger.info('\nStopping the bot : All numbers have been tried !'); }

	const letsTryThis = client.toTry.splice(Math.floor(Math.random() * client.toTry.length), 1);
	client.watchingChannel.send(letsTryThis)
		.then(() => {
			client.attempts.bot++;
			logger.debug(`Tried number ${letsTryThis}`);
		})
		.catch(e => logger.error(`Could not try number ${letsTryThis} : ${e}`));

	// Here we go again
	client.toTryLoop = setTimeout(startGuessing, timeout);
};

const tryLastMessages = (channel) => {
	channel.fetchMessages({ limit: 100 }).then(messages => {
		const oldLength = client.toTry.length;

		messages.forEach(msg => {
			const number = parseInt(msg.content);
			if (msg.author.bot || client.stopLastMessages) { return client.stopLastMessages = true; }
			else if (!isNaN(number) && client.toTry.includes(number)) { client.toTry.splice(client.toTry.indexOf(parseInt(msg.content)), 1); }
		});

		if (client.stopLastMessages) delete client.stopLastMessages;
		logger.info(`Scrapped and removed ${oldLength - client.toTry.length} last tried numbers from the GTN channel.`);
	});
};

const stopGuessing = () => {
	const GTNChannel = client.channels.get(client.watchingChannel.id);
	if (GTNChannel) GTNChannel.stopTyping(true);

	delete client.toTry;
	delete client.watchingChannel;
	if (client.toTryLoop) { clearTimeout(client.toTryLoop); delete client.toTryLoop; }

	return;
};

const startWatching = (message) => {
	if (!client.attempts) client.attempts = { bot: 0, users: 0 };
	client.isWatching = true;
	client.watchingChannel = message.channel;

	client.watchingSince = +new Date();

	// Auto-save interval
	if (config.autoSave) {
		client.autoSave = setInterval(() => {
			try {
				if (!client.toTry || client.toTry.length === 0) return;
				return saveAttempts();
			}
			catch (e) { logger.error(`The auto-save failed : ${e}`); }
		}, 60000);
	}
	return;
};

const stopWatching = () => {
	if (client.isWatching) delete client.isWatching;
	if (client.watchingChannel) delete client.watchingChannel;
	if (client.autoSave) { clearInterval(client.autoSave); delete client.autoSave; }
	return;
};

const saveAttempts = (manual = false) => {
	writeFileSync('./toTry.json', JSON.stringify(client.toTry));
	if (manual) return logger.info(`Successfully saved ${client.toTry.length} left attempts to "toTry.json"`);
	return logger.debug(`Successfully saved ${client.toTry.length} left attempts to "toTry.json"`);
};

const checkConfig = (conf) => {
	if (typeof conf.autoSave !== 'boolean') logger.error('The autoSave config variable is misconfigured. It should be true or false.');
	if (typeof conf.autoStart !== 'boolean') logger.error('The autoStart config variable is misconfigured. It should be true or false.');
	if (typeof conf.botID !== 'string') logger.error('The botID config variable is misconfigured. It should be a valid User/Bot ID string.');
	if (typeof conf.debugMode !== 'boolean') logger.error('The verbose config variable is misconfigured. It should be true or false.');
	if (typeof conf.defaultRange !== 'number' || conf.defaultRange <= 2 || conf.defaultRange > 1000000) logger.error('The defaultRange config variable is misconfigured. Make sure to that the range is an integer between 2 and 1,000,000.');
	if (typeof conf.guessInterval !== 'number') logger.error('The guessInterval config variable is misconfigured. It should be an integer.');
	if (typeof conf.prefix !== 'string') logger.error('The prefix config variable is misconfigured. It should be a string.');
	if (typeof conf.saveBeforeStop !== 'boolean') logger.error('The saveBeforeStop config variable is misconfigured. It should be true or false.');
	if (typeof conf.token !== 'string') logger.error('The token config variable is misconfigured. It should be a string.');
	return;
};


client.login(config.token);
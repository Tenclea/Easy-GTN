// Client initialization
const { Client } = require('discord.js');
const client = new Client();

// Config variables
const config = require('./config.json');
const prefix = config.prefix;

// Useful functions
const { existsSync, readFileSync, writeFileSync } = require('fs');

// Events
client.once('ready', () => { console.log(`Logged in as ${client.user.tag} on ${new Date().toUTCString()}!\n`); });

client.on('message', (message) => {

	// Removes guesses from other users
	if (client.toTry && message.channel.id === client.watchingChannel.id && !isNaN(parseInt(message.content))) {
		const number = parseInt(message.content);
		if (!client.toTry.includes(number)) return;

		// Removes the number from toTry list
		client.attempts.users++;
		client.toTry.splice(client.toTry.indexOf(number), 1);

		if (message.author.id === client.user.id) console.log(`You tried ${number}`);
		else console.log(`Somebody else tried ${number}`);

		if (client.toTry.length === 1 && client.isWatching) console.log(`THERE IS ONLY ONE NUMBER LEFT TO TRY >>> ${client.toTry[0]} !!`);
		return;
	}

	// Check if the game's bot sends any messages
	if (message.author.id === config.botID) {
		// Check if a game just started
		if (message.embeds[0] && message.embeds[0].footer && message.embeds[0].footer.text && message.embeds[0].footer.text.includes('Started by:')) {
			if (!message.embeds[0].description) return;

			if (message.embeds[0].description.includes('game starting in')) return console.log(`A GTN game is about to start in ${message.guild.name} !`);
			else if (message.embeds[0].description.includes(':tada: Guess that number!')) return console.log(`A GTN game just started in ${message.guild.name} !`);
		}
		// Check if game ended
		else if (message.embeds[0] && message.embeds[0].description && message.embeds[0].description.startsWith(':tada:')) {
			stopGuessing();
			stopWatching();

			if (message.embeds[0].author.name === client.user.tag) { return console.log('Congratulations, you won the game !'); }
			else if (message.channel.id === client.watchingChannel.id) { return console.log(`${message.embeds[0].author.name} won the GTN game.. You'll have better luck next time :(`); }
			else { return console.log(`${message.embeds[0].author.name} won a game of GTN in ${message.guild.name}.`); }
		}
	}

	// If not a command from the bot's user, ignores the message
	if ((!message.content.startsWith(prefix) || message.author.id !== client.user.id)) return;
	if (message.author.id === client.user.id) message.delete(100).catch(() => { });

	const args = message.content.slice(prefix.length).trim().split(/ +/g);
	const command = args.shift().toLowerCase();

	if (!command) return;
	if (command === 'start') {
		if (client.toTryLoop) return console.log('It seems that the bot is already trying to guess the number somewhere.');

		if (!client.toTry || client.toTry.length === 0) {
			// Sets the game's range
			let range = config.defaultRange;
			if (args[0]) {
				const newRange = parseInt(args[0]);
				if (!isNaN(newRange) && newRange >= 2 && newRange <= 1000000) range = newRange;
				else console.log('The input range seems to be incorrect. Switching to default one.');
			}
			if (isNaN(parseInt(range)) || range <= 2 || range > 1000000) return console.log('The default range seems to be wrong. Make sure to check in the config file that the range is an integer between 2 and 1,000,000.');

			// Array of all possible numbers in given range
			client.toTry = [...Array(range + 1).keys()]; client.toTry.shift();
		}

		console.log(`\nStarting a new guessing session ! \n${client.toTry.length} guesses to go !`);

		tryLastMessages(message.channel);

		startWatching(message);
		startGuessing(message);

		message.channel.startTyping();
		return;
	}
	if (command === 'watch') {
		if (client.isWatching && !client.toTryLoop) return console.log('It seems that the bot is already watching a channel.');

		if (!client.toTry) {
			// Sets the game's range
			let range = config.defaultRange;
			if (args[0]) {
				const newRange = parseInt(args[0]);
				if (!isNaN(newRange) && newRange >= 2 && newRange <= 1000000) range = newRange;
				else console.log('The input range seems to be incorrect. Switching to default one.');
			}
			if (!isNaN(parseInt(range)) || range <= 2 || range > 1000000) return console.log('The default range seems to be wrong. Make sure to check in the config file that the range is an integer between 2 and 1,000,000.');

			// Array of all possible numbers in given range
			client.toTry = [...Array(range + 1).keys()]; client.toTry.shift();
		}
		else {
			const bckp = client.toTry;
			stopGuessing();
			client.toTry = bckp;
			console.log('Switching from guessing to watching...');
		}
		startWatching(message);
		tryLastMessages(message.channel);

		return console.log(`Started a new watching session in ${client.watchingChannel.name} !\n${client.toTry.length} numbers left.`);
	}
	if (command === 'stop') {
		if (config.saveBeforeStop) saveAttempts();
		stopWatching();
		stopGuessing();
		return console.log('Successfully stopped the guessing bot.');
	}
	if (command === 'pause') {
		if (!client.toTry) return console.log('You need to start a session before using this command.');

		if (client.toTryLoop) {
			clearTimeout(client.toTryLoop); delete client.toTryLoop;
			return console.log('Successfully paused the guesses. Use the pause command a second time to resume.');
		}
		else { startGuessing(); return console.log('Successfully resumed the guesses. Use the pause command another second time to pause.'); }
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
		if (!client.toTry) return console.log('You need to start a session before using this command.');
		return saveAttempts();
	}
	if (command === 'resume' || command === 'restore') {
		try {
			if (!existsSync('./toTry.json')) return console.log('Could not find anything to resume.');
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
			const toResume = JSON.parse(readFileSync('./toTry.json'));
			const oldLength = client.toTry.length;

			// Removes every values that were used in the saved session.
			client.toTry = client.toTry.filter(value => toResume.includes(value));
			return console.log(`Successfully removed ${oldLength - client.toTry.length} previously tried values !`);
		}
		catch (e) { return console.log('Could not find anything to resume.'); }
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
		if (!client.toTry) return console.log('You need to start a session before using this command.');

		if (!args[0]) return console.log(`You need to choose a type of hint ! (see ${config.prefix}hint help)`);
		const type = args[0].toLowerCase();
		const number = parseInt(args[1]);

		const oldLength = client.toTry.length;

		if (type === 'biggerthan' || type === 'bt') {
			if (isNaN(number)) return console.log(`You need to choose a valid number ! (see ${config.prefix}hint help)`);
			client.toTry = client.toTry.filter(value => value >= number);
			return console.log(`Removed ${oldLength - client.toTry.length} numbers smaller than ${number}.`);
		}
		else if (type === 'smallerthan' || type === 'st') {
			if (isNaN(number)) return console.log(`You need to choose a valid number ! (see ${config.prefix}hint help)`);
			client.toTry = client.toTry.filter(value => value <= number);
			return console.log(`Removed ${oldLength - client.toTry.length} numbers bigger than ${number}.`);
		}
		else if (type === 'isodd' || type === 'io') {
			client.toTry = client.toTry.filter(value => value % 2 !== 0);
			return console.log(`Removed ${oldLength - client.toTry.length} even numbers.`);
		}
		else if (type === 'iseven' || type === 'ie') {
			client.toTry = client.toTry.filter(value => value % 2 === 0);
			return console.log(`Removed ${oldLength - client.toTry.length} odd numbers.`);
		}
		else if (type === 'hasmultiple' || type === 'hm') {
			if (isNaN(number)) return console.log(`You need to choose a valid number ! (see ${config.prefix}hint help)`);
			client.toTry = client.toTry.filter(value => [...String(value).matchAll(new RegExp(number, 'gi'))].map(a => a[0]).length > 1);
			return console.log(`Removed ${oldLength - client.toTry.length} numbers without multiple "${number}".`);
		}
		else if (type === 'nothasmultiple' || type === 'nhm') {
			if (isNaN(number)) return console.log(`You need to choose a valid number ! (see ${config.prefix}hint help)`);

			client.toTry = client.toTry.filter(value => [...String(value).matchAll(new RegExp(number, 'gi'))].map(a => a[0]).length === 1);

			return console.log(`Removed ${oldLength - client.toTry.length} numbers with multiple "${number}".`);
		}
		else if (type === 'atpos' || type === 'ap') {
			const position = number; const numb = parseInt(args[2]);
			if (isNaN(position)) return console.log(`You need to choose a valid valid position ! (see ${config.prefix}hint help)`);
			if (isNaN(numb)) return console.log(`You need to choose a valid valid number ! (see ${config.prefix}hint help)`);

			client.toTry = client.toTry.filter(value => String(value)[position - 1] == numb);
			return console.log(`Removed ${oldLength - client.toTry.length} numbers without a "${numb}" on pos ${position}.`);
		}
		else if (type === 'notatpos' || type === 'nap') {
			const position = number; const numb = parseInt(args[2]);
			if (isNaN(position)) return console.log(`You need to choose a valid valid position ! (see ${config.prefix}hint help)`);
			if (isNaN(numb)) return console.log(`You need to choose a valid valid number ! (see ${config.prefix}hint help)`);

			client.toTry = client.toTry.filter(value => String(value)[position - 1] != numb);
			return console.log(`Removed ${oldLength - client.toTry.length} numbers with a "${numb}" on pos ${position}.`);
		}
	}
});


// Loop with variable timeout
const startGuessing = async () => {
	// Added random timeout to make the bot look more 'human'.
	const timeout = config.guessInterval + Math.random() * 1500;

	if (client.toTry.length === 0) { stopGuessing(); return console.log('\nStopping the bot : All numbers have been tried !'); }

	const letsTryThis = client.toTry.splice(Math.floor(Math.random() * client.toTry.length), 1);
	client.watchingChannel.send(letsTryThis)
		.then(() => {
			client.attempts.bot++;
			console.log(`Tried number ${letsTryThis}`);
		})
		.catch(e => console.log(`Could not try number ${letsTryThis} : ${e}`));

	// Here we go again
	client.toTryLoop = setTimeout(startGuessing, timeout);
};

const tryLastMessages = (channel) => {
	channel.fetchMessages({ limit: 100 }).then(messages => {
		const oldLength = client.toTry.length;

		messages.forEach(msg => {
			if (msg.author.bot || client.stopLastMessages) { return client.stopLastMessages = true; }
			else if (!isNaN(parseInt(msg.content))) { client.toTry.splice(client.toTry.indexOf(parseInt(msg.content)), 1); }
		});

		if (client.stopLastMessages) delete client.stopLastMessages;
		console.log(`Scrapped and removed ${oldLength - client.toTry.length} last tried numbers from the GTN channel.`);
	});
};

const stopGuessing = () => {
	if (!client.toTry) return console.log('The bot is not trying to find any answers yet !');

	const GTNChannel = client.channels.get(client.watchingChannel.id);
	if (GTNChannel) GTNChannel.stopTyping(true);

	delete client.toTry;
	delete client.watchingChannel;
	if (client.autoSave) clearInterval(client.autoSave);
	if (client.toTryLoop) clearTimeout(client.toTryLoop);

	return;
};

const startWatching = (message) => {
	// Auto-save interval
	if (config.autoSave) {
		client.autoSave = setInterval(() => {
			try {
				if (!client.toTry || client.toTry.length === 0) return;
				console.log('Auto-saving...');
				return saveAttempts();
			}
			catch (e) { return console.log(`The auto-save failed : ${e}`); }
		}, 60000);
	}

	if (!client.attempts) client.attempts = { bot: 0, users: 0 };
	client.isWatching = true;
	client.watchingChannel = message.channel;

	client.watchingSince = +new Date();
	return;
};

const stopWatching = () => {
	if (client.isWatching) delete client.isWatching;
	if (client.watchingChannel) delete client.watchingChannel;
	return;
};

const saveAttempts = () => {
	writeFileSync('./toTry.json', JSON.stringify(client.toTry));
	return console.log(`Successfully written ${client.toTry.length} left attempts to "toTry.json"`);
};


client.login(config.token);
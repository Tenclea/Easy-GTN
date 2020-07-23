// Client initialization
const { Client } = require('discord.js');
const client = new Client();

// Config variables
const config = require('./config.json');
const prefix = config.prefix;

// Events
client.once('ready', () => { console.log(`\nLogged in as ${client.user.tag} on ${new Date().toUTCString()}!`); });

client.on('message', (message) => {

	// Removes guesses from other users
	if (client.toTry && message.channel.id === client.toTryChannel && !isNaN(parseInt(message.content)) && message.author.id !== client.user.id) {
		const number = parseInt(message.content);
		if (!client.toTry.includes(number)) return;

		// Removes the number from toTry list
		client.attempts.users++;
		client.toTry.splice(client.toTry.indexOf(number), 1);
		console.log(`Somebody else tried ${number}`);
	}

	// Check if the game's bot sends any messages (most likely Game Over)
	if (message.author.id === config.botID && client.toTry && message.channel.id === client.toTryChannel) {
		// Check if game ended
		if (message.embeds[0] && message.embeds[0].description.startsWith(':tada:')) {
			message.channel.stopTyping(true);
			delete client.toTry;
			clearInterval(client.toTryInterval);

			if (message.embeds[0].author.name === client.user.tag) {
				return console.log('Congratulations, you won the game !');
			}
			else {
				return console.log(`${message.embeds[0].author.name} won the game.. You'll have better luck next time :(`);
			}
		}
	}

	// If not a command from the bot's user, ignores the message
	if ((!message.content.startsWith(prefix) || message.author.id !== client.user.id)) return;
	if (message.author.id === client.user.id) message.delete().catch(() => { });

	const args = message.content.slice(prefix.length).trim().split(/ +/g);
	const command = args.shift().toLowerCase();


	if (!command) return;
	if (command === 'start') {
		if (client.toTry) return console.log('It seems that the bot is already trying to guess the number somewhere.');

		client.attempts = { bot: 0, users: 0 };
		client.toTryChannel = message.channel.id;

		// Sets the game's range
		let range = config.defaultRange;
		if (args[0]) {
			const newRange = parseInt(args[0]);
			if (!isNaN(newRange) && newRange >= 2 && newRange <= 1000000) range = newRange;
			else console.log('The input range seems to be incorrect. Switching to default one.');
		}
		if (!Number.isInteger(range) || range <= 2 || range > 1000000) return console.log('The default range seems to be wrong. Make sure to check in the config file that the range is an integer between 2 and 1,000,000.');

		// Array of all possible numbers in given range
		client.toTry = [...Array(range + 1).keys()]; client.toTry.shift();

		// Message sending interval
		client.toTryInterval = setInterval(() => {
			if (client.toTry.length === 0) {
				message.channel.stopTyping(true);
				delete client.toTry;
				clearInterval(client.toTryInterval);
				return console.log('All numbers have been tried ! It seems like the range set was lower than the game\'s one.');
			}

			const letsTryThis = Math.floor(Math.random() * client.toTry.length);
			setTimeout(() => {
				message.channel.send(client.toTry[letsTryThis])
					.then(() => {
						client.attempts.bot++;
						const tried = client.toTry.splice(letsTryThis, 1);
						console.log(`Tried number ${tried}`);
					})
					.catch(e => console.log(`Could not try number ${letsTryThis} : ${e}`));
			}, Math.random() * 1000);
			// added timeout to make the bot look more 'human'.
		}, config.tryInterval);
		client.tryingSince = +new Date();
		message.channel.startTyping();
		return console.log('Starting a new guessing session !');
	}
	if (command === 'stop') {
		if (!client.toTry) return console.log('The bot is not trying to find any answers yet !');

		message.channel.stopTyping(true);
		delete client.toTry;
		clearInterval(client.toTryInterval);
		return console.log('Successfully stopped the guessing bot.');
	}
	if (command === 'stats') {
		const guessingFor = client.tryingSince ? (+new Date() - client.tryingSince) : 0;
		const totalAtt = client.attempts ? client.attempts.bot + client.attempts.users : 0;
		return console.log(`
==================================
Statistics for nerds :
----------------------
Guessing for : ${(guessingFor / 1000 / 60).toFixed(2)} minutes
Numbers tried : 
  - Bot   : ${client.attempts ? client.attempts.bot : 0}
  - Users : ${client.attempts ? client.attempts.users : 0}
  - Total : ${totalAtt} | ~${(totalAtt / (guessingFor / 1000)).toFixed(2)}/s
Numbers left : ${client.toTry ? client.toTry.length : '∞'}
Prob. next try correct : ${client.toTry ? ((1 / client.toTry.length) * 100).toFixed(5) + '%' : '∞'}
==================================
`);
	}
	if (command === 'save' || command === 'backup') {
		if (!client.toTry) return console.log('You need to start a session before using this command.');

		const { writeFileSync } = require('fs');
		writeFileSync('./toTry.json', JSON.stringify(client.toTry));
		return console.log(`Written ${client.toTry.length} left attempts to "toTry.json"`);
	}
	if (command === 'resume' || command === 'restore') {
		if (!client.toTry) return console.log('You need to start a session before using this command.');

		try {
			const toResume = require('./toTry.json');

			// Removes every values that were used in the saved session.
			for (const value of client.toTry) {
				if (!toResume.includes(value)) { client.toTry.splice(client.toTry.indexOf(value), 1); }
			}
			return console.log('Successfully removed all previously tried values !');
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

atPos (ap) / inPos (ip) > Only keeps all numbers with a specific number at the chosen position.
			> Usage : ${config.prefix}hint ap [position] [number]
=====================================================================
`);
		}
		if (!client.toTry) return console.log('You need to start a session before using this command.');

		if (!args[0]) return console.log(`You need to choose a type of hint ! (see ${config.prefix}hint help)`);
		const type = args[0].toLowerCase();
		const number = parseInt(args[1]);

		if (type === 'biggerthan' || type === 'bt') {
			if (isNaN(number)) return console.log(`You need to choose a valid number ! (see ${config.prefix}hint help)`);
			client.toTry = client.toTry.filter(value => value >= number);
			return console.log(`Removed all numbers smaller than ${number}.`);
		}
		else if (type === 'smallerthan' || type === 'st') {
			if (isNaN(number)) return console.log(`You need to choose a valid number ! (see ${config.prefix}hint help)`);
			client.toTry = client.toTry.filter(value => value <= number);
			return console.log(`Removed all numbers bigger than ${number}.`);
		}
		else if (type === 'isodd' || type === 'io') {
			client.toTry = client.toTry.filter(value => value % 2 !== 0);
			return console.log('Removed all even numbers.');
		}
		else if (type === 'iseven' || type === 'ie') {
			client.toTry = client.toTry.filter(value => value % 2 === 0);
			return console.log('Removed all odd numbers.');
		}
		else if (type === 'atpos' || type === 'inpos' || type === 'ap' || type === 'ip') {
			const position = number; const numb = parseInt(args[2]);
			if (isNaN(position)) return console.log(`You need to choose a valid valid position ! (see ${config.prefix}hint help)`);
			if (isNaN(numb)) return console.log(`You need to choose a valid valid number ! (see ${config.prefix}hint help)`);

			client.toTry = client.toTry.filter(value => String(value)[position - 1] == numb);
			return console.log(`Removed all numbers without a "${numb}" on pos ${position}.`);
		}
	}
});

client.login(config.token);
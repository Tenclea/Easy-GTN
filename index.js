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
	if (client.toTry && !isNaN(parseInt(message.content)) && message.author.id !== client.user.id) {
		const number = parseInt(message.content);
		if (!client.toTry.includes(number)) return;

		// Removes the number from toTry list
		client.attempts.users++;
		client.toTry.splice(client.toTry.indexOf(number), 1);
		console.log(`Somebody else tried ${message.content}`);
	}

	// Check if the game's bot sends any messages (most likely Game Over)
	if (message.author.id === config.botID && client.toTry) {
		// Check if game ended
		if (message.embeds[0] && message.embeds[0].description.startsWith(':tada:')) {
			message.channel.stopTyping(true);
			delete client.toTry;
			clearInterval(client.toTryInterval);

			if (message.embeds[0].author.name === client.user.tag) {
				return console.log('Congratulations, you won the game !');
			}
			else {
				return console.log(`${message.embeds[0].author.name} won the game.. You'll have better luck next time !`);
			}
		}
	}

	// If not a command from the bot's user, ignores the message
	if ((!message.content.startsWith(prefix) || message.author.id !== client.user.id)) return;

	const args = message.content.slice(prefix.length).trim().split(/ +/g);
	const command = args.shift().toLowerCase();

	// Adding timeout to prevent message not being removed for everyone.
	if (message.author.id === client.user.id) message.delete(100).catch(() => { });

	if (!command) return;
	if (command === 'start') {
		if (client.toTry) return console.log('It seems that the bot is already trying to guess the number somewhere.');

		// Stats
		client.attempts = { bot: 0, users: 0 };

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
						/* const tried = client.toTry.splice(letsTryThis, 1);
						console.log(`Tried number ${tried}`); */
					})
					.catch(e => console.log(`Could not try number ${letsTryThis} : ${e}`));
			}, Math.random() * 1000);
			// added timeout to make the bot look more 'human'.
		}, config.tryInterval);
		message.channel.startTyping();
	}
	if (command === 'stop') {
		if (!client.toTry) return console.log('The bot is not trying to find any answers yet !');

		message.channel.stopTyping(true);
		delete client.toTry;
		clearInterval(client.toTryInterval);
		return console.log('Successfully stopped the guessing bot.');
	}
	if (command === 'stats') {
		return console.log(`
======================
Numbers tried : 
  - Bot   : ${client.attempts ? client.attempts.bot : 0}
  - Users : ${client.attempts ? client.attempts.users : 0}
  - Total : ${client.attempts ? client.attempts.bot + client.attempts.users : 0}
Numbers left  : ${client.toTry ? client.toTry.length : '∞'}
======================
`);
	}
});

client.login(config.token);
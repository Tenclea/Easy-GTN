const logger = require('../utils/logger');

module.exports = {
	name: 'hint',
	aliases: [],
	description: 'Use hints on the current session. Type `.hint -h` for a list of hints.',
	usage: '<hint type> <number> / <hint type> <position> <number>',

	run: (client, message, args) => {
		const config = client.config;

		if (args[0] === 'help' || args[0] === '-h' || args[0] === '--help') {
			return console.log(`=====================================================================
=  Hint command help  =
Usage   : ${config.prefix}hint [type] [number]
Example : ${config.prefix}hint biggerThan 1000

= All available types =
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
		if (!client.toTry) return logger.error('You need to start a session before using the hint command.');

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
	},
};
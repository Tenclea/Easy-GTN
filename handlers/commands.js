const { Collection } = require('discord.js');
const logger = require('../utils/logger');
const { readdirSync } = require('fs');

module.exports = (client) => {
	client.commands = new Collection;
	client.aliases = new Collection;

	const isCommandValid = (c) => {
		if (c.name === undefined || typeof c.name !== 'string' || c.name.length === 0) return 'the command has no name';
		if (c.aliases === undefined || typeof c.aliases !== 'object') return 'the command has no aliases value';
		if (c.description === undefined || typeof c.description !== 'string' || c.description.length === 0) return 'the command has no description';
		if (c.usage === undefined || typeof c.usage !== 'string') return 'the command has no usage';
		if (c.run === undefined || typeof c.run !== 'function') return 'the command has no run function';

		if (client.commands.has(c.name)) return 'the command\'s name is already taken';
		if (c.aliases.length > 0) for (const a of c.aliases) { if (client.aliases.has(a)) return `the "${a}" alias is already used for the ${client.aliases.get(a)} command`; }

		return true;
	};

	const files = readdirSync('./commands/').filter(f => f.endsWith('.js'));
	for (const file of files) {
		const command = require(`../commands/${file}`);

		const res = isCommandValid(command);
		if (res !== true) { logger.error(`Could not initialize the ${file} file : ${res}.`); }
		else {
			client.commands.set(command.name, command);
			if (command.aliases.length > 0) for (const a of command.aliases) { client.aliases.set(a, command.name); }
		}
	}
};
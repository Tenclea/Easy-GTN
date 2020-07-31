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

// Config variables & auto update on file edit
client.config = require('./config.json');
watchFile('./config.json', () => {
	// Reads new config & updates it
	client.config = JSON.parse(readFileSync('./config.json'));

	// Updates logger
	logger.level = client.config.debugMode ? 'debug' : 'info';

	logger.info('Updated the config variables.');
	return checkConfig(client.config);
});

// Initialize logger
const logger = require('./utils/logger');

// Useful functions & modules
const { readdirSync, readFileSync, watchFile } = require('fs');
const { checkConfig } = require('./utils/functions');

// Events handler
const events = readdirSync('./events/');
for (const e of events) require(`./events/${e}`)(client);

// Login
client.login(client.config.token);
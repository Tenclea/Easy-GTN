const { checkConfig } = require('../utils/functions');
const logger = require('../utils/logger');
const chalk = require('chalk');

module.exports = (client) => {
	client.once('ready', () => {
		checkConfig(client.config);
		logger.info(`Logged in as ${chalk.yellow(client.user.tag)} !\n`);
	});
};
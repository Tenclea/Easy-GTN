const { checkConfig } = require('../utils/functions');
const logger = require('../utils/logger');

module.exports = (client) => {
	client.once('ready', () => {
		checkConfig(client.config);
		logger.info(`Logged in as ${client.user.tag} on ${new Date().toUTCString()}!\n`);
	});
};
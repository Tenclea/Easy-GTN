const { readdirSync } = require('fs');

module.exports = (client) => {
	const events = readdirSync('./events/');
	for (const e of events) require(`../events/${e}`)(client);
};
const chalk = require('chalk');

module.exports = {
	name: 'stats',
	aliases: ['statistics'],
	description: 'Prints some statistics in the console.',
	usage: '',

	run: (client) => {
		const uptime = client.watchingSince ? (+new Date() - client.watchingSince) : 0;
		const totalAtt = client.attempts ? client.attempts.bot + client.attempts.users : 0;
		return console.log(`${chalk.gray('==================================')}
${chalk.cyan('= Guessing bot =')}
Guessing for  : ${chalk.yellow((uptime / 1000 / 60).toFixed(2))} min
Numbers tried : 
${chalk.cyanBright('- Bot   :')} ${chalk.yellow(client.attempts ? client.attempts.bot : 0)}
${chalk.cyanBright('- Users :')} ${chalk.yellow(client.attempts ? client.attempts.users : 0)}
${chalk.cyanBright('- Total :')} ${chalk.yellow(totalAtt)} | ~${chalk.yellow((totalAtt / (uptime / 1000)).toFixed(2))}/s
Numbers left : ${chalk.yellow(client.toTry ? client.toTry.length : '0')}
Prob. next try correct : ${chalk.yellow(client.toTry ? ((1 / client.toTry.length) * 100).toFixed(4) : '0.0000')}%
${chalk.gray('==================================')}`);
	},
};
const { readFileSync } = require('fs');
const winston = require('winston');
const chalk = require('chalk');

const debugMode = JSON.parse(readFileSync('./config.json')).debugMode;

module.exports = winston.createLogger({
	transports: [new winston.transports.Console()],
	format: winston.format.printf(log => {
		const message = ` » ${log.message}`;
		if (log.level === 'info') return chalk.green(`[${log.level.toUpperCase()}] `) + message;
		else if (log.level === 'warn') return chalk.yellow(`[${log.level.toUpperCase()}] `) + message;
		else if (log.level === 'error') return chalk.red(`[${log.level.toUpperCase()}]`) + message;
		else if (log.level === 'debug') return chalk.blue(`[${log.level.toUpperCase()}]`) + message;
		else return `[${log.level.toUpperCase()}]` + message;
	}),
	level: debugMode ? 'debug' : 'info',
});
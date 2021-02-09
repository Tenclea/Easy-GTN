# Easy Guess The Number

An "advanced" Discord selfbot I made that automatically plays Guess The Number (GTN) games.

## Requirements

* [Node.js `v14.7.0` ](https://nodejs.org/en/) (wasn't tested on other versions)
* Your Discord user token
* [This bot](https://discord.com/oauth2/authorize?client_id=694278840855298079&permissions=8&scope=bot) (I may add support for other ones in the future)
* An IQ >= 60

## Setup

* Clone or download this repository to your machine.
* Copy your token in the `token` field in the `config.json` file (use notepad to open it).
* Open up a command prompt in it and type `npm ci` to install the requirements.
* Start the bot by typing `node index.js` .

## How to use the bot

### How do I guess a number ?

1. Open up Discord with the same account as the one you're using as a bot.  
2. Go to the channel where there is a game of Guess The Number running.  
3. Type `.start`  `maxNumber` , and watch the "magic".  

### Config file

Those are the "global variables" that are very useful to the bot.

* `autoSave` > Whether to let the bot auto-save or not. (true/false)
* `autoStart` > Whether to automatically start guessing numbers if a game starts in any channel. (true/false)
* `botID` > The UserID of the Guess The Number bot.
* `debugMode` > Whether to or not to log some informations (like attempts)
* `defaultRange` > The default maximum number in the GTN game. (Will be used if no args are provided to the `start` command)
* `guessInterval` > The time to wait between each guess attempt (in ms).
* `guessIntMaxTimeout` > The maximum added time to `guessInterval` (in ms) (can be set to 0).
* `saveBeforeStop` > Automatically save after using the the stop command if enabled (true/false).
* `prefix` > The key used before every command.
* `token` > The user's token to connect to.

## Known issues

> I did not spend plenty of time on testing this bot, so please create an issue if anything ever goes wrong on your side.

* Nothing at the moment ! :3

## TODO

* [ ] Alts system
* [ ] Players count into stats
* [ ] `help` command
* [ ] `quit` / `exit` command (closes the bot)

## Disclaimer

Everything you can see here has been made for educational purposes and as a proof of concept.  
I do not promote the usage of my tools, and do not take responsibility for any bad usage of this tool.

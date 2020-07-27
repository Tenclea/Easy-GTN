# EZ Guess The Number

A quick Discord selfbot I made that automatically plays Guess The Number (GTN) games.

## Requirements

* [Node.js `v14.6.0` ](https://nodejs.org/en/) (wasn't tested on other versions)
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
* `botID` > The UserID of the Guess The Number bot.
* `defaultRange` > The default maximum number in the GTN game. (Will be used if no args are provided to the `start` command)
* `guessInterval` > The time to wait between each guess attempt (in ms).
* `saveBeforeStop` > Automatically save after using the the stop command if enabled (true/false).
* `prefix` > The key used before every command.
* `token` > The user's token to connect to.

## Known issues

> I did not spend plenty of time on testing this bot, so please create an issue if anything ever goes wrong on your side.

* Nothing at the moment ! :3

## TODO

* [x] Make sure that the channel the number is sent in is the GTN channel.
* [x] `save` command > writes list to file in order to `resume` later
* [x] Add a 'time spent guessing' to the `stats` command
* [x] Auto save feature (configurable)
* [x] `hint` command (let me know if you have any other suggestions)
* [x] `pause` command
* [x] `watch` command > does the same as `start` without sending any messages
* [x] Remove need to `start` before `resume`
* [x] Fetch last 100 messages (Discord limit) and check if any numbers have already been tried
* [x] Save before stop in config
* [x] Auto update config file

* [ ] Command Handler ? (Main file starts to look messy)
* [ ] `help` command

* [ ] Standby mode > Will wait for the game to begin (command can be invoked before game starts)
* [ ] ? Add a 'real' mode, where you randomly skip some messages to make it look like you're somehow "thinking" to what to choose next.

## Disclaimer

Everything you can see here has been made for educational purposes and as a proof of concept.
I do not promote the usage of my tools, and do not take responsibility for any bad usage of this tool.

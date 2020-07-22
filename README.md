# EZ Guess The Number

A quick Discord selfbot I made that automatically plays Guess The Number (GTN) games.

## Requirements

- [Node.js `v14.5.0`](https://nodejs.org/en/) (wasn't tested on other versions)
- Your Discord user token
- [This bot](https://discord.com/oauth2/authorize?client_id=694278840855298079&permissions=8&scope=bot) (I may add support for other ones in the future)
- An IQ >= 60

## Setup

- Clone or download this repository to your machine.
- Copy your token in the `token` field in the `config.json` file (use notepad to open it).
- Open up a command prompt in it and type `npm ci` to install the requirements.
- Start the bot by typing `node index.js`.

## How to use the bot

### How do I guess a number ?
Open up Discord with the same account as the one you'll be using as a bot.  
Go to the channel where there is a game of Guess The Number running.  
Type `.start` `maxNumber`, and watch the "magic".  

### Config file
Those are the "global variables" that are very useful to the bot.

- `botID` > The UserID of the Guess The Number bot.
- `prefix` > The key used before every command.
- `defaultRange` > The default maximum number in the GTN game. (Will be used if no args are provided to the `start` command)
- `token` > The user's token to connect to.
- `tryInterval` > The time to wait between each guess attempt.

## Known issues
> I did not spend plenty of time on testing this bot, so please create an issue if anything ever goes wrong on your side.
- Typing a number with the same account as the bot is using won't remove the number from the "toTry" list.

## TODO

- [x] Make sure that the channel the number is sent in is the GTN channel.
- [x] `save` command > writes list to file in order to `resume` later

- [ ] Auto save feature
- [ ] Fetch last 100 messages (Discord limit) and check if any numbers have already been tried
- [ ] Check if message gets removed by bot (wrong range ?)
- [ ] `pause` command ?
- [ ] `try` command ? (because user's messages are ignored)
- [ ] `watch` command > does the same as `start` but only suggests in console what to try
- [ ] Standby mode > Will start guessing numbers once the game begins (command can be invoked before game starts)
- [ ] `hint` command > example : `.hint startingWith 7` removes all numbers that doesn't start with 7 (also > `higherThan`, `lowerThan`, `notStartingWith`, `hasMultiple`, `isOdd`, `isEven`)
- [ ] Add a 'real' mode, where you occasionally skip some messages to make it look like you're somehow "thinking" to what to choose next.
- [ ] Add a 'time spent guessing' to the `stats` command

- [ ] improve guess interval using a recurring changing time  timeout function

## Disclaimer
Everything you can see here has been made for educational purposes and as a proof of concept.
I do not promote the usage of my tools, and do not take responsibility for any bad usage of this tool.
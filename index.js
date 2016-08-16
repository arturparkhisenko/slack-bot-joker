/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
           ______     ______     ______   __  __     __     ______
          /\  == \   /\  __ \   /\__  _\ /\ \/ /    /\ \   /\__  _\
          \ \  __<   \ \ \/\ \  \/_/\ \/ \ \  _"-.  \ \ \  \/_/\ \/
           \ \_____\  \ \_____\    \ \_\  \ \_\ \_\  \ \_\    \ \_\
            \/_____/   \/_____/     \/_/   \/_/\/_/   \/_/     \/_/
* Connect to Slack using the real time API
* Receive messages based on "spoken" patterns
* Reply to messages
* Use the conversation system to ask questions
* Use the built in storage system to store and retrieve information
  for a user.
# RUN THE BOT:
  Get a Bot token from Slack:
    -> http://my.slack.com/services/new/bot
  Run your bot from the command line:
    token=<MY TOKEN> node slack_bot.js
# USE THE BOT:
  Find your bot inside Slack to send it a direct message.
  Say: "Hello"
  The bot will reply "Hello!"
  Say: "shutdown"
  The bot will ask if you are sure, and then shut itself down.
  Make sure to invite your bot into other channels using /invite @<my bot>!
# EXTEND THE BOT:
  Botkit has many features for building cool and useful bots!
  Read all about it here:
    -> http://howdy.ai/botkit
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
'use strict'; // heroku node v < 6

if (!process.env.token) {
  console.error('Error: Specify token in environment');
  process.exit(1);
}

const Botkit = require('botkit');
const jokes = require('./jokes.json');
/**
 * [getRandomString description]
 * @param  {Array} items [of strings]
 * @return {string} item
 */
const getRandomString = (items) => items[Math.floor(Math.random() * (items.length + 1))];

const controller = Botkit.slackbot({
  // debug: true,
});

const botInstance = controller.spawn({
  token: process.env.token,
}).startRTM((err) => {
  if (err) {
    throw new Error(`Could not connect to Slack, error: ${err}`);
  }
});

controller.hears(
  ['hello', 'hi'],
  // ['direct_message', 'direct_mention', 'mention', 'ambient'],
  ['direct_message', 'direct_mention', 'mention'],
  (bot, message) => {
    // do something to respond to message
    // all of the fields available in a normal Slack message object are available
    // https://api.slack.com/events/message

    bot.api.reactions.add({
      timestamp: message.ts,
      channel: message.channel,
      name: 'robot_face',
    }, (err) => {
      if (err) {
        bot.botkit.log('Failed to add emoji reaction :(', err);
      }
    });

    controller.storage.users.get(message.user, (err, user) => {
      if (user && user.name) {
        bot.reply(message, `Hello ${user.name}!!`);
      } else {
        bot.reply(message, 'Hello.');
      }
    });
  }
);

controller.hears(
  ['joke', 'fun', 'run', 'next', 'say', ':vag:'],
  ['direct_message', 'direct_mention', 'mention'],
  (bot, message) => {
    let answer = 'Sorry i don\t have any texts configured!';
    if (jokes && jokes.items) {
      answer = getRandomString(jokes.items);
    }
    bot.reply(message, answer);
  }
);

controller.hears(
  ['help', 'info', 'how'],
  ['direct_message', 'direct_mention', 'mention'],
  (bot, message) => {
    bot.reply(message, 'My commands: `help`, `next` or `run` or `say`');
  }
);

controller.hears(
  ['shutdown'],
  ['direct_message', 'direct_mention', 'mention'],
  (bot, message) => {
    bot.startConversation(message, (err, convo) => {
      convo.ask('Are you sure you want me to shutdown?', [{
        pattern: bot.utterances.yes,
        callback: (response, convo) => {
          convo.say('Bye!');
          convo.next();
          setTimeout(() => {
            process.exit();
          }, 3000);
        },
      }, {
        pattern: bot.utterances.no,
        default: true,
        callback: (response, convo) => {
          convo.say('*Phew!*');
          convo.next();
        },
      }]);
    });
  }
);

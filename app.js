// import { Game } from 'game.js'
var Game = require('./game.js');
var Discord = require('discord.io');
const jsonToken = require('./token.json');

// "discord.io": "github:woor/discord.io#gateway_v6",
var bot = new Discord.Client({
    token: jsonToken.token,
    autorun: true
});

bot.on('ready', function() {
  console.log('Logged in as %s - %s\n', bot.username, bot.id);
  createGame("XXX", 1);
});

var globalGame;

/**
 * 
 * @param {*} channelID
 * @param {*} duration
 */
function createGame(channelID, duration = 1) {
  globalGame = new Game(channelID, duration);
  // TODO improve to use maps of games and channels
}

/**
 * 
 * @param {*} channelID
 * TODO retrieve the game of the channelID
 */
function start(channelID) {
  if (globalGame.isStarted()) {
    bot.sendMessage({ to: channelID, message: "Wait for the current game to finish" });
  } else {
    bot.sendMessage({
      to: channelID,
      message: "Starting the game with " + "X" +" players"
    });
    // Initialize the players
    let mayor = globalGame.tryInitMayor();
    client.createDMChannel(mayor);
    bot.sendMessage({
      to: channelID,
      message: "Mayor is: <@" + mayor + ">"
    });

    startGame(channelID, globalGame);
  }
}


function startGame(game) {
  let gameStarted = globalGame.tryStart(function() {
    bot.sendMessage({
      to: globalGame.getChannelID(),
      message: "Time's up Esmeralda. Drop the mic.\n" +
        "You now have one more minute to find the GarouWolf"
      });
  })
  if (!gameStarted) {
    bot.sendMessage({ to: globalGame.getChannelID(), message: "Not enough players to start the game" });
  } else showTimeLeft(globalGame.getChannelID(), game);
}

/**
 * 
 * @param {*} channelID 
 * @param {*} game 
 * Improve to use only channelID ?
 */
function showTimeLeft(channelID, game) {
  var minutes = Math.floor((game.remainingTime() % (1000 * 60 * 60)) / (1000 * 60));
  var seconds = Math.floor((game.remainingTime() % (1000 * 60)) / 1000);
  
  bot.sendMessage({ to: channelID, message: "**You have " + minutes + " minutes and " + seconds +" seconds left...**" });
}


bot.on('message', function(user, userID, channelID, message, event) {
  console.log("Message: " + message);
  if (message.includes("<@!" + bot.id + ">")) {
    bot.sendMessage({
      to: channelID,
      message: "My name is Garou, and I can help you play the game WhereWordz. "
        + "Tell me commands by sending a word with '$' before it.\n"
        + "Try $help for example"
    });
  }

  switch (message) {

    case "$join":
      if (!globalGame.tryAddUser(userID)) {  
        bot.sendMessage({
          to: channelID,
          message: "Sorry, you cannot join the game. Wait for it to finish. (Your are either already in, or it has started)"
        });
      } else {
        bot.sendMessage({
          to: channelID,
          message: user + " was added to the game. There are "
          + globalGame.getPlayers().length +" players"
        });
      }
      break;
    case "$start":
      start(channelID)
      break;
    case "$pause":
      showTimeLeft(channelID, globalGame);
      bot.sendMessage({
        to: channelID,
        message: "Pausing the game"
      });
      globalGame.pause();
      break;
    case "$resume":
      bot.sendMessage({
        to: channelID,
        message: "Resuming the game"
      });
      globalGame.resume();
      showTimeLeft(channelID, globalGame);
      break;
    case "$time":
      showTimeLeft(channelID, globalGame);
      break;
    case "$time":
      showTimeLeft(channelID, globalGame);
      break;
    case "$stopall":
      globalGame = null;
      bot.sendMessage({
        to: channelID,
        message: "The game has been stopped and players removed"
      });
      break;
    case "$help":
      bot.sendMessage({
        to: channelID,
        message: "Available commands are: join, start, pause, time stopall (and help ;))"
      });
      break;
  }
});
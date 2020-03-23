// import { Game } from 'game.js'
var Game = require('./game.js');
var Discord = require('discord.io');
const jsonToken = require('./token.json');
var randomWords = require('random-words');

var bot = new Discord.Client({
  autorun: true,
  token: jsonToken.token,
});

bot.on('ready', function() {
  console.log('Logged in as %s - %s\n', bot.username, bot.id);
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

function addPlayer(game, user, userID) {
  if (!globalGame.tryAddUser(userID)) {
    bot.sendMessage({
      to: game.getChannelID(),
      message: "Sorry, you cannot join the game. Wait for it to finish. (Your are either already in, or it has started)"
    });
  } else {
    bot.sendMessage({
      to: game.getChannelID(),
      message: user + " was added to the game. There are "
      + globalGame.getPlayers().length +" players"
    });
  }
}

function tryElectMayor(channelID) {
  if (globalGame.hasMayor()) {
    bot.sendMessage({
      to: channelID,
      message: "Choosing a new Mayor... The old one was not good enough"
    });
  }

  // Initialize the players
  let mayor = globalGame.tryInitMayor();
    console.log("Mayor value is: " + mayor);
  if (mayor === null) {
    bot.sendMessage({
      to: channelID,
      message: "We need a mayor to play, not enough players"
    });
    return false;
  } else {
    console.log("Mayor has been elected");
    bot.sendMessage({
      to: channelID,
      message: "Mayor is: <@" + mayor + ">. They must choose a word"
    });
    let word1 = randomWords();
    let word2 = randomWords();
    let word3 = randomWords();
    bot.sendMessage({
      to: mayor,
      message: "You are the Mayor. Please choose between: " +
        word1 + ", " + word2 + " and " + word3 + ". Send me back the word you chose\n" +
        "You can cheat, but that's on you"
    });
    return true;
  }
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
      message: "Starting the game with " + globalGame.getPlayers().length +" players\n" +
        "You can ask 36 Yes/No questions to the mayor to find the word and/or the werewolf.\n"
    });
    
    // Elect a mayor instead of starting if there is none
    if (!globalGame.hasMayor()) {
      bot.sendMessage({ to: channelID, message: "A mayor must be elected before starting" });
      if (!tryElectMayor()) {
        bot.sendMessage({
          to: channelID,
          message: "Try to start again when you have enough players" +
            " (You are " + globalGame.getPlayers().length +" for now)"
        });
      }
    } else {
      if (!globalGame.hasWerewolf()) {
        bot.sendMessage({
          to: channelID,
          message: "The mayor must choose a word in order for the" +
            " werewolf to reveal and seer to see"
        });
      } else {
        startGame(channelID, globalGame);
      }
    }

  }
}

function startGame(game) {
  let gameStarted = globalGame.tryStart(function() {
    bot.sendMessage({
      to: globalGame.getChannelID(),
      message: "Time's up Esmeralda. Drop the mic.\n" +
        "You now have one more minute to find the GarouWolf"
      });
    this.timerId = setTimeout(function() {
      bot.sendMessage({
        to: globalGame.getChannelID(),
        message: "STOP! Type who you think is the werewolf, **NOW**"
      });
    }, 1.1 * (60 * 1000));
  });
  if (!gameStarted) {
    console.log("Game could not start");
    bot.sendMessage({
      to: globalGame.getChannelID(),
      message: "Not enough players to start the game"
    });
  } else {
    console.log("Game starting...");
    showTimeLeft(globalGame);
  }
}

/**
 * 
 * @param {*} game
 */
function showTimeLeft(game) {
  var minutes = Math.floor((game.remainingTime() % (1000 * 60 * 60)) / (1000 * 60));
  var seconds = Math.floor((game.remainingTime() % (1000 * 60)) / 1000);
  
  bot.sendMessage({
    to: globalGame.getChannelID(),
    message: "**You have " + minutes + " minutes and " + seconds +" seconds left...**"
  });
}

function handlePrivateMessage(user, userID, message, event) {
  console.log("I got a private message from: " + user);
  // TODO add search on all games to find those concerned
  if (globalGame.isWordSelectByPlayerMessage(userID, message)){
    bot.sendMessage({
      to: userID,
      message: "Secret word: " + globalGame.getSecretWord()
    });
    bot.sendMessage({
      to: globalGame.getChannelID(),
      message: "The secret word has been chosen! Aoooouuuuh"
    });

    /*
    Initialize Werewolf
     */
    let werewolf = globalGame.tryInitWerewolf();
    if (werewolf === null) {
      bot.sendMessage({
        to: globalGame.getChannelID(),
        message: "We need a werewolf to play, not enough players"
      });
    } else {
      // Send the word to werewolf
      /*
      Initialize Seer
      */
      let seer = globalGame.tryInitSeer();
      if (seer === null) {
        bot.sendMessage({
          to: globalGame.getChannelID(),
          message: "We need a seer to play, not enough players"
        });
      } else {
        /*
        Telling each player their role (other players are villagers)
        */
        console.log("Werewolf has revealed. Seer can see !");
        bot.sendMessage({
          to: globalGame.getChannelID(),
          message: "Werewolf has revealed. Seer can see !"
        });

        bot.sendMessage({
          to: werewolf,
          message: "You are a werewolf. The secret word is: " + globalGame.getSecretWord()
        });
        bot.sendMessage({
          to: seer,
          message: "You are the seer. The secret word is: " + globalGame.getSecretWord()
        });

        globalGame.getVillagers().forEach(function(userID, index, array){
          bot.sendMessage({
            to: userID,
            message: "You are a villager. Try to find the word and/or who is the werewolf"
          });
          
        });
      }
    }
    
  }
}

function handlePublicMessage(user, userID, channelID, message, event) {
  if (message.includes("<@!" + bot.id + ">")) {
    bot.sendMessage({
      to: channelID,
      message: "My name is Garou, and I can help you play the game WhereWordz. "
        + "Tell me commands by sending a word with '$' before it.\n"
        + "Try $help for example"
    });
  }

  if (message.startsWith('$')) {

    switch (message) {

      case "$join":
        addPlayer(globalGame, user, userID);
        break;
      case "$elect":
        tryElectMayor(channelID);
        break;
      case "$fakegame":
        addPlayer(globalGame, user, userID);
        tryElectMayor(channelID);
        addPlayer(globalGame, "Tata", "Tata");
        addPlayer(globalGame, "Toto", "Toto");
        break;
      case "$start":
        start(channelID)
        break;
      case "$pause":
        showTimeLeft(globalGame);
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
        showTimeLeft(globalGame);
        break;
      case "$time":
        showTimeLeft(globalGame);
        break;
      case "$rules":
        bot.sendMessage({
          to: channelID,
          message: "**__Rules of the WhereWordz__**\n" +
            ">>> - You need at least 4 players (3 will do, but meh)\n" +
            "- The *Mayor* chooses the word\n" +
            "- You can ask 36 Yes/No questions to the *Mayor* to find the word and/or the *Werewolf*\n" +
            "- The *Werewolf* knows the word and must keep the *Villagers* from finding it\n" +
            "- The *Seer* knows the word and must help the *Villagers*\n" +
            "- The *Mayor* CAN be the *Werewolf* or *Seer*\n" +
            "**Victory:**\n" +
            "- If the word is found at the end the time or questions, the *Werewolf* can win by telling the *Seer*\n" +
            "- If the word is NOT found, the *Villagers* can win by telling the *Werewolf*\n" +
            "So both must be careful"
        });
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
          message: "Available commands are: join, elect, start, pause, resume, time, rules, stopall (and help ;))"
        });
        break;
    }
  }  
}

bot.on('message', function(user, userID, channelID, message, event) {
  let duration = 6;

    // TODO create local game instead of global
    if (typeof globalGame === 'undefined' || globalGame === null) createGame(channelID, duration);

  console.log("Message: " + message);
  bot.createDMChannel(userID, function(err, res) {
    // Check if it is private message
    if (typeof res !== 'undefined' && res.id === channelID) {
      handlePrivateMessage(user, userID, message, event);
    } else {
      handlePublicMessage(user, userID, channelID, message, event);
    }
  });

});

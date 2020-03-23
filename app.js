// import { Game } from 'game.js'
var Game = require('./game.js');
var Discord = require('discord.io');
const jsonToken = require('./token.json');
var randomWords = require('random-words');

var bot = new Discord.Client({
  autorun: true,
  token: jsonToken.token,
});

var games;
var lastSaveGame;

/**
 * When the bot starts
 */
bot.on('ready', function() {
  console.log('Logged in as %s - %s\n', bot.username, bot.id);
  games = new Map();
  lastSaveGame = null;
});

/**
 * Retrieve the game a channel. If it does not exists, create it
 * @param {string} channelID Channel where the game should be played
 */
function findOrCreateGame(channelID) {
  if (games.has(channelID)) {
    // Using existing game
    return games.get(channelID);
  } else {
    var game = new Game(channelID);
    games.set(channelID, game);
    return game;
  }
}

/**
 * Add a player to a game
 * @param {Game} game Game in which the player is added
 * @param {string} user Discord username of the player added
 * @param {string} userID Discord UserID of the player added
 */
function addPlayer(game, user, userID) {
  if (!game.tryAddUser(userID)) {
    bot.sendMessage({
      to: game.getChannelID(),
      message: "Sorry, you cannot join the game. Wait for it to finish." +
        " (Your are either already in, or it has started)"
    });
  } else {
    bot.sendMessage({
      to: game.getChannelID(),
      message: user + " was added to the game. There are " +
        game.getPlayers().length +" players"
    });
  }
}

/**
 * Distribute roles to players
 * They can be mayor, werewolf, seer or villager
 * @param {Game} game Game in which roles are distributed
 * @param {string} channelID ID of the channel where the game takes place
 * @param {boolean} keepMayor Wether whe should keep the current mayor
 * @returns true only if there is a mayor, at least a werewolf and a seer
 */
function tryDistribute(game, channelID, keepMayor = false) {
  // Set mayor if needed
  if (!game.hasMayor() || !keepMayor) {
    if (game.hasMayor()) {
      bot.sendMessage({
        to: channelID,
        message: "Choosing a new Mayor... The old one was not good enough"
      });
    }
    let mayor = game.tryInitMayor();
  }

  let mayor = game.getMayor();
  console.log("Mayor is: " + mayor);

  bot.sendMessage({
    to: channelID,
    message: "Distributing the roles to the players"
  });

  // Initialize other players
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

    // Choose a werewolf
    let werewolf = game.tryInitWerewolf();
    bot.sendMessage({
      to: werewolf,
      message: "You are a werewolf. The secret word will be revealed to you when chosen"
    });
    
    // Choose a seer
    let seer = game.tryInitSeer();
    bot.sendMessage({
      to: seer,
      message: "You are a seer. The secret word will be revealed to you when chosen"
    });

    // Telling other players they are villagers
    game.getVillagers().forEach(function(userID, index, array){
      bot.sendMessage({
        to: userID,
        message: "You are a villager. You will have to find the word and/or who is the werewolf"
      });
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
    return werewolf !==null && seer !== null;
  }
}

/**
 * Initialize Werewolf and Seer
 * @param {Game} game Game that where we want to reveal the werewolf
 */
function tryRevealWerewolfAndSeer(game) {
  let werewolf = game.getWerewolf();
  if (werewolf === null) {
    bot.sendMessage({
      to: game.getChannelID(),
      message: "We need a werewolf to play. Is there enough players ?"
    });
    return false;
  } else {
    let seer = game.getSeer();
    if (seer === null) {
      bot.sendMessage({
        to: game.getChannelID(),
        message: "We need a seer to play, not enough players"
      });
    } else {
      /*
      All roles are distributed, we can start the game
      */
      console.log("Werewolf has revealed. Seer has seen!");
      bot.sendMessage({
        to: game.getChannelID(),
        message: "Werewolf has revealed. Seer has seen!"
      });
    
      // Send the word to werewolf and seer
      bot.sendMessage({
        to: werewolf,
        message: "The secret word is: " + game.getSecretWord()
          + ". The other players should not guess it"
      });
      bot.sendMessage({
        to: seer,
        message: "The secret word is: " + game.getSecretWord()
          + ". Try to make the other players guess it"
      });
    }
  }
}

/**
 * Function called once the timer has ended to announce to the players
 * @param {string} channelID ID of the channel where the messages will be sent
 * TODO put the 1 minute timer part in the Game class
 */
function finishedGameCallback(channelID) {
  bot.sendMessage({
    to: channelID,
    message: "Time's up Esmeralda. Drop the mic.\n" +
      "You now have one more minute to find the GarouWolf"
  });

  // Leave one minute (66s in fact) for the players to decide who is the werewolf
  this.timerId = setTimeout(function () {
    bot.sendMessage({
      to: channelID,
      message: "STOP! Type who you think is the werewolf, **NOW**"
    });
    // Add final countdown
    var countdown = 4;
    let countdownInterval = setInterval(function (channel) {
      countdown--;
      if (countdown > 0) {
        bot.sendMessage({
          to: channel,
          message: countdown
        });
      }
      else {
        bot.sendMessage({
          to: channel,
          message: "0!!!"
        });
        clearInterval(countdownInterval);
      }
    }, 1000, channelID);
  }, 60 * 1000);
}

/**
 * Start a game of a channel
 * @param {string} channelID Channel where the game should be played
 */
function start(channelID) {
  console.log("Trying to start the game in " + channelID);
  let game = findOrCreateGame(channelID);
  // The game won't be started if it has just been created
  if (game.isStarted()) {
    console.log("Game already started");
    bot.sendMessage({ to: channelID, message: "Please wait for the current game to finish" });
  } else {
    console.log("Trying to start the game if everything is set up");
    
    // Elect a mayor instead of starting if there is none
    if (!game.hasMayor()) {
      console.log("Game has no mayor");
      bot.sendMessage({ to: channelID, message: "A mayor must be elected before starting" });
      if (!tryDistribute(game, channelID)) {
        console.log("Could not start, and not enough players distribute roles");
        bot.sendMessage({
          to: channelID,
          message: "Try to start again when you have enough players" +
            " (You are only " + game.getPlayers().length +" for now)"
        });
      } else {
        console.log("Could not start, but roles have been distributed");
      }
    } else {
      // If the game has no secret word, inform the players
      if (!game.hasSecretWord()) {
        console.log("Cannot start, no secret word yet");
        bot.sendMessage({
          to: channelID,
          message: "The mayor must choose a word in order for the werewolf" +
            " to reveal and seer to see. *use $distribute to have a new mayor*"
        });
      } else {
        console.log("Starting the game");
        bot.sendMessage({
          to: channelID,
          message: "Starting the game with " + game.getPlayers().length +" players\n" +
            "You can ask 36 Yes/No questions to the mayor to find the word and/or the werewolf."
        });
        // Start the game if everything is okay
        startGame(game);
      }
    }

  }
}

/**
 * Try to start the game if it has enough players
 * @param {Game} game Game that should start
 * @param {string} channelID Channel where messages are sent
 */
function startGame(game, channelID) {
  let gameStarted = game.tryStart(finishedGameCallback);
  // The game may have not started ff there are not enough players
  if (!gameStarted) {
    console.log("Game could not start");
    bot.sendMessage({
      to: channelID,
      message: "Not enough players to start the game"
    });
  } else {
    let countdown = 5;
    console.log("Game starting...");
    let countdownInterval = setInterval(function() {
      countdown--;
      if (countdown > 0) {
        bot.sendMessage({
          to: channelID,
          message: countdown
        });
      } else {
        showTimeLeft(game);
        clearInterval(countdownInterval);
      }
    }, 1000);
  }
}

/**
 * Send a message with the time left for the game of the channel
 * @param {Game} game Game being played
 */
function showTimeLeft(game) {
  if (!game.isStarted()) {
    bot.sendMessage({ to: game.getChannelID(), message: "Wait for the current game to finish" });
  } else {
    var minutes = Math.floor((game.remainingTime() % (1000 * 60 * 60)) / (1000 * 60));
    var seconds = Math.floor((game.remainingTime() % (1000 * 60)) / 1000);
    
    bot.sendMessage({
      to: game.getChannelID(),
      message: "**You have " + minutes + " minutes and " + seconds +" seconds left...**"
    });
  }
}

/**
 * Handle a message sent in private to the bot
 * @param {string} user Discord username of the sender
 * @param {string} userID Discord UserID of the sender
 * @param {string} message Content of the message
 * @param {*} event 
 */
function handlePrivateMessage(user, userID, message, event) {
  console.log("I got a private message from: " + user);
  
  // Search on all games to find the first one concerned
  const gameValues = games.values();
  let gameIt;
  do {
    gameIt = gameValues.next();
  } while (!gameIt.done && !gameIt.value.isMayor(userID));
  let game = gameIt.value;
  
  // If we cannot a game where the player is mayor, the message can be ignored 
  if (typeof game === 'undefined' || game === null) {
    bot.sendMessage({
      to: userID,
      message: "The WhereWordz game should be played in a channel.\n" +
        " You should only send me direct message if I asked you a question first"
    });
  } else {
    if (game.hasWordBeenChosen(message)){
      // Confirmation to mayor
      bot.sendMessage({
        to: userID,
        message: "Secret word: " + game.getSecretWord()
      });
      // Information to other players
      bot.sendMessage({
        to: game.getChannelID(),
        message: "The secret word has been chosen! You can start the game. Aoooouuuuh"
      });
  
      tryRevealWerewolfAndSeer(game);
    }
  }
}

/**
 * Handle every message, posted in any channel the bot is present
 * @param {string} user Discord username of the sender
 * @param {string} userID Discord UserID of the sender
 * @param {string} userID Channel where the message has been sent
 * @param {string} message Content of the message
 * @param {*} event 
 */
function handlePublicMessage(user, userID, channelID, message, event) {
  if (message.includes("<@!" + bot.id + ">")) {
    bot.sendMessage({
      to: channelID,
      message: "My name is Garou, and I can help you play the game WhereWordz. " +
        "Tell me commands by sending a word with '$' before it.\n" +
        "Try $help for example"
    });
  }

  if (message.startsWith('$')) {

    switch (message) {

      case "$join":
        addPlayers(findOrCreateGame(channelID), user, userID);
        break;
      case "$distribute":
        tryDistribute(findOrCreateGame(channelID), channelID, false);
        break;
      case "$election":
        tryDistribute(findOrCreateGame(channelID), channelID, true);
        break;
      case "$fakegame":
        let gameF = findOrCreateGame(channelID);
        addPlayer(gameF, user, userID);
        tryDistribute(findOrCreateGame(channelID), channelID, true);
        addPlayer(gameF, "Tata", "Tata");
        addPlayer(gameF, "Toto", "Toto");
        break;
      case "$start":
        start(channelID);
        break;
      case "$pause":
        let gameP = findOrCreateGame(channelID);
        showTimeLeft(gameP);
        bot.sendMessage({
          to: channelID,
          message: "Pausing the game"
        });
        gameP.pause();
        break;
      case "$resume":
        let gameR = findOrCreateGame(channelID);
        bot.sendMessage({
          to: channelID,
          message: "Resuming the game"
        });
        gameR.resume();
        showTimeLeft(gameR);
        break;
      case "$time":
        showTimeLeft(findOrCreateGame(channelID));
        break;
      case "$stop":
        if (games.has(channelID)){
          let gameS = games.get(channelID)
          gameS.pause();
          lastSaveGame = gameS;
          games.delete(channelID);
          bot.sendMessage({
            to: channelID,
            message: "The game has been stopped and players removed"
          });
        } else {
          bot.sendMessage({
            to: channelID,
            message: "No game had been created previously"
          });
        }
        break;
      case "$restore":
        if (lastSaveGame !== null) {
          lastSaveGame.setChannelID(channelID);
          games.set(channelID, lastSaveGame);
        }
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
            "- If the word is found at the end the time or questions," +
            " the *Werewolf* can win by telling the *Seer*\n" +
            "- If the word is NOT found, the *Villagers* can win by telling the *Werewolf*\n" +
            "So both must be careful"
        });
        break;
      case "$help":
        bot.sendMessage({
          to: channelID,
          message: "Available commands are: join, distribute (or election), start, pause," +
            " resume, time, rules, stop (and help ;))."
        });
        break;
    }
  }
}

/**
 * Any message received. In a channel or direct message
 */
bot.on('message', function(user, userID, channelID, message, event) {
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

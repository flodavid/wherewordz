const DEFAULT_DURATION = 6;
const QUESTION_NB = 30;

/**
 * Store a game data and logic
 * No message is printed to the user from this class
 */
class Game {
  /**
   * Constructor of a Game
   * @param {string} channelID Discord ChannelID where the game is to be played
   */
  constructor(channelID) {
    this.channelID = channelID;
    // 500 milliseconds are added to have a round timer after time calculation is done
    this.remaining = null;
    this.timerId, this.start;
    this.playing = false;
    this.started = false;
    this.users = [];
    this.villagers = null;
    this.mayor = null;
    this.secretWord = null;
    this.messageCallback = null;
  }
  
  getChannelID() {
    return this.channelID;
  }

  setChannelID(channelID) {
    this.channelID = channelID;
  }
  
  getPlayers() {
    return this.users;
  }
  
  getVillagers() {
    return this.villagers;
  }
  
  getMayor() {
    return this.mayor;
  }
  
  getWerewolf() {
    return this.werewolf;
  }
  
  getSeer() {
    return this.seer;
  }

  getSecretWord() {
    return this.secretWord;
  }

  getQuestionsLeft() {
    return this.nbQuestionsLeft;
  }

  /**
   * Randomly insert the user into the villagers array
   * @param {string} user  Discor UserID of the player to insert as villager
   */
  randomInsertVillager(user) {
    let playerIndex = Math.floor(Math.random() * (this.villagers.length + 1));
    console.log("randomInsertVillager> Randomly add the user '" + user +
      "' to villagers (" + this.villagers +")," +
      " may become a werewolf, not a mayor. Index: " + playerIndex);
    // Add the user, removing 0 other villager
    this.villagers.splice(playerIndex, 0, user)
    console.log("randomInsertVillager> Villagers: " + this.villagers);
  }

  /**
   * Try to add a user to the game
   * @param {*} user User details (username, userID, ...)
   * @returns true if the user was successfully added
   */
  tryAddUser(user) {
    if (this.started) {
      console.log("tryAddUser> Cannot add user, game started");
      return false;
    } else {
      if (this.users.includes(user)) {
        console.log("tryAddUser> Cannot add user, already in: "+ user);
        return false;
      } else {
        // If there are already villagers, the player is added randomly to them
        if (this.villagers !== null) {
          this.randomInsertVillager(user);
        }
        
        this.users.push(user);
        console.log("tryAddUser> User added");
        return true; 
      }
    }
  }

  /**
   * Create a copy of the users, shuffled
   * @returns the array of shuffled users
   */
  shuffleUsers() {
    // Copy array before randomizing it
    let shuffledUsers = [...this.users];
    var currentIndex = shuffledUsers.length, temporaryValue, randomIndex;
  
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
  
      // And swap it with the current element.
      temporaryValue = shuffledUsers[currentIndex];
      shuffledUsers[currentIndex] = shuffledUsers[randomIndex];
      shuffledUsers[randomIndex] = temporaryValue;
    }
  
    return shuffledUsers;
  }

  /**
   * Tells wether a player is the mayor of the game or not
   * @param {string} userID Discord UserID of the player
   * @returns true if the player is indeed the mayor of the game
   */
  isMayor(userID) {
    return this.mayor !== null && this.mayor === userID;
  }

  /**
   * Check if a game has started
   * @returns true if it has started
   */
  isStarted() {
    return this.started;
  }

  /**
   * Check if the mayor has been initialized
   * @returns true if the mayor is set
   */
  hasMayor() {
    return this.mayor !== null;
  }

  /**
   * Check if the secret word has been initialized
   * @returns true if the secret word is set
   */
  hasSecretWord() {
    return this.secretWord !== null;
  }

  /**
   * Check if the players can still ask questions
   * @returns true there is at least one question left to ask
   */
  hasQuestionsLeft() {
    return this.nbQuestionsLeft > 0;
  }


  /**
   * Try to set the mayor
   * @returns the mayor selected, null if there is no player in the game
   */
  tryInitMayor() {
    if (this.users.length < 1) {
      console.log("Need at least one player to init mayor");
      return null;
    } else {
      // Reset the secret word to be selected later by the new mayer
      this.secretWord = null;

      // Select mayor randomly
      console.log("Initializing the mayor randomly");
      let mayorIndex = Math.floor(Math.random() * this.users.length);
      this.mayor = this.users[mayorIndex];
      return this.mayor;
    }
  }

  /**
   * Second/third initialization to do
   * If there is already a werewolf, it is put back to the villagers and may be
   * selected again
   * @returns the werewolf selected. null if it failed
   */
  tryInitWerewolf() {
    if (this.users.length < 2) {
      console.log("Need at least two players to init werewolf and seer");
      return null;
    } else {
      // Check if werewolf (and villagers) have already been initialized
      if (this.werewolf === null) {
        // Randomize the users order and consider them as villager by default
        this.villagers = this.shuffleUsers();
      } else {
        // Put back the old werewolf to the villagers
        this.randomInsertVillager(this.werewolf);
      }
      console.log("Selecting the first villager as werewolf");

      // Select the first as werewolf and remove it
      this.werewolf = this.villagers.shift();
      console.log("tryInitWerewolf> Remaining villagers: " + this.villagers);

      return this.werewolf;
    }
  }


  /**
   * Second/third initialization to do
   * @returns the seer selected. null if it failed
   */
  tryInitSeer() {
    if (this.users.length < 2) {
      console.log("Need at least two players to init seer and werewolf");
      return null;
    } else {
      console.log("Selecting the first villager as seer");

      // Select the first as werewolf and remove it
      this.seer = this.villagers.shift();
      console.log("tryInitSeer> Remaining villagers: " + this.villagers);

      return this.seer;
    }
  }


  /**
   * Try to set the given message has 
   * @param {string} message 
   * @returns false if the secret word has already been set or the given one is empty
   */
  trySelectWord(message) {
    if (this.secretWord !== null) {
      return false;
    } else {
      this.secretWord = message.trim();
      if (this.secretWord === null || this.secretWord === "") {
        this.secretWord = null;
        return false;
      } else {
        console.log("The secret word has been set to: "+ this.secretWord);
        return true;
      }
    }
  }

  /**
   * Start the game. It should have been initialized before
   * @param {function} callback Function that will be called once the game has ended
   * @param {number} duration Duration of the game, in minutes. 6 minutes by default
   * @param {number} questions Maximum number of questions allowed for the players to ask
   * @returns true if their are enough players and roles have been distributed
   */
  tryStart(callback, duration = DEFAULT_DURATION, questions = QUESTION_NB) {
    this.remaining = duration * 1000 * 60 + 500;
    if (this.users.length < 3
      || this.mayor ===null || this.werewolf === null || this.seer === null) {
      console.log("Not enough users or not initialized, not starting");
      return false;
    } else {
      this.messageCallback = callback;
      this.started = true;
      this.nbQuestionsLeft = questions;

      // Start the timer
      this.resume();
      return true
    }
  }

  /**
   * Pause a game that has been started and is being played
   * Store the time left to be able to restart the game with the same amount
   */
  pause() {
    this.playing = false;
    clearTimeout(this.timerId);
    this.remaining -= Date.now() - this.start;
  };

  /**
   * Resume a game that has been paused or just initialized and not started
   */
  resume() {
    console.log("Resuming the game");
    this.playing = true;
    this.start = Date.now();
    clearTimeout(this.timerId);
    this.timerId = setTimeout(this.messageCallback, this.remaining, this);
  };

  /**
   * Stop a game, that is started and/or playing or not
   */
  putToAnEnd() {
    clearTimeout(this.timerId);
    this.playing = false;
    this.started = false;
  }

  /**
   * Inform the game that a question has been asked
   * @returns true if the question has been taken into account
   */
  tryAskQuestion() {
    if (this.playing) {
      -- this.nbQuestionsLeft;
      if (this.nbQuestionsLeft <= 0) {
        // Unset timer
        clearTimeout(this.timerId);
        this.remaining = null;
        
        // Start the finale phase of the game
        this.messageCallback.call(null, this);
      }
      return this.nbQuestionsLeft;
    } else return -1;
  }
  
  /**
   * Give the remaining time of the game
   * @returns the time left as a date
   */
  remainingTime() {
    return this.remaining
      ? this.start + this.remaining - Date.now()
      : 0;
  };
}
module.exports = Game

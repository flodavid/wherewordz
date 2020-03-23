/**
 * Store a game data and logic
 * No message is printed to the user from this class
 */
class Game {
  /**
   * 
   * @param {*} callback Function that will be called at the end of the game
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

  randomInsertVillager(user) {
    let playerIndex = Math.floor(Math.random() * (this.villagers.length + 1));
    console.log("randomInsertVillager> Randomly add the user '" + user + "' to villagers (" + this.villagers +")," +
      " may become a werewolf, not a mayor. Index: " + playerIndex);
    // Add the user, removing 0 other villager
    this.villagers.splice(playerIndex, 0, user)
    console.log("randomInsertVillager> Villagers: " + this.villagers);
  }

  /**
   * Try to add a user to the game
   * @param {*} user User details (username, userID, ...)
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
   * First initialization to do
   */
  tryInitMayor() {
    if (this.users.length < 1) {
      console.log("Need at least one player to init mayor");
      return null;
    } else {
      console.log("Initializing the mayor randomly");

      // Randomize the users order and set them as villager by default
      this.villagers = this.shuffleUsers();
      // Select the first as mayor and remove it
      this.mayor = this.villagers.shift();

      return this.mayor;
    }
  }

  /**
   * Tells wether a player is the mayor of the game or not
   * @param {string} userID Discord UserID of the player
   */
  isMayor(userID) {
    return this.mayor != null && this.mayor === userID;
  }

  hasMayor() {
    return this.mayor !== null;
  }

  hasSecretWord() {
    return this.secretWord !== null;
  }

  /**
   * Second/third initialization to do
   * If there is already a werewolf, it is put back to the villagers and may be
   * selected again
   */
  tryInitWerewolf() {
    console.log("tryInitWerewolf> Villagers: " + this.villagers)
    if (this.villagers.length < 1) {
      console.log("Need at least two players to init werewolf");
      return null;
    } else {
      // Put back the old werewolf to the p
      if (this.werewolf !== null) {
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
   */
  tryInitSeer() {
    console.log("tryInitSeer> Villagers: " + this.villagers)
    if (this.villagers.length < 1) {
      console.log("Need at least thee players to init seer");
      return null;
    } else {
      console.log("Selecting the first villager as seer");

      // Select the first as werewolf and remove it
      this.seer = this.villagers.shift();
      console.log("tryInitSeer> Remaining villagers: " + this.villagers);

      return this.seer;
    }
  }


  hasWordBeenChosen(message) {
    if (this.secretWord === null) {
      this.secretWord = message.trim();
      console.log("The secret word has been set to: "+ this.secretWord);
      return true;
    } else return false;
  }

  /**
   * Start the game. It should have been initialized before
   * @param {function} callback Function that will be called once the game has ended
   * @param {number} duration Duration of the game, in minutes. 6 minutes by default
   */
  tryStart(callback, duration = 6) {
    this.remaining = duration * 1000 * 60 + 500;
    if (this.users.length < 3) {
      console.log("Not enough users, not starting");
      return false;
    } else {
      this.messageCallback = callback;
      this.started = true;

      // Start the timer
      this.resume();
      return true
    }
  }

  isStarted() {
    return this.started;
  }

  /**
   * 
   */
  pause() {
    this.playing = false;
    clearTimeout(this.timerId);
    this.remaining -= Date.now() - this.start;
  };

  resume() {
    console.log("Resuming the game");
    this.playing = true;
    this.start = Date.now();
    clearTimeout(this.timerId);
    this.timerId = setTimeout(this.messageCallback, this.remaining, this.channelID);
  };
  
  remainingTime() {
    return this.remaining
      ? this.start + this.remaining - Date.now()
      : 0;
  };
}
module.exports = Game

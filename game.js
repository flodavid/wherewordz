class Game {
  /**
   * 
   * @param {*} callback Function that will be called at the end of the game
   * @param {*} delay Duration of the game
   */
  constructor(channelID, delay) {
    this.channelID = channelID;
    // 500 milliseconds are added to have a round timer after time calculation is done
    this.remaining = delay * 1000 * 60 + 500;
    this.timerId, this.start;
    this.playing = false;
    this.started = false;
    this.users = [];
    this.villagers = null;
    this.messageCallback = null;
  }

  getChannelID() {
    return this.channelID;
  }

  getPlayers() {
    return this.users;
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
          let playerIndex = Math.floor(Math.random() * (this.villagers.length + 1));
          console.log("tryAddUser> Randomly add user to villagers (" + this.villagers +")," +
            " may become a werewolf, not a mayor. Index: " + playerIndex);
          // Add the user, removing 0 other villager
          this.villagers.splice(playerIndex, 0, user)
          console.log("tryAddUser> Villagers: " + this.villagers);
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
      console.log("Moving 1 item");
  
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

  hasMayor() {
    return typeof this.mayor !== 'undefined' && this.mayor !== null;
  }

  hasWerewolf() {
    return typeof this.werewolf !== 'undefined' && this.werewolf !== null;
  }

  /**
   * Second/third initialization to do
   */
  tryInitWerewolf() {
    console.log("tryInitWerewolf> Villagers: " + this.villagers)
    if (this.villagers.length < 1) {
      console.log("Need at least two players to init werewolf");
      return null;
    } else {
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


  getVillagers() {
    return this.villagers;
  }  

  isWordSelectByPlayerMessage(userID, message) {
    if (userID == this.mayor) {
      this.secretWord = message.trim();
      console.log("The secret word has been set to: "+ this.secretWord);
      return true;
    } else return false;
  }

  getSecretWord() {
    return this.secretWord;
  }

  /**
   * Start the game. It should have been initialized before
   */
  tryStart(callback) {
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
    this.timerId = setTimeout(this.messageCallback, this.remaining);
  };
  
  remainingTime() {
    return this.remaining
      ? this.start + this.remaining - Date.now()
      : 0;
  };
}
module.exports = Game

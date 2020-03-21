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
    this.messageCallback = null;
  }

  getChannelID() {
    return channelID;
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
      return false;
    } else {
      if (this.users.includes(user)) {
        return false;
      } else {
        // If there are already villagers, the player is added randomly to them
        if (this.villagers) {
          let playerIndex = Math.floor(Math.random() * this.villagers.length + 1);
          // Add the user, removing 0 other villager
          this.villagers = this.villagers.splice(playerIndex, 0, user)
        }

        this.users.push(user);
        return true; 
      }
    }
  }

  /**
   * Create a copy of the users, shuffled
   */
  shuffleUsers() {
    // Copy array before randomizing it
    let shuffledUsers = [...users];
    var currentIndex = users.length, temporaryValue, randomIndex;
  
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
  initMayor() {
    /*
      * Define a role for every user
      */

    // Randomize the users order and set them as villager by default
    this.villagers = this.shuffleUsers();
    // Select the first as mayor and remove it
    this.mayor = villagers.shift();

    return this.mayor;
  }

  /**
   * Start the game. It should have been initialized before
   */
  tryStart(callback) {
    if (this.users.length < 3) {
      return null;
    } else {
      this.messageCallback = callback;
      this.started = true;

      // Start the timer
      this.resume();
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

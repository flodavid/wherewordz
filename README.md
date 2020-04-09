# Wherewordz

A Discord bot that let you play a game in a public channel.

## Technicals

Uses (the not maintained) [Discord.io](https://github.com/izy521/discord.io) library to read and send messages. To use another library, you would have to edit the app.js file.

The random-words library is used to propose words to the Mayor player. Another one could be used easily

### Requirements

+ Node.js 0.10.x or greater

## Build and run

Before first launch, run `npm install`.

Create a file token.json containing your application token given by discord. It must respect the format given in [token-template.json](token-template.json).

To run the application:

```bash
node app.js
```

### Play

Available commands are described in the handlePublicMessage() function in app.js. To show them in a channel, type $help where the bot can read and write messages.

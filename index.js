require('dotenv').config();

const tmi = require('tmi.js');
const logger = require('./logger')('Index');
const Client = require('./client.js');
const format = require('./format.js');

class Index {
  
  constructor(tmiClient, listener, server, messageHandler) {
    this.tmiClient = tmiClient;
    this.listener = listener;
    this.server = server;
    this.messageHandler = messageHandler;
  }

  async onMessage(target, context, msg) {
    try {
      const response = await this.messageHandler.handleMessage(
          msg, context["display-name"], 'TWITCH',
          'https://twitch.tv/' + target);
      logger.info(`Responding with ${response} to ${target}`);
      this.tmiClient.say(target, response);
    } catch (e) {
      logger.warn(e.message);
    }
  }

  onConnection(addr, port) {
    logger.info(`* Connected to ${addr}:${port}`);
    if (process.env.LISTEN === '1') {
      this.listen();
    } else {
      logger.info("Set env LISTEN to 1 to listen for CWT chat messages.");
    }
  }

  listen() {
    logger.info("Listening to CWT messages");
    const posted = {};
    this.listener.listen(message => {
      this.server.channels.forEach(channel => {
        if (!(channel in posted)) posted[channel] = [];
        if (!posted[channel].includes(message.id)) {
          if (message.newsType === 'TWITCH_MESSAGE'
              && message.body.split(',')[1].search(new RegExp(`\\b${channel}\\b`))) {
            logger.info("Message is from this same Twitch channel.", channel);
            return;
          }
          logger.info(`Scheduling for sending message to ${channel}`);
          const formatted = format({...message, author: message.author.username});
          logger.info(`sending "${formatted}" to ${channel}`);
          this.tmiClient.say(channel, formatted);
          posted[channel].push(message.id);
        } else {
          logger.info(`${channel} already received message.`);
        }
      });
    });
  }
}

module.exports = (...args) => new Index(...args);

if (require.main === module) {
  const client = new tmi.client({
    options: {
        debug: true
    },
    connection: {
        secure: true,
        reconnect: true
    },
    identity: {
      username: process.env.BOT_USERNAME,
      password: process.env.OAUTH_TOKEN,
    },
    channels: [],
  });

  const options = { protocol: process.env.PROTOCOL,
    hostname: process.env.HOSTNAME,
    port: parseInt(process.env.PORT),
  };

  const port = process.argv[2] || 1234;
  const Listener = require('./listener')({...options, path: '/api/message/listen'});
  const Client = require('./client.js')(options);
  const Server = require('./server')(port, client, Client);
  const MessageHandler = require('./handle.js')(Client);
  const index = new Index(client, Listener, Server, MessageHandler);

  client.on('message', (target, context, msg, self) => {
    if (self) return;
    index.onMessage(target, context, msg);
  });

  client.on('connected', (addr, port) => {
    index.onConnection(addr, port);
  });

  client.on("join", (channel, username, self) => {
    if (!self) return;
    setTimeout(() => {
      logger.info(`Joined ${channel}, saying hello.`);
      let msg = `Hello, ${channel}, I'm standing by for all questions related to CWT.`;
      const args = ["!cwtcommands", channel, 'TWITCH', 'https://twitch.tv/' + channel];
      const response = MessageHandler.handleMessage(...args).then(res => {
        msg += " These are my commands: " + res;
        client.say(channel, msg);
      });
    }, 1);
  });

  client.on("part", (channel, username, self) => {
    if (!self) return;
    logger.info(`Parting ${channel}, saying goodbye.`);
    let msg = `Hello, ${channel}, I'm standing by for all questions related to CWT.`;
    client.say(channel, "I'm off. Goodbye everyone! Catch up on the latest at cwtsite.com");
  });

  client.connect().then(() => {
    Server.listen(options.protocol === 'https');
  });
}


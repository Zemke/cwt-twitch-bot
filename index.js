const tmi = require('tmi.js');
const {handleMessage} = require('./handle.js');
const logger = require('./logger')('Index');
const Client = require('./client.js');

class Index {
  
  constructor(tmiClient, listener, server) {
    this.tmiClient = tmiClient;
    this.listener = listener;
    this.server = server;
  }

  onMessage(target, context, msg) {
    try {
      const response = await handleMessage(
          msg, context["display-name"], 'TWITCH',
          'https://twitch.tv/' + target);
      logger.info(`Responding with ${response} to ${target}`);
      this.tmiClient.say(target, response);
    } catch (e) {
      logger.warn(e.message);
    }
  }

  onConnection() {
    logger.log(`* Connected to ${addr}:${port}`);
    if (process.env.LISTEN === '1') {
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
            logger.log(`sending "${formatted}" to ${channel}`);
            this.tmiClient.say(channel, formatted);
            posted[channel].push(message.id);
          } else {
            logger.info(`${channel} already received message.`);
          }
        });
      });
    } else {
      logger.info("Set env LISTEN to 1 to listen for CWT chat messages.");
    }
  }
}

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

  const options = {
    protocol: 'https',
    hostname: 'cwtsite.com',
    port: 443,
  };

  const Server = require('./server')(client, port);
  const Listener = require('./listener')({...options, path: '/api/message/listen'});
  const Index = new Index(client, Listener, Server);

  client.on('message', (target, context, msg, self) {
    if (self) return;
    Index.onMessage(target, context, msg);
  });

  client.on('connected', (addr, port) {
    Index.onConnection(addr, port);
  });

  client.connect().then(() => {
    const port = process.argv[2] || 1234;
    Server.listen(options.protocol === 'https');
  });
}

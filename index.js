const tmi = require('tmi.js');
const {handleMessage} = require('./handle.js');
const request = require('./request.js');

const channels = [process.env.CHANNEL_NAME];
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
  channels
});

client.on('message', onMessageHandler);
client.on('connected', onConnectedHandler);
client.connect();


async function onMessageHandler(target, context, msg, self) {
  if (self) return;
  try {
    const response = await handleMessage(
        msg, context["display-name"], 'TWITCH',
        'https://twitch.tv/' + target);
    console.info(`Responding with ${response} to ${target}`);
    client.say(target, response);
  } catch (e) {
    console.warn(e.message);
  }
}

function onConnectedHandler (addr, port) {
  console.log(`* Connected to ${addr}:${port}`);
  if (process.env.LISTEN === '1') {
    console.info("Listening to CWT messages");
    request.listen(channels, (channel, message) => {
      console.log('sending "${message}" to ${channel}');
      client.say(channel, message);
    });
  } else {
    console.info("Set env LISTEN to 1 to listen for CWT chat messages.");
  }
}


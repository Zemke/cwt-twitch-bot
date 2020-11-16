const tmi = require('tmi.js');
const EventSource = require('EventSource');
const {handleMessage} = require('./handle.js');

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
  channels: [process.env.CHANNEL_NAME],
});

client.on('message', onMessageHandler);
client.on('connected', onConnectedHandler);
client.connect();


async function onMessageHandler(target, context, msg, self) {
  if (self) return;
  const response = await handleMessage(msg, context["display-name"]);
  console.info(`Responding with ${response} to ${target}`);
  client.say(target, response);
}

function onConnectedHandler (addr, port) {
  console.log(`* Connected to ${addr}:${port}`);
  if (process.env.LISTEN === '1') {
    request.listenToMessages(client.getChannels, (channel, message) => {
      client.say(channel, message);
    });
  } else {
    console.info("Set env LISTEN to 1 to listen for CWT chat messages.");
  }
}


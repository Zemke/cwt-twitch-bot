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
    listenToMessages();
  } else {
    console.info("Set env LISTEN to 1 to listen for CWT chat messages.");
  }
}

function listenToMessages() {
  const posted = {};
  const url = 'https://cwtsite.com/api/message/listen';
  console.info("Listening to messages", url);
  const es = new EventSource(url);
  es.onmessage = e => console.info("es message", e);
  es.onerror = e => console.error("es error", e);
  const starting = Date.now();
  es.addEventListener("EVENT", e => {
    console.info("EVENT", e);
    const message = JSON.parse(e.data);
    if (Date.now() - starting <= 3000) {
      client.getChannels().forEach(channel => {
        if (!(channel in posted)) posted[channel] = [];
        posted[channel].push(message.id);
      });
      console.info('Discarding as probable part of initial batch');
      return;
    }
    client.getChannels().forEach(channel => {
      if (!(channel in posted)) posted[channel] = [];
      if (!posted[channel].includes(message.id)) {
        console.info(`Scheduling for sending message to ${channel}`);
        client.say(channel, format(message));
        posted[channel].push(message.id);
      } else {
        console.info(`${channel} already received message.`);
      }
    });
  });

  function format({category, author, body, newsType}) {
    if (category === 'SHOUTBOX') {
      return `${author.username} via CWT: “${body}”`;
    }
    let res = author.username + " ";
    if (newsType === "REPORT" || newsType === "COMMENT") {
      const [gameid, home, away, scoreh, scorea] = body.split(',');
      res += `${newsType.toLowerCase()}ed ${home} ${scoreh}–${scorea} ${away} \
(https://cwtsite.com/games/${gameid})`.trim();
    } else if (newsType === "RATING") {
      const [gameid, home, away, scoreh, scorea, rating] = body.split(',');
      res += `${rating}d ${home} ${scoreh}–${scorea} ${away} (https://cwtsite.com/games/${gameid})`;
    } else if (newsType === "STREAM" || newsType === "TWITCH_MESSAGE") {
      console.info("Ignoring newsType", newsType);
    } else {
      console.warn("Unhandled newsType:", newsType);
    }
    return res;
  }
};


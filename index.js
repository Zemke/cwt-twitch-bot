const tmi = require('tmi.js');
const request = require('./request.js');

const client = new tmi.client({
  identity: {
    username: process.env.BOT_USERNAME,
    password: process.env.OAUTH_TOKEN,
  },
  channels: [process.env.CHANNEL_NAME],
});

client.on('message', onMessageHandler);
client.on('connected', onConnectedHandler);
client.connect();

async function onMessageHandler (target, context, msg, self) {
  if (self) return;
  const command = msg.trim();
	console.log('target', target);
	console.log('context', context);
	const name = context["display-name"];
  if (command === '!cwturl') {
		respond(client, target,
				`Thanks for asking, ${name}, the best site in the wormy world is of course cwtsite.com`);
		console.info('cmd', command);
	} else if (command.startsWith('!cwtchat ')) {
		await request.post('message/twitch', {body: command.slice(9)});
		respond(client, target, `Your message has been posted, ${name}`);
	} else if (command === '!cwtdice') {
		respond(client, target,
				`Any marginally good bot can roll a dice, right? ${name} has rolled a ${dice()}`);
  } else {
		respond(client, target, `Nothing I have to say about this, ${name}.`);
  }
}

function respond(client, target, msg) {
	client.say(target, `[BOT] ${msg}`);
}

function rollDice () {
  return Math.floor(Math.random() * 6) + 1;
}

function onConnectedHandler (addr, port) {
  console.log(`* Connected to ${addr}:${port}`);
}


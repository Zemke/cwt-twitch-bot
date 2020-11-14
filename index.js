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

const grassyTextures = [
  'Data\\Level\\-Farm',
  'Data\\Level\\Jungle',
  'Data\\Level\\Medieval',
  'Data\\Level\\Sports',
  'Data\\Level\\Tribal',
];
let tournament;
let maps;
console.info("getting current tournament");
request.get('tournament/current').then(res => tournament = res);

async function onMessageHandler(target, context, msg, self) {
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
    try {
      await request.post(
        'message/twitch',
        {
          body: command.slice(9),
          displayName: name,
          channelName: process.env.CHANNEL_NAME,
        }
      );
      respond(client, target, `Your message has been posted, ${name}.`);
    } catch (e) {
      console.error(e);
      respond(client, target `Sorry, something went wrong.`);
    }
  } else if (command === '!cwtdice') {
    respond(client, target,
        `Any marginally good bot can roll a dice, right? ${name} has rolled a ${dice()}.`);
  } else if (command === '!cwthell') {
    try {
      console.log(tournament);
      maps = maps || await request.get(`tournament/${tournament.id}/maps`);
      const hell = maps.filter(m => m.texture === 'Data\\Level\\Hell')
      respond(client, target,
          `Hell terrain has been played ${hell.length} times this year. There's potential for more.
Track the playoffs Hell counter here: cwtsite.com/hell`);
    } catch (e) {
      console.error(e);
      respone(client, target, 'Sorry, that topic is too sad, ${name}.');
    }
  } else if (command === '!cwtfavterrain') {
    maps = maps || await request.get(`tournament/${tournament.id}/maps`);
    const result = maps
      .reduce((acc, curr) => {
        if (curr.texture == null) return acc;
        const added = acc.findIndex(x => x[0] === curr.texture)
        if (added !== -1) acc[added][1] = acc[added][1] + 1;
        else acc.push([curr.texture, 1]);
        return acc;
      }, [])
      .sort((o1, o2) => o2[1] - o1[1])
      .filter((_val, idx) => idx < 3)
      .map(x => `${x[0].split('\\').pop()} (${x[1]}`);
    respond(client, target,
          `The three most used terrains this year are ${result.join(', ')}. More at cwtsite.com/maps`);
  } else if (command === '!cwtwinners') {
    const winners = (await request.get('tournament'))
          .sort((t1, t2) => new Date(t1.created).getTime() - new Date(t2.created).getTime())
          .reduce((acc, curr) => {
            if (curr.goldWinner == null) return acc;
            const added = acc.findIndex(x => x[0] === curr.goldWinner.username);
            if (added === -1) acc.push([curr.goldWinner.username, [new Date(curr.created).getFullYear()]]);
            else acc[added][1].push(new Date(curr.created).getFullYear());
            return acc;
          }, [])
          .map(t => `${t[0]} (${t[1].join(', ')})`);
    respond(client, target,
          `The CWT champions are ${winners.join('; ')}. More at cwtsite.com/archive`);
  } else if (command === '!cwtwhatisthisthing') {
    respond(client, target,
      `Crespo’s Worms Tournament (commonly known as CWT) is a tournament known for its
high-level competition. It was founded by Crespo in July 2002 and has been hosted on a
yearly basis ever since. More at https://worms2d.info/Crespo%27s_Worms_Tournament`);
  } else if (command === '!cwtrafkagrass') {
    const rafkaGrass = maps
      .filter(m => m.game.homeUser.id === 6100 || m.game.awayUser.id === 6100)
      .filter(m => grassyTextures.includes(m.texture))
    respond(client, target,
          `Rafka has rocked ${rafkaGrass.length} grassy maps this year.`);
  } else {
    respond(client, target, `Nothing I have to say about this, ${name}.`);
  }
  return Promise.resolve();
}

function respond(client, target, msg) {
  client.say(target, `[BOT] ${msg}`);
}

function dice() {
  return Math.floor(Math.random() * 6) + 1;
}

function onConnectedHandler (addr, port) {
  console.log(`* Connected to ${addr}:${port}`);
}


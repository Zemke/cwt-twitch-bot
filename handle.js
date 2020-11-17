const request = require('./request.js');

const rafkaId = 29;
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];
const grassyTextures = [
  'Data\\Level\\-Farm',
  'Data\\Level\\Jungle',
  'Data\\Level\\Medieval',
  'Data\\Level\\Sports',
  'Data\\Level\\Tribal',
];
let tournament;

console.info("getting current tournament");
request.get('tournament/current').then(res => tournament = res);

const commands = [
    "!cwtchat", "!cwtdice", "!cwthell", "!cwtterrain", "!cwtwinners", "!cwtcommands",
    "!cwtschedule", "!cwtplayoffs", "!cwtwhatisthisthing", "!cwtrafkagrass", "!cwturl"];

const newsType = {
  DISCORD: 'DISCORD_MESSAGE',
  TWITCH: 'TWITCH_MESSAGE',
};

async function handleMessage(msg, username, service) {
  const command = msg.trim();
  console.info('cmd', command);
  const name = username || '' ;
  if (command === '!cwtcommands') {
    return (`The CWT bot commands are ${commands.join(', ')}.`);
  } else if (command === '!cwturl') {
    return (`Thanks for asking, ${name}, the best site in the wormy world is of course cwtsite.com`);
  } else if (command.startsWith('!cwtchat')) {
    try {
      if (!message) {
        return ("Enter your message after the command that is then sent to the cwtsite.com chat.");
      }
      const newsType = newsType[service];
      if (newsType == null) throw Error(`newsTypes are ${newsType}, service given is ${service}`);
      await request.post(
        'message/twitch',
        {
          body: message,
          displayName: name,
          channelName: process.env.CHANNEL_NAME,
          newsType,
        }
      );
      return (`Your message has been posted, ${name}.`);
    } catch (e) {
      console.error(e);
      return (`Sorry, something went wrong.`);
    }
  } else if (command === '!cwtdice') {
    const dice = Math.floor(Math.random() * 6) + 1;
    return (`Any marginally good bot can roll a dice, right? ${name} has rolled a ${dice}.`);
  } else if (command === '!cwthell') {
    try {
      console.info("tournament", tournament);
      maps = maps || await request.get(`tournament/${tournament.id}/maps`);
      const hell = maps.filter(m => m.texture === 'Data\\Level\\Hell')
      return (`Hell terrain has been played ${hell.length} times this year. There's potential for more.
Track the playoffs Hell counter here: cwtsite.com/hell`);
    } catch (e) {
      console.error(e);
      respone(client, target, `Sorry, that topic is too sad, ${name}.`);
    }
  } else if (command === '!cwtterrain') {
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
      .map(x => `${x[0].split('\\').pop()} (${x[1]})`);
    return (`The three most used terrains this year are ${result.join(', ')}. More at cwtsite.com/maps`);
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
    return (`The CWT champions are ${winners.join(', ')}. More at cwtsite.com/archive`);
  } else if (command === '!cwtschedule') {
    // TODO GMT?
    const schedule = (await request.get('schedule'))
          .map(s => {
            s.appointment = new Date(s.appointment);
            return s;
          })
          .filter(({appointment}) => appointment > Date.now())
          .map(s =>  {
            const d = s.appointment;
            const hours = d.getUTCHours() < 10 ? ('0' + d.getUTCHours()) : ("" + d.getUTCHours());
            const minutes = d.getUTCMinutes() < 10 ? ('0' + d.getUTCMinutes()) : ("" + d.getUTCMinutes());
            const formatted = `${months[d.getUTCMonth()]}. ${d.getUTCDate()}, ${hours}:${minutes}`;
            return `${s.homeUser.username}–${s.awayUser.username} on ${formatted}`;
          });
    if (!schedule.length) {
      return ('No game have been scheduled unfortunately.');
    } else {
      return (`The following games have been scheduled: ${schedule.join('; ')}.`);
    }
  } else if (command === '!cwtplayoffs') {
    const byRound = (await request.get('tournament/current/game/playoff'))
            .filter(g => g.reportedAt == null)
            .filter(g => g.homeUser != null || g.awayUser != null)
            .reduce((acc, g, idx, arr) => {
              let homeUser = g.homeUser?.username;
              let awayUser = g.awayUser?.username;
              if (g.homeUser == null) {
                homeUser = possibleOpponents(g, arr).join('/');
                awayUser = g.awayUser.username;
              } else if (g.awayUser == null) {
                awayUser = possibleOpponents(g, arr).join('/');
                homeUser = g.homeUser.username;
              }
              const formatted = `${homeUser}–${awayUser}`;
              if (g.playoffRoundLocalized in acc) {
                acc[g.playoffRoundLocalized] += `, ${formatted}`;
              } else {
                acc[g.playoffRoundLocalized] = `${formatted}`;
              }
              return acc;
            }, {});
    const games = Object.keys(byRound).map(k => `${k}: ${byRound[k]}`);
    return ('The remaining games are ' + games.join(' — '));
  } else if (command === '!cwtwhatisthisthing') {
    return (`Crespo’s Worms Tournament (commonly known as CWT) is a tournament known for its \
high-level competition. It was founded by Crespo in July 2002 and has been hosted on a \
yearly basis ever since. More at https://worms2d.info/Crespo%27s_Worms_Tournament`);
  } else if (command === '!cwtrafkagrass') {
    const rafkaGrass = maps
      .filter(m => m.game.homeUser.id === rafkaId || m.game.awayUser.id === rafkaId)
      .filter(m => grassyTextures.includes(m.texture))
    return (`Rafka has rocked ${rafkaGrass.length} grassy maps this year.`);
  } else if (command.startsWith('!cwt') && command !== '!cwt') {
    return (`Nothing I have to say about this, ${name}.`);
  }
  throw Error('no handler');
}

function possibleOpponents(game, games) {
    const stack = [game];
    const res = [];
    while (stack.length) {
      const curr = stack.splice(0, 1)[0];
      if (curr.homeUser == null) {
        const waitingForHome = games.find(x =>
                  (x.playoff.round === curr.playoff.round - 1
                   && x.playoff.spot === curr.playoff.spot * 2 - 1));
        waitingForHome.homeUser != null && res.push(waitingForHome.homeUser.username);
        waitingForHome.awayUser != null && res.push(waitingForHome.awayUser.username);
        if (waitingForHome.homeUser == null || waitingForHome.awayUser == null) {
          stack.push(waitingForHome);
        }
      }
      if (curr.awayUser == null) {
        const waitingForAway = games.find(x =>
                  (x.playoff.round === curr.playoff.round - 1
                   && x.playoff.spot === curr.playoff.spot * 2));
        waitingForAway.homeUser != null && res.push(waitingForAway.homeUser.username);
        waitingForAway.awayUser != null && res.push(waitingForAway.awayUser.username);
        if (waitingForAway.homeUser == null || waitingForAway.awayUser == null) {
          stack.push(waitingForAway);
        }
      }
    }
    return res;
}

const api = {};
api.handleMessage = handleMessage;
module.exports = api;

if (require.main === module) {
  handleMessage(process.argv[4], process.argv[3], process.argv[2])
    .then(res => console.log('RES xx ' + res))
    .catch(err => {
      console.error(err);
      process.exit(1);
    })
    .finally(() => process.exit(0));
}


const https = require('https');

let cache = {};

setInterval(() => {
  cache = {};
}, 1000 * 60 * 5);

function request(method, path, data) {
  if (method === 'GET' && cache[path] != null) return Promise.resolve(cache[path]);
  return new Promise((resolve, reject) => {
    data = JSON.stringify(data);
    const options = {
      hostname: 'cwtsite.com',
      port: 443,
      path: "/api/" + path,
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (data != null) options.headers['Content-Length'] = data.length;
    const req = https.request(options, res => {
      console.info('status', res.statusCode);
      let resData = '';
      res.on('data', d => resData += d);
      res.on('end', () => {
        console.info("response\n", resData);
        const parsed = JSON.parse(resData);
        if (method === 'GET') {
          cache[path] = parsed;
        }
        resolve(parsed);
      });
    });
    req.on('error', error => reject(error));
    if (data != null && method === 'POST') req.write(data);
    req.end();
  });
}

function listenToMessages(channels, cb) {
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
      channels.forEach(channel => {
        if (!(channel in posted)) posted[channel] = [];
        posted[channel].push(message.id);
      });
      console.info('Discarding as probable part of initial batch');
      return;
    }
    channels.forEach(channel => {
      if (!(channel in posted)) posted[channel] = [];
      if (!posted[channel].includes(message.id)) {
        console.info(`Scheduling for sending message to ${channel}`);
        cb(channel, format(message));
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

const api = {
  post(path, data) {
    return request('POST', path, data);
  },
  get(path) {
    return request('GET', path);
  },
  listen(channels, cb) {
    return channels(channels, cb);
  }
};

module.exports = api;


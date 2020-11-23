const http = require('http');
const https = require('https');
const logger = require('./logger')('Server');

/**
 * an endpoint to let the bot join a channel,
 * leave a channel and get the status for a channel
 */
class Server {
  
  constructor(port, tmiClient, cwtClient) {
    this.port = port;
    this.tmiClient = tmiClient;
    this.cwtClient = cwtClient;
    this.channels = [];
  }

  listen(ssl = false) {
    logger.info("Using SSL:", ssl);
    this.server = (ssl ? https : http).createServer((req, res) => {
      if (req.url === '/favicon.ico') return this._end(res, 404, null);
      if (req.method === 'OPTIONS') {
        res.statusCode = 200;
        this._headers(res);
        return res.end();
      }
      res.setHeader('Content-Type', 'application/json')
      logger.info('incoming', req.url);
      const segments = req.url.split('/')
      const formatError = "request have to be in the format /api/{channel_name}/{action}";
      if (segments.length < 3) {
        this._end(res, 404, {message: formatError});
        return;
      }
      const action = segments[segments.length - 1];
      let channel = segments[segments.length - 2]
      if (!action || !channel) {
        logger.warn("action or channel is falsy", action, channel);
        this._end(res, 404, {message: formatError});
        return;
      }
      channel = channel.toLowerCase();
      const token = req.headers["authorization"]
      logger.info("token is", token);
      this._dispatch(action, channel, token)
        .then(dispatching => {
          logger.info('dispatching success', dispatching);
          this._end(res, 200, dispatching);
        })
        .catch(err => {
          logger.exception('dispatching error', err);
          this._end(res, 400, {err});
        });
    });
    logger.info('listening to port', this.port);
    this.server.listen(this.port);
  }

  async checkWithCwt(channel, authToken) {
    const headers = {'Authorization': authToken};
    return this.cwtClient.get(
        `/api/channel/${channel}/write-access`,
        {headers});
  }

  async _dispatch(action, channel, authToken) {
    if (action === 'status') {
      return this.status(channel);
    } else if (action === 'join') {
      return this.join(channel, authToken);
    } else if (action === 'part') {
      return this.part(channel, authToken);
    } else {
      return Promise.reject("no handler");
    }
  }

  async join(channel, authToken) {
    const isAllowed = await this.checkWithCwt(channel, authToken);
    if (!isAllowed) throw Error('Forbidden');
    const joined = await this.tmiClient.join(channel);
    this.channels.push(channel);
    return joined;
  }

  async part(channel, authToken) {
    const isAllowed = await this.checkWithCwt(channel, authToken);
    if (!isAllowed) throw Error('Forbidden');
    const parted = await this.tmiClient.part(channel);
    this.channels.splice(this.channels.indexOf(channel), 1);
    return parted;
  }

  // TODO listen to kick events more ways to join/part a channel
  //  to keep track
  status(channel) {
    logger.info('channel', channel);
    logger.info('channels', this.channels);
    return {joined: (this.channels.indexOf(channel) !== -1)};
  }

  _end(res, code, body) {
    this._headers(res);
    logger.info('responding', code, body);
    res.statusCode = code;
    res.end(JSON.stringify(body));
  }


  _token(headers) {
    const headerSplit = headers["Authorization"]?.split(" ")
    if (headerSplit == null || headerSplit.length !== 2) {
      return null;
    }
    return headerSplit.pop();
  }

  _headers(res) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.setHeader("Access-Control-Allow-Methods", "*");
    res.setHeader("Content-Type", "application/json");
  }
}

module.exports = (...args) => new Server(...args);

if (require.main === module) {
  throw Error("this cannot be run standalone");
}


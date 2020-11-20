// an endpoint to let the bot join a channel,
//  leave a channel and get the status for a channel


const http = require('http');

class Endpoint {
  
  constructor(port, client) {
    this.port = port;
    this.client = client;
    this.channels = [];
  }

  // TODO auth with CWT so that only the channel owner can make the bot join
  listen() {
    this.server = http.createServer((req, res) => {
      if (req.url === '/favicon.ico') return this._end(res, 404, null);
      res.setHeader('Content-Type', 'application/json')
      log.info('incoming', req.url);
      const segments = req.url.split('/')
      const formatError = "request have to be in the format /api/{channel_name}/{action}";
      if (segments.length < 3) {
        this._end(res, 404, {message: formatError});
        return;
      }
      const action = segments[segments.length - 1];
      let channel = segments[segments.length - 2]
      if (!action || !channel) {
        log.warn("action or channel is falsy", action, channel);
        this._end(res, 404, {message: formatError});
        return;
      }
      channel = channel.toLowerCase();
      this._dispatch(action, channel)
        .then(dispatching => {
          log.info('dispatching success', dispatching);
          this._end(res, 200, dispatching);
        })
        .catch(err => {
          console.log(err)
          log.exception('dispatching error', err);
          this._end(res, 400, {err});
        });
    });
    this.server.listen(this.port);
    log.info('listening to port', this.port);
  }

  // TODO need persistence maybe?
  //  won't need persistence if the bot parts all channels
  //  when the server goes down
  // TODO listen to kick events more ways to join/part a channel
  //  to keep track
  status(channel) {
    log.info('channel', channel);
    log.info('channels', this.channels);
    return {joined: (this.channels.indexOf(channel) !== -1)};
  }

  async join(channel) {
    const joined = await this.client.join(channel);
    this.channels.push(channel);
    return joined;
  }

  async part(channel) {
    const parted = await this.client.part(channel);
    this.channels.splice(this.channels.indexOf(channel), 1);
    return parted;
  }

  async _dispatch(action, channel) {
    if (action === 'status') {
      return this.status(channel);
    } else if (action === 'join') {
      return this.join(channel);
    } else if (action === 'part') {
      return this.part(channel);
    } else {
      return Promise.reject("no handler");
    }
  }

  _end(res, code, body) {
    log.info('responding', code, body);
    res.statusCode = code;
    res.end(JSON.stringify(body));
  }
}

class Log {
  info(...message) { console.info(`[${this._ts()}] ${this._fmt(message)}`); }
  warn(...message) { console.warn(`[${this._ts()}] ${this._fmt(message)}`); }
  error(...message) { console.error(`[${this._ts()}] ${this._fmt(message)}`); }
  debug(...message) { console.debug(`[${this._ts()}] ${this._fmt(message)}`); }
  exception(message, e) { console.error(`[${this._ts()}] ${message} ${e}`); }
  _fmt(message) { return message.map(x => JSON.stringify(x)).join(" "); }
  _ts() { return new Date().toISOString(); } 
}

const log = new Log();

module.exports = Endpoint;

if (require.main === module) {
  throw Error("this cannot be run standalone");
}


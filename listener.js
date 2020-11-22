const EventSource = require('eventsource');
const logger = require('./logger')("Listener");

class Listener {

  constructor({protocol, hostname, port, path}) {
    this.protocol = protocol;
    this.hostname = hostname;
    this.port = parseInt(port);
    this.path = path.startsWith('/') ? path : '/' + path;
  }

  listen(cb) {
    const url = this._url();
    logger.info("Listening to stream on", url);
    const es = new EventSource(url); // TODO we can do this ourselves
    es.onmessage = e => logger.info("es message", e);
    es.onerror = e => logger.error("es error", e);
    es.addEventListener("EVENT", e => this._onEvent(e, cb));
  }

  _onEvent(e, cb) {
    logger.info("EVENT", e);
    cb(JSON.parse(e.data));
  }

  _url() {
    let port;
    if (this.protocol === 'https' && this.port === 443) {
      port = '';
    } else if (this.protocol === 'http' && this.port === 80) {
      port = '';
    } else {
      port = ':' + this.port;
    }
    return `${this.protocol}://${this.hostname}${port}${this.path}`;
  }
}

module.exports = (...args) => new Listener(...args);

if (require.main === module) {
  throw Error('this script doesn\'t run standalone');
}


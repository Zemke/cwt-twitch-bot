class Helper {

  constructor() {
    this.colors = {
      red: "\x1b[31m",
      dim: "\x1b[2m",
      yellow: "\x1b[33m",
    };
    this.reset = "\x1b[0m";
  }

  fmt(realm, color, message) {
    const infix = `[${this.ts()}] [${realm}] `
        + message.map(x => JSON.stringify(x)).join(" ");
    return this.color(color, infix);
  }

  color(c, infix) {
    if (c != null) {
      const color = this.colors[c];
      if (color == null) {
        throw Error(`${c} not available in ${Object.keys(this.colors)}`);
      }
      return `${color}${infix}${this.reset}`;
    } else {
      return infix;
    }
  }

  ts() { return new Date().toISOString(); }
}

const helper = new Helper();

class Logger {

  constructor(realm) { this.realm = realm; }
  info(...message) { console.info(`${helper.fmt(this.realm, null, message)}`); }
  warn(...message) { console.warn(`${helper.fmt(this.realm, 'yellow', message)}`); }
  error(...message) { console.error(`${helper.fmt(this.realm, 'red', message)}`); }
  debug(...message) { console.debug(`${helper.fmt(this.realm, 'dim', message)}`); }
  exception(message, e) { console.error(helper.color('red', `${helper.fmt(this.realm, null, [message])}: ${e?.stack}`)); }
}

module.exports = realm => new Logger(realm);


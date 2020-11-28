const logger = require('./logger')("Client");
const outerSpace = require('./outer-space.js');

class Client {

  constructor(options, thirdPartyToken, cacheDuration) {
    this.outerSpace = outerSpace(options, thirdPartyToken);
    this.cache = {};
    this.neverCache = cacheDuration === 0;
    if (cacheDuration !== -1 && !this.neverCache) {
      const finalCacheDuration = cacheDuration == null
          ? 1000 * 60 * 5 : cacheDuration;
      setInterval(() => (this.cache = {}), finalCacheDuration);
    }
  }

  async get(path, options) {
    if (this.cache[path] != null) {
      logger.info("serving from cache");
      return this.cache[path];
    }
    logger.info('GET', path);
    const res = await this.outerSpace.get(path, options);
    if (!this.neverCache) this.cache[path] = res;
    return res;
  }

  async post(path, payload, options) {
    logger.info('POST', path);
    return await this.outerSpace.post(path, payload, options);
  }
}

module.exports = (...args) => new Client(...args);

if (require.main === module) {
  throw Error('this script doesn\'t run standalone');
}


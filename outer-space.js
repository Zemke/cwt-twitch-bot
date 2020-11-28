class OuterSpace {

  constructor(options, thirdPartyToken) {
    this.options = {
      ...options,
      headers: {
        ...options?.headers,
        'Content-Type': 'application/json',
        'third-party-token': thirdPartyToken,
      },
    };
    this.http = this.options.protocol === 'https'
        ? require('https') : require('http');
  }

  get(path, options={}) {
    return this.request('GET', path, null, options);
  }

  post(path, payload, options={}) {
    return this.request('POST', path, payload, options);
  }

  request(method, path, payload, options) {
    options = {...this.options, ...options, method, path};
    delete options.protocol;
    payload = JSON.stringify(payload);
    const posting = payload != null && method === 'POST';
    if (posting) {
      options.headers['Content-Length'] = Buffer.byteLength(payload);
    }
    return new Promise((resolve, reject) => {
      console.log(options);
      const req = this.http.request(options, res => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            res.statusCode.toString().startsWith('2')
                ? resolve(json) : reject(json);
          } catch (_) {
            reject(data);
          }
        });
      });
      req.on('error', error => reject(error));
      if (posting) req.write(payload);
      req.end();
    });
  }
}

module.exports = (...args) => new OuterSpace(...args);


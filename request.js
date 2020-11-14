const https = require('https');

function request(method, path, data) {
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
        resolve(JSON.parse(resData));
      });
    });
    req.on('error', error => reject(error));
    if (data != null && method === 'POST') req.write(data);
    req.end();
  });
}

const api = {
  post(path, data) {
    return request('POST', path, data);
  },
  get(path) {
    return request('GET', path);
  }
};

module.exports = api;


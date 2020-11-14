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
		if (data != null) options.headersr['Content-Length'] = data.length;
		const req = https.request(options, res => {
			console.info('statusCode', res.statusCode);
			let resData = '';
			res.on('data', d => resData += d);
			res.on('end', () => {
        console.info("response\n", resData);
        resolve(resData);
      });
		});
		req.on('error', error => reject(error));
		if (data != null && method === 'POST') req.write(data);
		req.end();
	});
}

const api = {
  post(path, data) {
    request('POST', path, data);
  },
  get(path) {
    request('GET', path);
  }
};

module.exports = api;


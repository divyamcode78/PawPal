const http = require('http');
const data = JSON.stringify({ email: 'test@example.com', password: 'Password1!' });
const options = {
  hostname: '::1',
  port: 3000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
  },
};

const req = http.request(options, (res) => {
  console.log('statusCode', res.statusCode);
  let body = '';
  res.on('data', (chunk) => (body += chunk));
  res.on('end', () => {
    console.log('body', body);
  });
});

req.on('error', (err) => {
  console.error('request error', err);
});

req.write(data);
req.end();

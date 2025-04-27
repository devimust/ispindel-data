const http = require('http');
const { Client } = require('elasticsearch');
const elkClient = new Client({
  host: 'http://elasticsearch:9200',
});

const testJsonObject = {
  "name": "Test iSpindel 1",
  "ID": "1753984",
  "token": "Test Token 123",
  "angle": 88.75525665,
  "temperature": 29.375,
  "temp_units": "C",
  "battery": 5.338894367,
  "gravity": 32.94065475,
  "interval": 5,
  "RSSI": -53
};

function elkLog(data) {
  elkClient.index({
    index: 'ispindel-log-index',
    body: {
      timestamp: new Date(),
      ...data
    },
  })
  .then(response => console.log('Log entry sent to Elasticsearch:', response.result))
  .catch(err => console.error('Error sending log entry:', err));
};

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end('ok');
    return;
  }

  if (req.method === 'GET' && req.url === '/test') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end('ok');
    elkLog(testJsonObject);
    return;
  }

  if (req.method === 'POST' && req.url === '/ispindel-data') {
    res.setHeader('Content-Type', 'text/plain');

    let postRawData = '';
    req.on('data', chunk => {
      postRawData += chunk.toString();
    });

    req.on('end', () => {
      try {
        const jsonObject = JSON.parse(postRawData);
        console.log('data received:', jsonObject);
        res.statusCode = 200;
        res.end();
        elkLog(jsonObject);
      } catch (error) {
        console.error("Error parsing JSON:", error);
        res.statusCode = 500;
        res.end('Error parsing JSON');
      }
    });
  } else {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Page Not Found');
  }
});

const port = 3000;
const host = '0.0.0.0';

server.listen(port, host, () => {
  console.log(`server running at ${host}:${port}`);
});

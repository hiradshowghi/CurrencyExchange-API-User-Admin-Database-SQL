const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const fs = require('fs');
const routes = require('./routes/index');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(routes.authenticate);
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));

app.get('/index.html', routes.index);
app.get('/style.css', function (request, response) {
  const filePath = path.join(__dirname, 'public', 'css', 'style.css');
  sendFile(response, filePath, 'text/css');
});
app.get('/js/script.js', function (request, response) {
  const filePath = path.join(__dirname, 'public', 'js', 'script.js');
  sendFile(response, filePath, 'text/javascript');
});

app.get('/img/:filename', function (request, response) {
  const filePath = path.join(__dirname, 'public', 'img', request.params.filename);
  sendFile(response, filePath);
});

app.use(express.static(path.join(__dirname, 'public')));

function sendFile(response, filePath, contentType = 'text/html') {
  const fullPath = path.join(__dirname, filePath);
  fs.readFile(filePath, function (err, data) {
    if (err) {
      handleError(response, err);
      return;
    }
    response.writeHead(200, {
      'Content-Type': contentType
    });
    response.write(data);
    response.end();
  });
}

function handleError(response, err) {
  console.log('ERROR: ' + JSON.stringify(err));
  response.writeHead(404);
  response.end(JSON.stringify(err));
}

app.listen(PORT, err => {
  if (err) console.log(err);
  else {
    console.log(`Server listening on port: ${PORT} CNTL:-C to stop`);
    console.log(`To Test:`);
    console.log('user: ldnel password: secret');
    console.log('http://localhost:3000/index.html');
    console.log('http://localhost:3000/users');
  }
});

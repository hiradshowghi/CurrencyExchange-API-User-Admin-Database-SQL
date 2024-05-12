const url = require('url');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose(); // verbose provides more detailed stack trace
const db = new sqlite3.Database('data/users');

exports.authenticate = function(request, response, next) {
  /*
	Middleware to perform BASIC HTTP 401 authentication
	*/
  let auth = request.headers.authorization;

  // auth is a base64 representation of (username:password)
  // so we need to decode the base64
  if (!auth) {
    // Note: setHeader must be before writeHead
    response.setHeader('WWW-Authenticate', 'Basic realm="need to login"');
    response.writeHead(401, {
      'Content-Type': 'text/html'
    });
    console.log('No authorization found, sending 401.');
    response.end();
  } else {
    console.log("Authorization Header: " + auth);

    // Decode authorization header
    // Split on a space; the original auth looks like "Basic Y2hhcmxlczoxMjM0NQ==" and we need the 2nd part
    var tmp = auth.split(' ');

    // Create a buffer and tell it the data coming in is base64
    var buf = Buffer.from(tmp[1], 'base64');

    // Read it back out as a string; should look like 'ldnel:secret'
    var plain_auth = buf.toString();
    console.log("Decoded Authorization ", plain_auth);

    // Extract the userid and password as separate strings
    var credentials = plain_auth.split(':'); // split on a ':'
    var username = credentials[0];
    var password = credentials[1];
    console.log("User: ", username);
    console.log("Password: ", password);

    var authorized = false;

    // Check database users table for user
    db.all("SELECT userid, password, role FROM users", function(err, rows) {
      for (var i = 0; i < rows.length; i++) {
        if (rows[i].userid == username && rows[i].password == password) {
          authorized = true;
          request.user_role = rows[i].role;
        }
      }
      if (authorized == false) {
        // We had an authorization header, but the user:password is not valid
        response.setHeader('WWW-Authenticate', 'Basic realm="need to login"');
        response.writeHead(401, {
          'Content-Type': 'text/html'
        });
        console.log('No authorization found, sending 401.');
        response.end();
      } else {
        next();
      }
    });
  }
};

function handleError(response, err) {
  // Report file reading error to console and client
  console.log('ERROR: ' + JSON.stringify(err));

  // Respond with not found 404 to client
  response.writeHead(404);
  response.end(JSON.stringify(err));
}

function send_users(request, response, rows) {
  const filePath = path.join(__dirname, 'index.html');
  fs.readFile(filePath, function(err, data) {
    if (err) {
      handleError(response, err);
      return;
    }
    response.writeHead(200, {
      'Content-Type': 'text/html'
    });
    response.write(data);

    // INSERT DATA
    for (let row of rows) {
      console.log(row);
      response.write(`<p>user: ${row.userid} password: ${row.password}</p>`);
    }

    response.end();
  });
}

exports.index = function(request, response) {
  const filePath = path.join(__dirname, 'index.html');
  fs.readFile(filePath, function(err, data) {
    if (err) {
      handleError(response, err);
      return;
    }
    response.writeHead(200, {
      'Content-Type': 'text/html'
    });
    response.write(data);
    response.end();
  });
};

function parseURL(request, response) {
  const PARSE_QUERY = true; // parseQueryStringIfTrue
  const SLASH_HOST = true; // slashDenoteHostIfTrue
  let urlObj = url.parse(request.url, PARSE_QUERY, SLASH_HOST);
  console.log('path:');
  console.log(urlObj.path);
  console.log('query:');
  console.log(urlObj.query);
  return urlObj;
}

exports.users = function(request, response) {
  // /send_users
  console.log('USER ROLE: ' + request.user_role);

  if (request.user_role !== 'admin') {
    response.writeHead(200, {
      'Content-Type': 'text/html'
    });
    response.write('<h2>ERROR: Admin Privileges Required To See Users</h2>');
    response.end();
    return;
  }
  db.all("SELECT userid, password FROM users", function(err, rows) {
    send_users(request, response, rows);
  });
};

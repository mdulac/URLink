var http = require('http');
var sys = require('sys');
var fs = require('fs');
var crypto = require('crypto');

var redis = require("redis");
var express = require("express");

var client = redis.createClient();
var app = express();

client.on("error", function (err) {
	console.log("Error " + err);
});

// Route "/" by default
app.get('/', function(req, res) {
	res.writeHead(301, {
		'Content-Type' : 'text/html',
		'Location' : 'index.html',
	});
	res.end();
});

// Route "/index.html"
app.get('/index.html', function(req, res) {
	res.writeHead(200, {
		'Content-Type' : 'text/html'
	});
	res.write(fs.readFileSync(__dirname + '/../views/index.html'));
	res.end();
});

// Route for getting CSS files
app.get('/css/:file', function(req, res) {
	var file = req.param('file');
	res.writeHead(200, {
		'Content-Type' : 'text/css'
	});
	res.write(fs.readFileSync(__dirname + '/../css/' + file));
	res.end();
});

// Route for getting IMG files
app.get('/img/:file', function(req, res) {
	var file = req.param('file');
	res.writeHead(200, {
		'Content-Type' : 'image/png'
	});
	res.write(fs.readFileSync(__dirname + '/../img/' + file));
	res.end();
});

// Route for getting JS files
app.get('/js/:file', function(req, res) {
	var file = req.param('file');
	res.writeHead(200, {
		'Content-Type' : 'text/javascript'
	});
	res.write(fs.readFileSync(__dirname + '/../js/' + file));
	res.end();
});

// Service REST GET
app.get(/^\/([a-zA-Z0-9-_]{6})$/, function(req, res) {
	// TODO : implements REST Service to get a full URL by its hash
	
	var id = req.params[0];
	
	client.get(id, function(err, reply) {
		
    	// reply is null when the key is missing
    	var status = (reply == null ? 404 : 301);
    	var location = (reply == null ? '' : reply);
    	
    	res.writeHead(status, {
			'Content-Type' : 'text/html',
			'Host' : location
		});
    	
    	res.write('COOL!');
		res.end();
    	
	});
});

// Service REST POST
app.post('/api/minify/:url', function(req, res) {
	// TODO : implements REST Service to add a new URL
	
	var url = req.param('url');
	
	// TODO Create regexp rules and extract Host name {
	
	// First, suppress http:// at the beginning if it's present
	var verifie = /^http:\/\//.test(url);
	url = url.substring(7);
	
	// }
	
	// XXX : for the moment, just keep the 6 first chars from sha1 hash
	var hash = crypto.createHash('sha1').update(url).digest('base64').substring(0, 6);
	
	// We replace base64 encoding by base64url encoding, due to '/'
	hash = hash.replace("+","-");
	hash = hash.replace("/","_");
	
	// Set the URL in NoSQL Redis
	client.set(hash, url);
	
	// JSONify the hash
	var response = '{ "url" : "' + url + '", "minified" : "' + hash + '" }'
	
	res.writeHead(200, {
		'Content-Type' : 'text/json'
	});
	
	res.write(response);
	res.end();
});

// To clean the Redis Server (admin)
app.get('/admin/clean', function(req, res) {
	client.send_command("FLUSHDB", []);
	res.end();
});

// Start Server
app.listen(8080);
console.log("Server listening on port 8080");

function sendSSE(req, res) {
	res.writeHead(200, {
		'Content-Type' : 'text/event-stream',
		'Cache-Control' : 'no-cache',
		'Connection' : 'keep-alive'
	});

}

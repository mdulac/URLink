var http = require('http');
var sys = require('sys');
var fs = require('fs');
var crypto = require('crypto');

var express = require("express");
var app = express();

// Route "/"
app.get('/', function(req, res) {
	
	res.writeHead(301, {
		'Content-Type' : 'text/html',
		'Location' : 'index.html',
	});
	res.write(fs.readFileSync(__dirname + '/../views/index.html'));
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

// Route "/css/bootstrap.min.css"
app.get('/css/:file', function(req, res) {
	var file = req.param('file');
	res.writeHead(200, {
		'Content-Type' : 'text/css'
	});
	res.write(fs.readFileSync(__dirname + '/../css/' + file));
	res.end();
});

app.get('/img/:file', function(req, res) {
	var file = req.param('file');
	res.writeHead(200, {
		'Content-Type' : 'image/png'
	});
	res.write(fs.readFileSync(__dirname + '/../img/' + file));
	res.end();
});

// Service REST GET
app.get(/^\/([a-zA-Z0-9]{6})$/, function(req, res) {
	// TODO : implements REST Service to get a full URL by its hash
	
	var id = req.params[0];
	res.writeHead(200, {
		'Content-Type' : 'text/css'
	});
	res.write("COOL !");
	res.end();
});

// Service REST POST
app.post('/api/minify/:url', function(req, res) {
	// TODO : implements REST Service to add a new URL
	
	var url = req.param('url');
	
	res.writeHead(200, {
		'Content-Type' : 'text/css'
	});
	
	// XXX : for the moment, just keep the 6 first chars from sha1 hash
	var hash = crypto.createHash('sha1').update(url).digest('hex').substring(0, 6);
	res.write(hash);
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

var http = require('http');
var sys = require('sys');
var fs = require('fs');
var crypto = require('crypto');

var redis = require("redis");
var express = require("express");

var client = redis.createClient();
var app = express();

var protocols = ["http", "ftp"];

var status = {
    "ok" : "200",
    "error" : "404"
};

Array.prototype.contains = function(needle) {
   for (i in this) {
       if (this[i] == needle) {
       	console.log("Element", needle ,"found : ", this[i]);
       	return true;
       }
   }
   console.log("Element", needle ,"not found");
   return false;
}

client.on("error", function (err) {
	console.log(err);
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
    	var str = (reply == null ? '' : reply);
    	
    	console.log(str);
    	
    	var obj = JSON.parse(str);
    	
    	res.writeHead(status, {
			'Content-Type' : 'text/html',
			'Location' : obj["protocol"] + "://" + obj["host"] + obj["location"],
		});
    	
    	res.write('COOL!');
		res.end();
    	
	});
});

// Service REST POST
app.post('/api/minify/:url', function(req, res) {
	// TODO : implements REST Service to add a new URL
	
	res.writeHead(200, {
		'Content-Type' : 'text/json'
	});
	
	var url = req.param('url').toLowerCase();
	
	var json = validateURL(url, protocols);
	
	if(json["status"] == status["error"]) {
		res.write(JSON.stringify(json));
	}	
	
	else {
		var hash = createHash(url);
		// JSONify the hash
		json["hash"] = hash;
	
		// Set the URL in NoSQL Redis
		client.set(hash, JSON.stringify(json));
		res.write(JSON.stringify(json));
	}
	
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

// Considers that protocol is the pattern between the beginning of the string, and the pattern "://"
// @param url : URL (string) you want to test
// @param validProtocols : array of strings that represents the valid protocols
// @returns a JSON object that represents the URL (status 200) or the error (status ???)
function validateURL(url, validProtocols) {
	
	// Concatenate a / at the end of the URL if it is not present
	if(url.charAt(url.length-1) != '/') {
		url = url + '/';
	}
	
	var match = /^([a-zA-Z]+):\/\//i.exec(url);
	
	var input = url;
	
	// By default, consider that it's a http protocol URI
	var protocol = "http";
	
	// There is a protocol
	if(match != null && match.length > 0) {
		protocol = match[1];
		if(!validProtocols.contains(protocol)) {
			
			return { 
				"status" : status["error"],
				"protocol" : protocol,
				"input" : input
			};
			
		}
		url = url.substring(protocol.length + "://".length);
	}
	
	// Protocol checked, now verify the format of the URL : [username[:password]@](hostname|ip)[:port][/path/][?query][#fragment]
	match = /^(?:[a-zA-Z0-9]+(?::[a-zA-Z0-9]+)?@)?([a-zA-Z0-9\.]+)(?::\d{1,5})?((\/[a-zA-Z0-9\.\?=\-_&#,\+]+)*\/)$/i.exec(url);
	
	if(match != null && match.length > 0) {
		var host = match[1];
		var location = match[2];
		
		return {
			"status" : status["ok"],
			"protocol" : protocol,
			"host" : host,
			"location" : location,
			"input" : input
		};
	}
	
	console.log("URL non valide !");
	
	return { 
		"status" : status["error"],
		"protocol" : protocol,
		"input" : input
	};
	
}

function createHash(toHash) {
	
	// XXX : for the moment, just keep the 6 first chars from sha1 hash
	var hash = crypto.createHash('sha1').update(toHash).digest('base64').substring(0, 6);
	
	// We replace base64 encoding by base64url encoding, due to '/'
	hash = hash.replace("+","-");
	hash = hash.replace("/","_");
	
	return hash;
}

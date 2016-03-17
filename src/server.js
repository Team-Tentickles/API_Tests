//Imports, globals, and ports
var http = require('http'),
	fs = require('fs'),
	socketio = require('socket.io'),
	async = require('async'),
	config = require('./config/config.js'),
	rovi = require('./rovi.js'),
	echo = require('./echo.js'),
	port = process.env.PORT || process.env.NODE_PORT || 3000,
	index = fs.readFileSync(__dirname + '/../client/index.html');

//initializing the Rovi and Echo keys
rovi.init(config.rovi.key, config.rovi.secret);
echo.init(config.echo.key);

//Basic onRequest
var onRequest = function(req, res){
	res.writeHead(200,{"Content-Type": "text/html"});
	res.end(index);
};

//finds common things in two arrays (can be used for infuences and similarities)
//Only Logs in console for now
var compareArrays = function(arr1, arr2){
	var sames = [];

	for(var i in arr1){
		if(arr2.indexOf( arr1[i]) > -1){
			sames.push( arr1[i]);
		}
	}

	if(sames.length === 0){
		console.log("No matches");
	}
	else{
		console.log(sames);
	}
	
};

//finds the influeners using rovi
//Doesn't look for both influencers sychronously, looks for one set then the next
//this will have a small performance problems, look into alternatives
var findInflu = function(data, callback){
	rovi.get("name/influencers", { "name": data}, function (err, res) {
		if(err){
			console.log(err);
		}
		else{
			callback(null, res.influencers[0].name);
		}
	});
	
};

//finds similarities using echonest
//same problems as findInflu
var findSimilar = function(data){
	var firstInflu = [], secondInflu = [];

	//first set of similarities
	echo.get("artist/similar", { "name": data.first }, function (err, res) {
		if(err){
			console.log(err);
		}
		else{
			console.log(res.response);
			for(var i = 0; i < res.response.artists.length; i++){
			firstInflu.push(res.response.artists[i].name);
			}
			
			// second set of similarities
			echo.get("artist/similar", { "name": data.second }, function (err, res) {
				if(err){
					console.log(err);
				}
				else{
					for(var i = 0; i < res.response.artists.length; i++){
						secondInflu.push(res.response.artists[i].name);
					}
					//pass similarities to be compared
					compareArrays(firstInflu, secondInflu);
				}
			});
		}
	});
	
};

//Find Images for artist
//Currently not working because images function is deprecated
var findPhoto = function(data, callback){
	echo.get("artist/images", { "name": data}, function (err, res) {
		if(err){
			console.log(err);
		}
		else{
			callback(null, res.response.images[0].url);
		}
	});
};

//Finds video for artist
//A regular URL is returned from API services so we need to replace the URL to add the "embed" to make it website friendly
//Will need to check for all video sources (youtube, dailymotion, etc)
//Possible more effiecient way?
var findVideo = function(data, callback){
	echo.get("artist/video", { "name": data}, function (err, res) {
		if(err){
			console.log(err);
		}
		else{
			var oURL = res.response.video[0].url;
			var nURL = oURL.replace("http://www.dailymotion.com/", "http://www.dailymotion.com/embed/");
			
			callback(null, nURL);

		}
	});
};

var makePackage = function(data, socket){
	var dataPackage = {
		first: {
			images: [],
			video: [],
			influencers: []
		},
		second: {
			images: [],
			video: [],
			influencers: []
		},
		similar: {
			images: [],
			video: [],
			influencers: []
		}
	};

	async.parallel({
		firstVideo: function(callback){
			findVideo(data.first, callback);
		},
		secondVideo: function(callback){
			findVideo(data.second, callback);
		},
		firstImg: function(callback){
			findPhoto(data.first, callback);
		},
		secondImg: function(callback){
			findPhoto(data.second, callback);
		},
		firstInflu: function(callback){
			findInflu(data.first, callback);
		},
		secondInflu: function(callback){
			findInflu(data.second, callback);
		}
	},
	function(err, results){
		dataPackage.first.video.push({'url': results.firstVideo});
		dataPackage.second.video.push({'url':results.secondVideo});
		dataPackage.first.images.push({'url':results.firstImg});
		dataPackage.second.images.push({'url':results.secondImg});
		dataPackage.first.influencers.push({'name':results.firstInflu});
		dataPackage.second.influencers.push({'name':results.secondInflu});

		socket.emit('package', dataPackage);
	});
};

//onJoin test
var onJoined = function(socket){
	var msg = "Hey";
	socket.emit('init', msg);

	//When artists are recieved, this deals with that
	//I commented out each for testing
	//ideally we want one function that would run all of these functions and then return them as an object to be used by the client side
	socket.on('serverArtist', function(data){
		makePackage(data, socket);
	});
};

//Socket.io listening to ports for connections
var app = http.createServer(onRequest).listen(port);
var io = socketio(app);
io.sockets.on("connection", function(socket){
	onJoined(socket);
});

console.log('Listening in on port ' + port);
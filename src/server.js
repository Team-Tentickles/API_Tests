var http = require('http'),
	fs = require('fs'),
	socketio = require('socket.io'),
	config = require('./config/config.js'),
	rovi = require('./rovi.js'),
	echo = require('./echo.js'),
	port = process.env.PORT || process.env.NODE_PORT || 3000,
	index = fs.readFileSync(__dirname + '/../client/index.html');

rovi.init(config.rovi.key, config.rovi.secret);
echo.init(config.echo.key);

var onRequest = function(req, res){

	res.writeHead(200,{"Content-Type": "text/html"});
	res.end(index);
};

//finds common things in two arrays (can be used for infuences and similarities)
var compareArrays = function(arr1, arr2){
	var sames = [];

	for(i in arr1){
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
var findInflu = function(data){
	var firstInflu = [], secondInflu = [];

	//first set of influencers
	rovi.get("name/influencers", { "name": data.first }, function (err, res) {
		if(err){
			console.log(err);
		}
		else{
			for(var i = 0; i < res.influencers.length; i++){
				firstInflu.push(res.influencers[i].name);
			}

			// second set of influencers
			rovi.get("name/influencers", { "name": data.second }, function (err, res) {
				if(err){
					console.log(err);
				}
				else{
					for(var i = 0; i < res.influencers.length; i++){
						secondInflu.push(res.influencers[i].name);
					}
					//pass influencers to be compared
					compareArrays(firstInflu, secondInflu);
				}
			});
		}
	});
	
};

//finds similarities vusing echonest
var findSimilar = function(data){
	var firstInflu = [], secondInflu = [];

	//first set of similarities
	echo.get("artist/similar", { "name": data.first }, function (err, res) {
		if(err){
			console.log(err);
		}
		else{
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
					//pass influencers to be compared
					compareArrays(firstInflu, secondInflu);
				}
			});
		};
	});
	
};

var onJoined = function(socket){
	var msg = "Hey";
	socket.emit('init', msg);

	socket.on('serverArtist', function(data){
		findInflu(data);
		//findSimilar(data);
	});
};

var app = http.createServer(onRequest).listen(port);

var io = socketio(app);


io.sockets.on("connection", function(socket){
	onJoined(socket);
});

console.log('Listening in on port ' + port);
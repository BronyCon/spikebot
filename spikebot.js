require('./polyfill.js');

var util = require('util'),
	extend = require('extend'),
	IRC = require('irc'),
	config = require('./config.js'),
	modules = require('./modules.js');

// This bot has to authenticate before it can join any channels,
// so we can't just use the normal config options.
var bot = new IRC.Client(config.server, config.nick, {
	userName: config.userName,
	realName: config.realName,
	port: config.port || 6667,
	debug: false,
	showErrors: false,
	autoRejoin: true,
	autoConnect: false,
	channels: [],
	stripColors: config.stripColors || false,
});

// allow the bot to access its own config
bot.config = config;

// a convenience function for responding to the 'message' event
bot.reply = function(nick, to, text) {
	var dest = to.startsWith('#') ? to : nick;
	this.say(dest, text);
};

// errors should not crash the bot
bot.addListener('error', function(message) {
	console.log('Error: ', message);
	if(this.config.sendErrors) {
		this.say(this.config.sendErrors, 'Error: ' + message);
	}
});

// adding module functionality to the bot
extend(bot, modules);
console.log('Loading modules...');
bot.loadModules();

// add help functionality to the bot
bot.addListener('message', function(nick, to, text) {
	if(text.startsWith('!help')) {
		// standard help response
		var response = ["Hi! I'm SpikeBot, your number-one assistant bot!",
						"If you want to learn more, try !help <modulename> with one of these modules: " + bot.listModules().join(', ')];
		
		// module help response
		if(text.length > '!help '.length) {
			response = bot.moduleHelp(text.substr('!help '.length));
		}

		response.forEach(function(line) {
			bot.reply(nick, to, line);
		});
	}
});

// add the ability to authenticate with NickServ ...to the bot
bot.addListener('motd', function() {
	var whenAuthenticated = function() {
		for(var i = 0; i < bot.config.channels.length; ++i) {
			console.log('Joining ' + bot.config.channels[i] + '...');
			bot.join(bot.config.channels[i]);
		}
		
	};

	if(this.config.password) {
		var nickServListener = function(from, to, text) {
			if(from == 'NickServ') {
				if(text === 'Password accepted - you are now recognized.' || text === 'You are already identified.') {
					console.log('Authenticated with NickServ.');
					whenAuthenticated();
					bot.removeListener('pm', nickServListener);
				} else if(text === 'Password incorrect.') {
					console.log('Incorrect password given.');
					bot.removeListener('notice', nickServListener);
				}
			}
		};

		bot.addListener('notice', nickServListener);
		// send NickServ the password
		bot.say('NickServ', 'id ' + this.config.password);
	} else {
		whenAuthenticated();
	}
});

// debug ALL the things!
if(bot.config.debug) {
	console.log('Debug mode on!');
	bot.addListener('raw', function(r) {
		console.log('~   RAW: ', r.prefix, r.command, r.args.join(' '));
	});
}

// and... CONNECT!
console.log('Connecting to ' + bot.config.server + ' as ' + bot.config.nick + '...')
bot.connect();
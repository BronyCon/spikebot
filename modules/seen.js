var Module = require('./module.js');

var _seen,
	seenListener = function(to, nick, text) {
		if(! text.startsWith('!seen ')) {
			return;
		}

		var target = text.split(' ')[1].toLowerCase();
		if(target === this.bot.config.nick.toLowerCase()) {
			this.bot.reply(to, nick, 'I last saw myself this morning in the mirror. Lookin\' good, Spike. Lookin\' real good!');
		} else if(_seen[target]) {
			var response = 'The last time I saw ' + target + ' was ' + Date(_seen[target].time).toString();
			switch(_seen[target].action) {
				case 'in':
					response += ', in a channel I joined.';
					break;
				case 'join':
					response += ', joining a channel I was in.';
					break;
				case 'part':
					response += ', leaving a channel I was in.';
					break;
				case 'quit':
					response += ', signing off.';
					break;
				case 'nickfrom':
					response += ', changing their nick to ' + _seen[target].aux + '.';
					break;
				case 'nickto':
					response += ', changing their nick from ' + _seen[target].aux + '.';
					break;
				default:
					response += '.';
			}

			this.bot.reply(to, nick, response);
		} else {
			this.bot.reply(to, nick, 'I have never seen ' + target + '. Sorry!');
		}
	}
	namesListener = function(channel, nicks) {
		nicks = Object.keys(nicks); // actually get the list of nicks
		for(var i = 0; i < nicks.length; ++i) {
			this.saw(nicks[i], 'in');
		}
	},
	joinListener = function(channel, nick) {
		this.saw(nick, 'join');
	},
	partListener = function(channel, nick) {
		this.saw(nick, 'part');
	},
	quitListener = function(nick) {
		this.saw(nick, 'quit');
	},
	nickListener = function(oldNick, newNick) {
		this.saw(oldNick, 'nickfrom', newNick);
		this.saw(newNick, 'nickto', oldNick);
	};

var seenModule = new Module({
	message: [seenListener],
	names: [namesListener],
	join: [joinListener],
	part: [partListener],
	quit: [quitListener],
	nick: [nickListener]
});

seenModule.load = function(name, config, bot) {
	this.__proto__.load.apply(this, arguments);

	_seen = this.store.get('seen');
	if(! _seen) {
		_seen = {};
		this.save();
	}
};

seenModule.saw = function(nick, action, aux) {
	_seen[nick.trim().toLowerCase()] = {
		action: action,
		aux: aux || '',
		time: Date.now()
	};
	this.save();
};

seenModule.save = function() {
	this.store.set('seen', _seen);
};

seenModule.help = function() {
	return ['This module lets you ask me when last time I saw someone was.',
			'Use it like this: !seen <nick>'];
};

module.exports = seenModule;
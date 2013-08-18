var Module = require('./module.js');

var _laters = {},
	laterListener = function(to, nick, text, raw) {
		if(! text.startsWith('!later ')) {
			this.deliver(raw.nick);
			return;
		}

		var parts = text.split(' '),
			target = parts[1].trim().toLowerCase(),
			message = parts.slice(2).join(' ');

		if(target === this.bot.config.nick.toLowerCase()) {
			this.bot.reply(to, nick, 'Why wait to tell me, ' + raw.nick + '?');
		}

		this.post(target, message, raw.nick);
		this.bot.reply(to, nick, 'Okay, ' + raw.nick + '. I\'ll tell them the next time I see them.');

		this.deliver(raw.nick);
	},
	namesListener = function(channel, nicks) {
		nicks = Object.keys(nicks); // actually get the list of nicks
		for(var i = 0; i < nicks.length; ++i) {
			this.deliver(nicks[i]);
		}
	},
	joinListener = function(channel, nick) {
		this.deliver(nick);
	},
	nickListener = function(oldNick, newNick) {
		this.deliver(oldNick, newNick);
		this.deliver(newNick);
	};

var laterModule = new Module({
	message: [laterListener],
	names: [namesListener],
	join: [joinListener],
	nick: [nickListener]
});

laterModule.load = function(name, config, bot) {
	this.__proto__.load.apply(this, arguments);

	_later = this.store.get('later');
	if(! _later) {
		_later = {};
		this.save();
	}
};

laterModule.post = function(nick, message, from) {
	nick = nick.trim().toLowerCase();

	if(! _later[nick]) {
		_later[nick] = [];
	}

	_later[nick].push({
		message: message,
		from: from,
		time: Date.now()
	});

	this.save();
};

laterModule.deliver = function(nick, to) {
	nick = nick.trim().toLowerCase();
	to = to || nick;

	if(_later[nick] && _later[nick].length) {
		var bot = this.bot;
		_later[nick].forEach(function(message) {
			bot.say(to, message.from + ' asked me to pass along a message for you at ' + Date(message.time).toString() + ':');
			bot.say(to, message.message);
		});

		_later[nick] = [];
		this.save();
	}
};

laterModule.save = function() {
	this.store.set('later', _later);
};

laterModule.help = function() {
	return ['This module allows you to leave a message for someone. When they show up, I\'ll deliver it via PM.',
			'Use it like this: !later <recipient> <message>',
			'You can PM me the !later or just say it in any room I\'m in.'];
};

module.exports = laterModule;
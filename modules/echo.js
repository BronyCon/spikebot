var Module = require('./module.js');

var echoListener = function(to, nick, text, raw) {
		if(text === '!echo') {
			this.bot.reply(to, nick, 'The magic word is ' + this.config.reply + '.');
		}
	};

var echoModule = new Module({
	message: [echoListener]
});

echoModule.help = function() {
	return ['This module is meant to help with reload testing.',
			'Use it like this: !echo'];
};

module.exports = echoModule;
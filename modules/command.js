var Module = require('./module.js');

var pmListener = function(from, text) {
		if(text.startsWith('!') && this.bot.auth.isUserAuthenticated(from)) {
			var tokens = text.split(' ');
			switch(tokens[0]) {
				case '!join':
					tokens[1].startsWith('#') && this.bot.join(tokens[1] + (tokens.length > 2 ? ' ' + tokens[2] : ''));
					break;
				case '!part':
					tokens[1].startsWith('#') && this.bot.part(tokens[1]);
					break;
				case '!say':
					tokens[1].startsWith('#') && this.bot.say(tokens[1], tokens.slice(2).join(' '));
					break;
				case '!me':
					tokens[1].startsWith('#') && this.bot.action(tokens[1], tokens.slice(2).join(' '));
					break;
				case '!quit':
					this.bot.disconnect('My precious Rarity needs me!');
					break;
			}
		}
	};

var commandModule = new Module({
	pm: [pmListener]
});

commandModule.help = function() {
	return ['This module allows certain users to tell me what to do.',
			'Actions I can take include !join, !part, !say, !me, and !quit.'];
};

module.exports = commandModule;
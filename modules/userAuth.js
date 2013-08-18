var util = require('util'),
	extend = require('extend'),
	Module = require('./module.js');

var _authedUsers = {}; 

var authenticateListener = function(nick, text) {
	if(text.startsWith('!auth ')) {
		var givenPassword = text.substr('!auth '.length);

		if(this._authenticateUser(nick, givenPassword) || this._isAuthenticated(nick)) {
			this.bot.say(nick, 'You have been authenticated.');
		} // probably best to stay silent if it didn't work
	}
};

var checkAuth = function(nick, text) {
	if(text.startsWith('!auth-check')) {
		var a = this._isAuthenticated(nick);
		this.bot.say(nick, 'You are ' + (a ? '' : 'not') + ' authenticated' + (a ? ' at ' + _authedUsers[nick].toString() + ' ' : '') + '.');
	}
};

var userAuthModule = new Module({
	'pm': [authenticateListener, checkAuth]
});

extend(userAuthModule, {
	load: function(name, config, bot) {
		config.timeout = config.timeout || 86400;

		this.__proto__.load.apply(this, arguments);

		bot.auth = {
			isUserAuthenticated: this._isAuthenticated.bind(this)
		};
	},
	help: function() {
		return ['userAuth authenticates nicks against a password.',
				'This helps other modules know who can use higher-level commands.'];
	},
	_authenticateUser: function(nick, password) {
		if(password === this.config.password) {
			_authedUsers[nick] = new Date();
			return true;
		}

		return false;
	},
	_isAuthenticated: function(nick) {
		return _authedUsers[nick] && (Date.now() - _authedUsers[nick].getTime() <= this.config.timeout);
	}
});

module.exports = userAuthModule;
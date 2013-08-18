var util = require('util'),
	store = require('json-store');

var supportedEvents = ['join', 'part', 'quit', 'names', 'nick', 'topic', 'message', 'message#', 'pm'];

/*
 * Creates an IRC module
 *
 * config is an object in the IRC bot's config file keyed to the module name.
 *
 * listeners is an object whose keys are event names and whose values are arrays
 * of event listener functions. `this` in the listener will be the module.
 * Currently supported events include:
 *
 * - join: function(channel, nick, raw)
 *   When a user joins a channel the bot is in.
 *
 * - part: function(channel, nick, reason, raw)
 *   When a user parts a channel the bot is in.
 *
 * - quit: function(nick, reason, channels, raw)
 *   When a user quits IRC entirely.
 *
 * - names: function(channel, names)
 *   When the bot recieves the list of nicks in the channel.
 *
 * - nick: function(oldNick, newNick, channels, raw)
 *   When a user changes nicks.
 *
 * - topic: function(channel, topic, nick, raw)
 *   When the topic in a channel the bot is in changes.
 *
 * - message: function(nick, to, text, raw)
 *   When there is a message in a channel the bot is on or the bot receives a PM.
 *
 * - message#: function(nick, to, text, raw)
 *   When there is a message in a channel the bot is in.
 *
 * - pm: function(nick, text, raw)
 *   When the bot receives a PM.
 *
 * For more details see https://node-irc.readthedocs.org/en/latest/API.html#events.
 */
var Module = function(listeners) {
	var self = this;
	supportedEvents.forEach(function(ev) {
		if(listeners[ev]) {
			for(var i = 0; i < listeners[ev].length; ++i) {
				listeners[ev][i] = listeners[ev][i].bind(self);
			}
		}
	});

	this.listeners = listeners;
};

Module.prototype = {
	load: function(name, config, bot) {
		this.name = name;
		this.config = config;
		if(this.config.store) {
			this.store = store(__dirname + '/../store/' + name + '.json');
		}
		this.bot = bot;

		var self = this;
		// for each event we support...
		supportedEvents.forEach(function(ev) {
			// ...if we have listeners for it...
			if(util.isArray(self.listeners[ev])) {
				// ...attach those listeners.
				self.listeners[ev].forEach(function(listener) {
					bot.addListener(ev, listener);
				});
			}
		});
	},
	unload: function() {
		delete this.bot;
		delete this.config;
		delete this.store;
		delete this.name;

		var self = this;
		// for each event we support...
		supportedEvents.forEach(function(ev) {
			// ...if we have listeners for it...
			if(util.isArray(self.listeners[ev])) {
				// ...remove those listeners.
				self.listeners[ev].forEach(function(listener) {
					bot.removeListener(ev, listener);
				});
			}
		});
	}
};

module.exports = Module;
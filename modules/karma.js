var extend = require('extend'),
	Module = require('./module.js');

var _getSubject = function(str) {
	str = str.trim();
	if(str[0] === '(' && str[str.length - 1] === ')') {
		str = str.substring(1, str.length - 1);
	}
	return str.toLowerCase();
	},
	_getReason = function(str, giver) {
		if(! str) {
			return '';
		}

		str = str.trim();
		if(str.startsWith('#')) {
			return str.substr(1).trim() + ' (' + giver + ')';
		} else if(str.startsWith('//')) {
			return str.substr(2).trim() + ' (' + giver + ')';
		} else {
			return '';
		}
	},
	_selectReasons = function(reasons, limit) {
		var selected = [];

		while(selected.length < reasons.length && selected.length < limit) {
			var index = Math.floor(Math.random() * reasons.length);
			if(selected.indexOf(reasons[index]) < 0) {
				selected.push(reasons[index]);
			}
		}

		return selected;
	};

var karmaAdjustRegexp = /^(\([^)]+\)|[^ ]+)([+]{2}|[-]{2})(.*)?$/,
	listenForAdjust = function(nick, to, text, raw) {
		// Making it do a regex on every single message is costly...
		if(text.indexOf('++') < 0 && text.indexOf('--') < 0) {
			return;
		}

		var result = karmaAdjustRegexp.exec(text);
		if(!result) {
			console.log('failed!');
			return;
		}

		// parse the message
		var subject = _getSubject(result[1]),
			amount = result[2] == '--' ? -1 : 1,
			reason = _getReason(result[3], raw.nick);

		// don't allow self-promotion
		if(subject === raw.nick.toLowerCase() && amount > 0) {
			this.bot.reply(nick, to, 'Nice try, ' + raw.nick + '.');
			return;
		}

		this.adjust(subject, amount, reason);
		
		// reply with the new karma value
		this.bot.reply(nick, to, 'Karma for ' + subject + ' is now ' + _karma[subject].value + '.');
		if(subject === this.bot.config.nick.toLowerCase()) {
			this.bot.reply(nick, to, amount > 0 ? 'Thanks, ' + raw.nick + '!' : 'Pfft.');
		}
	},
	karmaSetRegexp = /^!karma-set\s+(\([^)]+\)|[^ ]+)\s+(\d+)(.*)?$/,
	listenForSet = function(from, text, raw) {
		if(! this.bot.auth.isUserAuthenticated(from)) {
			return;
		}

		if(! text.startsWith('!karma-set ')) {
			return;
		}

		var result = karmaSetRegexp.exec(text);
		if(! result) {
			return;
		}

		// parse the message
		var subject = _getSubject(result[1]),
			value = parseInt(result[2], 10),
			reason = _getReason(result[3], raw.nick);

		this.set(subject, value, reason);

		// reply with the new karma value
		this.bot.say(from, 'Karma for ' + subject + ' has been set to ' + value + '.');
	},
	listenForReset = function(from, text) {
		if(! this.bot.auth.isUserAuthenticated(from)) {
			return;
		}

		if(! text.startsWith('!karma-reset ')) {
			return;
		}

		var subject = _getSubject(text.substr('!karma-reset '.length));

		if(_karma[subject]) {
			this.reset(subject);
			this.bot.say(from, 'Karma for ' + subject + ' has been reset.');
		} else {
			this.bot.say(from, 'There is no karma record for ' + subject + '.');
		}
	},
	listenForValue = function(nick, to, text) {
		if(! text.startsWith('!karma ')) {
			return;
		}

		var subject = _getSubject(text.substr('!karma '.length));
		if(_karma[subject]) {
			this.bot.reply(nick, to, subject + ' has ' + _karma[subject].value + ' karma.');
		} else {
			this.bot.reply(nick, to, 'No karma has ever been assigned to ' + subject + '.');
		}
	},
	listenForExplain = function(nick, to, text) {
		if(! text.startsWith('!explain ')) {
			return;
		}

		var subject = _getSubject(text.substr('!explain '.length));
		if(_karma[subject]) {
			var limit = this.config.explainReasons || 3;

			this.bot.reply(nick, to, subject + ' has ' + _karma[subject].value + ' karma. The highest it\'s ever been was ' + _karma[subject].highest + ' and the lowest it\'s ever been was ' + _karma[subject].lowest + '.');
			_karma[subject].positive.length && this.bot.reply(nick, to, 'Positive: ' + _selectReasons(_karma[subject].positive, limit).join('; '));
			_karma[subject].negative.length && this.bot.reply(nick, to, 'Negative: ' + _selectReasons(_karma[subject].negative, limit).join('; '));
			_karma[subject].set.length && this.bot.reply(nick, to, 'Set: ' + _selectReasons(_karma[subject].set, limit).join('; '));
		} else {
			this.bot.reply(nick, to, 'No karma has ever been assigned to ' + subject + '.');
		}
	};

var _karma,
	karmaModule = new Module({
		pm: [listenForSet, listenForReset],
		message: [listenForValue, listenForExplain],
		"message#": [listenForAdjust]
	});

karmaModule.load = function() {
	Object.getPrototypeOf(this).load.apply(this, arguments);

	_karma = this.store.get('karma');
	if(! _karma) {
		_karma = {};
		this.save();
	}
};

extend(karmaModule, {
	reset: function(subject, force) {
		var created = force && !_karma[subject];
		if(_karma[subject] || force) {
			_karma[subject] = {
				value: 0,
				highest: 0,
				lowest: 0,
				positive: [],
				negative: [],
				set: []
			};

			this.save();
		}
		return created;
	},
	adjust: function(subject, amount, reason) {
		// none of this adjusting by 0 stuff
		if(amount === 0) {
			return;
		}

		// empty string reason means no reason
		reason = reason || '';

		// make sure there is karma to change
		_karma[subject] || this.reset(subject, true);
		var k = _karma[subject];

		// make the appropriate changes
		k.value += amount;
		if(amount > 0) {
			k.highest = Math.max(k.value, k.highest);
			reason.length && k.positive.push(reason);
		} else {
			k.lowest = Math.min(k.value, k.lowest);
			reason.length && k.negative.push(reason);
		}

		// save to disk
		this.save();

		return k.value;
	},
	set: function(subject, value, reason) {
		// empty string reason means no reason
		reason = reason || '';

		// make sure there is karma to change
		_karma[subject] || this.reset(subject, true);
		var k = _karma[subject];

		// make the appropriate changes
		k.value = value;
		k.highest = Math.max(k.value, k.highest);
		k.lowest = Math.min(k.value, k.lowest);
		reason.length && k.set.push(reason);

		// save to disk
		this.save();

		return k.value;
	},
	save: function() {
		this.store.set('karma', _karma);
	},
	help: function() {
		return ['This module tracks karma, which is essentially useless internet points.',
				'Any time you ++ or -- something, I keep track of it. If you want to ++ or -- something with spaces, put parentheses around it.',
				'You can give a reason for the addition or deduction after the ++ or -- by prefacing the reason with # or //.',
				'Examples include: cats++ #they are awesome | keyboard-- | (canadian healthcare)++ | (maryland government websites)-- //you are confusing',
				'If you want to see how much karma something has, use !karma like this: !karma <subject>',
				'More information about something\'s karma is available with !explain: !explain <subject>',
				'Commands you must be authorized to use include !karma-set <subject> <value> and !karma-reset <subject>.'];
	}
});

module.exports = karmaModule;
	
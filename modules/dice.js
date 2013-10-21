var Module = require('./module.js');

var rollRegexp = /^!roll (\d+)d(\d+)([+-]\d+)?$/,
	listenForRoll = function(nick, to, text, raw) {
		if(! text.startsWith('!roll ')) {
			return;
		}

		var result = rollRegexp.exec(text);
		if(! result) {
			return;
		}

		var count = result[1],
			sides = result[2],
			type  = result[2],
			fudge = result[3];
	};
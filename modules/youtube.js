var Module = require('./module.js'),
	request = require('request'),
	util = require('util'),
	moment = require('moment'),
	numeral = require('numeral');

// This fix for displaying a duration from here: https://github.com/moment/moment/issues/463#issuecomment-16698903
moment.duration.fn.format = function (input) {
	var output = input;
	var milliseconds = this.asMilliseconds();
	var totalMilliseconds = 0;
	var replaceRegexps = {
		years: /Y(?!Y)/g,
		months: /M(?!M)/g,
		weeks: /W(?!W)/g,
		days: /D(?!D)/g,
		hours: /H(?!H)/g,
		minutes: /m(?!m)/g,
		seconds: /s(?!s)/g,
		milliseconds: /S(?!S)/g
	};
	var matchRegexps = {
		years: /Y/g,
		months: /M/g,
		weeks: /W/g,
		days: /D/g,
		hours: /H/g,
		minutes: /m/g,
		seconds: /s/g,
		milliseconds: /S/g
	};
	for (var r in replaceRegexps) {
		if (replaceRegexps[r].test(output)) {
			var as = 'as'+r.charAt(0).toUpperCase() + r.slice(1);
			var value = Math.floor(moment.duration(milliseconds - totalMilliseconds)[as]()).toString();
			var replacements = output.match(matchRegexps[r]).length - value.length;
			output = output.replace(replaceRegexps[r], value);

			while (replacements > 0 && replaceRegexps[r].test(output)) {
				output = output.replace(replaceRegexps[r], '0');
				replacements--;
			}
			output = output.replace(matchRegexps[r], '');

			var temp = {};
			temp[r] = value;
			totalMilliseconds += moment.duration(temp).asMilliseconds();
		}
	}
	return output;
};

function pick() {
	for (var i = 0; i < arguments.length; i++) {
		if (arguments[i]) {
			return arguments[i];
		}
	}
	
	return null;
}

var videoRegex = /(?:http(?:s)?:\/\/)?(?:www.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=([a-zA-Z0-9\-_]+)|v\/([a-zA-Z0-9\-_]+))|youtu.be\/([a-zA-Z0-9\-_]+))/i;
var messageListener = function(to, nick, text, raw) {
	var videoID = videoRegex.exec(text),
		bot = this.bot;
	
	if (videoID && videoID.length) {
		videoID.shift();
		videoID = pick.apply(null, videoID);
	}
	else {
		videoID = 0;
	}
	
	if(videoID) {
		request('https://gdata.youtube.com/feeds/api/videos/' + videoID + '?v=2&alt=json', function(error, response, body) {
			if (!error && response.statusCode == 200) {
				var videoInfo = JSON.parse(body).entry,
					duration = moment.duration(parseInt(videoInfo.media$group.yt$duration.seconds, 10), 'seconds').format('mm:ss'),
					publishDate = moment(videoInfo.published.$t).format('dddd, MMMM Do YYYY, h:mm:ss a'),
					views = (videoInfo.yt$statistics && videoInfo.yt$statistics.viewCount) || 0,
					likes = (videoInfo.yt$rating && videoInfo.yt$rating.numLikes) || 0,
					dislikes = (videoInfo.yt$rating && videoInfo.yt$rating.numDislikes) || 0;
					
				
				bot.reply(to, nick, util.format('%s - %s | Posted by %s on %s | %s views, %s likes, %s dislikes',
					videoInfo.title.$t,				// video title
					duration,
					videoInfo.author[0].name.$t,	// video artist name
					publishDate,
					numeral(views).format(','),
					numeral(likes).format(','),
					numeral(dislikes).format(',')
				));
			}
		});
	}
};

var youtubeModule = new Module({
	'message#': [messageListener]
});

youtubeModule.help = function() {
	return ['This module looks for youtube URLs in posts to channels and echoes information about the video.'];
};

module.exports = youtubeModule;
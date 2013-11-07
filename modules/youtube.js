var Module = require('./module.js'),
	request = require('request'),
	util = require('util'),
	moment = require('moment');

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
    }
    var matchRegexps = {
        years: /Y/g,
        months: /M/g,
        weeks: /W/g,
        days: /D/g,
        hours: /H/g,
        minutes: /m/g,
        seconds: /s/g,
        milliseconds: /S/g
    }
    for (var r in replaceRegexps) {
        if (replaceRegexps[r].test(output)) {
            var as = 'as'+r.charAt(0).toUpperCase() + r.slice(1);
            var value = new String(Math.floor(moment.duration(milliseconds - totalMilliseconds)[as]()));
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
}

var videoRegex = /(http(s)?:\/\/)?(www.)?youtube\.com\/watch\?v=(\w+)/,
	messageListener = function(to, nick, text, raw) {
    var videoID = videoRegex.exec(text),
      bot = this.bot;

    videoID = videoID && videoID.length ? videoID[videoID.length - 1] : 0;

    if(videoID) {
    	// https://gdata.youtube.com/feeds/api/videos/KUNF5RsnGJM?v=2&alt=json
    	request('https://gdata.youtube.com/feeds/api/videos/' + videoID + '?v=2&alt=json', function(error, response, body) {
	    	if (!error && response.statusCode == 200) {
		    	var videoInfo = JSON.parse(body).entry;
		    	
		    	var response = '%s - %s | Posted by %s on %s | %s views, %s likes, %s dislikes',
		    		videoTitle = videoInfo.title['$t'],
					videoDuration = moment.duration(parseInt(videoInfo['media$group']['yt$duration'].seconds, 10), 'seconds').format('mm:ss'),
					videoAuthor = videoInfo.author[0].name['$t'],
					videoPublishDate = moment(videoInfo.published['$t']).format('dddd, MMMM Do YYYY, h:mm:ss a'),
					videoViewCount = videoInfo['yt$statistics'].viewCount,
					videoLikeCount = videoInfo['yt$rating'].numLikes,
					videoDislikeCount = videoInfo['yt$rating'].numDislikes;
		    	
		    	bot.reply(to, nick, util.format(response, videoTitle, videoDuration, videoAuthor, videoPublishDate, videoViewCount, videoLikeCount, videoDislikeCount));
	    	}
    	});
    }
};

var youtubeModule = new Module({
  'message#': [messageListener]
});

youtubeModule.help = function() {
	return ['This module looks for youtube URLs in posts to channels and echoes information about the video.'];
}

module.exports = youtubeModule;
var Module = require('./module.js'),
  TwitterAPI = require('ntwitter'),
  util = require('util'),
  moment = require('moment');

var substrReplace = function(str, replacement, start, end) {
  return str.slice(0, start) + replacement + str.slice(end);
};

var tweetRegex = /(http(s)?:\/\/)?(www.)?twitter\.com\/(?:#!\/)?(\w+)\/status(es)?\/(\d+)/,
  messageListener = function(to, nick, text, raw) {
    var tweetID = tweetRegex.exec(text),
      bot = this.bot;

    tweetID = tweetID && tweetID.length ? tweetID[tweetID.length - 1] : 0;

    if(tweetID) {
      this.twitter.showStatus(tweetID, function(error, data) {
        if(!error) {
          var response = "@%s: \"%s\" at %s",
            text = data.text.replace(/\r?\n/g, ' '),
            createdAt = moment(data.created_at).format('llll');
          
          data.entities.urls.forEach(function(urlInfo) {
	        text = substrReplace(text, urlInfo.expanded_url, urlInfo.indices[0], urlInfo.indices[1]);
          });
          
          bot.reply(to, nick, util.format(response, data.user.screen_name, text, createdAt));
        }
      })
    }
};

var twitterModule = new Module({
  'message#': [messageListener]
});

twitterModule.load = function(name, config, bot) {
  var self = this;
  this.__proto__.load.apply(this, arguments);

  this.twitter = new TwitterAPI({
    consumer_key: this.config.consumer_key,
    consumer_secret: this.config.consumer_secret,
    access_token_key: this.config.access_token_key,
    access_token_secret: this.config.access_token_secret
  });

  this.twitter.verifyCredentials(function (error, data) {
    if(error) {
      console.error('ERROR: Unable to verify credentials:', error);
    }
  })
};

twitterModule.help = function() {
  return ["This module looks for twitter URLs in posts to channels and echoes the text of the corresponding tweet to the channel."];
};

module.exports = twitterModule;

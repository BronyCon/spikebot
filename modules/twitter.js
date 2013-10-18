var Module = require('./module.js'),
  TwitterAPI = require('ntwitter'),
  util = require('util'),
  moment = require('moment');

var twitterConfig = {
    consumer_key: '',
    consumer_secret: '',
    access_token_key: '',
    access_token_secret: ''
  },
  tweetRegex = /(http(s)?:\/\/)?(www.)?twitter\.com\/(?:#!\/)?(\w+)\/status(es)?\/(\d+)/,
  messageListener = function(to, nick, text, raw) {
    var tweetID = tweetRegex.exec(text),
      bot = this.bot;

    tweetID = tweetID && tweetID.length ? tweetID[tweetID.length - 1] : 0;

    if(tweetID) {
      this.twitter.showStatus(tweetID, function(error, data) {
        var response = "@%s: \"%s\" at %s",
          text = data.text.replace(/\r?\n/g, ' '),
          createdAt = moment(data.created_at).format('llll');
        if(!error) {
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

  this.twitter = new TwitterAPI(twitterConfig);

  this.twitter.verifyCredentials(function (error, data) {
    if(error) {
      console.error('ERROR: Unable to verify credentials:', error);
    }
  })
};

module.exports = twitterModule;
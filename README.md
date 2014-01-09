# SpikeBot
Your Number-One Assistant Bot!

SpikeBot is an IRC bot built for the BronyCon IRC channels. He tracks karma, delivers messages to people, fetches tweets, and does all kinds of other useful things.

He doesn't have the best architecture, but he tries, you know?

## Installing SpikeBot
Installing SpikeBot is pretty easy!

First, clone the repo.

```
$ git clone https://github.com/BronyCon/spikebot.git
```

Then, copy config.js.example to config.js and modify its settings.

```
$ cd spikebot
$ cp config.js.example config.js
$ $EDITOR config.js
```

Then, start spikebot.js!

```
$ node .
```

> You may find it more resilient to instead start SpikeBot using `$ cd .. ; nohup node spikebot &`.

## config.js
There are a bunch of fields in config.js. Here are the ones you need to know and worry about:

* server: the IRC server to connect to
* nick: the nick for SpikeBot to use on that IRC server
* password: the NickServ password for SpikeBot
* userName: SpikeBot's IRC username
* realName: SpikeBot's IRC realname
* sendErrors: a nick to PM errors to, if non-fatal
* channels: an array of channel names to join on connect (don't forget the #!)


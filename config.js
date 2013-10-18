module.exports = {
	server: '',
	nick: '',
	password: '',
	userName: '',
	realName: '',
	debug: false,
	stripColors: true,
	sendErrors: 'dispatchrabbi',
	channels: [],
	modules: [
		{
			name: 'userAuth',
			config: {
				password: '',
				timeout: 4 * 60 * 60 * 1000
			}
		},
		{
			name: 'command'
		},
		{
			name: 'karma',
			config: {
				store: true,
				limit: 3
			}
		},
		{
			name: 'seen',
			config: {
				store: true
			}
		},
		{
			name: 'later',
			config: {
				store: true
			}
		},
		{
			name: 'twitter',
			config: {
				store: false
			}
		}
	]
};
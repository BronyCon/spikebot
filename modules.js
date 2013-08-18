var util = require('util');

var _modules = {},
	_loadModule = function(moduleInfo, bot) {
		var name = moduleInfo.name,
			path = moduleInfo.path || './modules/' + name + '.js',
			mod = require(path);

		// if this module is already loaded...
		if(mod === _modules[name]) {
			// ...our job is done.
			return;
		}

		// this is helpful when reloading a module
		_unloadModule(name);

		_modules[name] = mod;
		mod.load(name, moduleInfo.config || {}, bot);
		console.log('Loaded module ' + name + ' from ' + path + '.');
	},
	_unloadModule = function(name) {
		if(_modules[name]) {
			_modules[name].unload();
			delete _modules[name];
			console.log('Unloaded module ' + name + '.');
		}
	};

module.exports = {
	loadModules: function(modules) {
		if(! modules) {
			modules = this.config.modules;
		}

		if(! util.isArray(modules)) {
			modules = [modules];
		}

		for(var i = 0; i < modules.length; ++i) {
			_loadModule(modules[i], this);
		}
	},
	unloadModules: function(moduleNames) {
		if(! moduleNames) {
			moduleNames = this.config.modules.map(function(config) { return config.name; });
		}

		if(! util.isArray(moduleNames)) {
			moduleNames = [moduleNames];
		}

		for(var i = 0; i < moduleNames.length; ++i) {
			_unloadModule(moduleNames[i]);
		}
	},
	isModuleLoaded: function(moduleName) {
		return _modules[moduleName] !== undefined;
	},
	listModules: function() {
		return Object.keys(_modules);
	},
	moduleHelp: function(moduleName) {
		if(this.isModuleLoaded(moduleName)) {
			return _modules[moduleName].help() || [moduleName + ' appears not to have any help.', 'You should bug its developer.'];
		} else {
			return ['I don\'t know of any module called ' + moduleName + '.'];
		}
	}
};
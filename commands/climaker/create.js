var fs = require('fs');
var npm = require('npm');
var path = require('path');
var maker = require('../../lib/');
var async = require('async');
var chalk = require('chalk');

var packageInfo = require('../../package.json');

exports.describe = {
	en: 'Create a new command-line tool project',
	ja: '新しいコマンドラインツッルプロジェクトを作成する'
};

exports.params = [{
	name: 'name',
	demand: 'true',
	describe: {
		en: 'The name of your new project. By default, the main CLI will be named after this new project\'s name.',
		ja: ''
	}
}];

function onCompleted(error) {
	if (error) {
		// Todo: cleanup?
		console.log(chalk.red.bold('✗'), 'Creation failed:', error.message || error);
	} else {
		console.log(chalk.green.bold('✔'), 'New project successfully created:', name);
	}

	callback(null, error ? 1 : 0);
}

exports.execute = function (options, name, callback) {
	try {
		fs.mkdirSync(name);

		process.chdir(name);
		fs.mkdirSync('node_modules');
	} catch (error) {
		return onCompleted(error);
	}

	async.series([
		function (callback) {
			npm.load({
				loaded: false
			}, callback);
		},
		function (callback) {
			npm.on("log", function (message) {
				console.log(message);
			});

			npm.commands.init([], callback);
		},
		function (callback) {
			npm.config.set('save', 'true');
			var cliPackages = [];

			if (process.env.CLIMAKER_DEVELOP) {
				cliPackages.push(path.join(__dirname, '..', '..'));
			} else {
				cliPackages.push('climaker@' + packageInfo.version);
			}

			npm.commands.install(cliPackages, callback);
		},
		function (callback) {
			// Read project name and description from package.json,
			// add binary to package.json. Then, create the base command
			fs.mkdirSync('bin');
			maker.createBinary(name);
			fs.mkdirSync('commands');

			var binaryCommandsPath = path.join('commands', name);
			fs.mkdirSync(binaryCommandsPath);
			maker.copy('subcommand-index.js', path.join(binaryCommandsPath, 'index.js'))
		}
	], onCompleted);
};

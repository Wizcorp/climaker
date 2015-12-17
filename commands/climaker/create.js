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

function rmdir(dir) {
	var list = fs.readdirSync(dir);

	for(var i = 0; i < list.length; i++) {
		var filename = path.join(dir, list[i]);
		var stat = fs.statSync(filename);

		if(filename == "." || filename == "..") {
			continue;
		} else if(stat.isDirectory()) {
			rmdir(filename);
		} else {
			fs.unlinkSync(filename);
		}
	}

	fs.rmdirSync(dir);
}

var projectName;

function onCompleted(error, callback, deleteFolder) {
	deleteFolder = deleteFolder === undefined ? true : deleteFolder;

	if (error) {
		deleteFolder && rmdir(projectName);
		console.log(chalk.red.bold('✗'), 'Creation failed:', error.message || error);
	} else {
		console.log(chalk.green.bold('✔'), 'New project successfully created:', projectName);
	}

	callback(null, error ? 1 : 0);
}

function onInterrupt() {
	process.chdir('..');
	rmdir(projectName);
	console.log(chalk.yellow.bold('✗'), 'Creation aborted')
	process.exit(0);
}

process.on('SIGINT', onInterrupt);
process.on('SIGTERM', onInterrupt);

process.on('uncaughtException', function (error) {
	process.chdir('..');
	rmdir(projectName);
	console.log(chalk.yellow.bold('✗'), 'Creation failed:', error.message || error);
	process.exit(1);
});

exports.execute = function (options, name, callback) {

	projectName = name;

	try {
		fs.mkdirSync(name);
		process.chdir(name);
		fs.mkdirSync('node_modules');
	} catch (error) {
		return onCompleted(error, callback, false);
	}

	async.series([
		function (callback) {
			npm.load({
				loaded: false
			}, callback);
		}, function (callback) {
			npm.on('log', function (message) {
				console.log(message);
			});

			npm.commands.init([], callback);
		}, function (callback) {
			npm.config.set('save', 'true');
			var cliPackages = [];

			if (process.env.CLIMAKER_DEVELOP) {
				cliPackages.push(path.join(__dirname, '..', '..'));
			} else {
				cliPackages.push('climaker@' + packageInfo.version);
			}

			npm.commands.install(cliPackages, callback);
		}, function (callback) {
			var packageInfo = require(path.join(process.cwd(), 'package.json'));
			var name = packageInfo.name;
			var description = packageInfo.description;

			fs.mkdirSync('bin');
			fs.mkdirSync('commands');
			maker.createBinary(name, packageInfo.description);

			callback();
		}
	], function (error) {
		onCompleted(error, callback)
	});
};

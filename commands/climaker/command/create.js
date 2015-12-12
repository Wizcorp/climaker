var chalk = require('chalk');
var maker = require('../../../lib/');
var packageInfo = require('package.json');

exports.describe = {
	en: 'Add a command or subcommand to your project.',
	ja: '本プロジェクトに新しいコマンドかサブコマンドを追加する。'
};

exports.unnamedParams = {
	name: 'command',
	describe: {
		en: 'Commands/subcommands path'
	},
	allow: true,
	demand: true
};

exports.options = {
	b: {
		alias: 'binary',
		default: packageInfo.name,
		describe: {
			en: 'What binary to add commands to.'
		}
	},
	p: {
		alias: 'parent',
		boolean: true,
		describe: {
			en: 'Will this command have subcommands?'
		}
	},
	d: {
		alias: 'description',
		describe: {
			en: 'The description of the command to create.'
		}
	}
};

exports.execute = function (options, callback) {
	var err = null;
	var binary = options.binary;
	var commandPath = options.unnamedParams;
	var desc = options.description || 'No description.';
	var isParent = options.parent;

	try {
		maker.createCommand(binary, commandPath, desc, isParent);
		console.log(
			chalk.green.bold('✔'),
			'New command successfully created:',
			binary,
			commandPath.join(' ')
		);
	} catch (error) {
		err = true
		console.log(chalk.red.bold('✗'), 'Creation failed:', error.message || error);
	} finally {
		callback(err);
	}
};

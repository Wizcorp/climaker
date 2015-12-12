var maker = require('../../../lib/');

var chalk = require('chalk');

exports.describe = {
	en: 'Add a binary to your project.',
	ja: 'プロジェクトに新しいバイナリーを追加する。'
};

exports.unnamedParams = {
	allow: false
};

exports.params = [{
	name: 'name',
	demand: 'true'
}];

exports.options = {
	d: {
		alias: 'description',
		describe: {
			en: 'The description to attach to the new binary'
		}
	}
};

exports.execute = function (options, name, callback) {
	var err = null;

	try {
		maker.createBinary(name, options.description || 'No description.');
		console.log(
			chalk.green.bold('✔'),
			'New binary successfully created:',
			binary,
			commandPath.join(' ')
		);
	} catch (error) {
		err = true
		console.log(chalk.red.bold('✗'), 'Creation failed:', error.message || error);
	} finally {
		callback(null, err ? 1 : 0);
	}
};

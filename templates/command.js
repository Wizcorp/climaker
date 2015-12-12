exports.describe = {
	// ja: '',
	en: '%DESCRIPTION%'
};

exports.unnamedParams = {
	name: '',
	describe: {
		en: ''
	},
	allow: false,
	demand: false
};

exports.params = [{
	name: 'name',
	describe: {
		en: ''
	},
	demand: true
}];

exports.options = {
	flagName: {} // See yargs documentation
};

exports.execute = function (options, name, callback) {
};

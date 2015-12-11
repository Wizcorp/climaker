var fs = require('fs');
var path = require('path');
var async = require('async');
var yargonaut = require('yargonaut');
var chalk = require('chalk');
var wordwrap = require('jp-wrap');
var yargs = require('yargs');
var stringWidth = require('string-width');

var Matcher = require('did-you-mean');
var matchers = [];

// Same as defaultfor yargs
var COLS_SIZE = Math.min(process.stdout.columns, 80);

var running = false;

yargonaut
	.style('blue')
	.style('yellow', 'required')
	.errorsStyle('red')
	.helpStyle('cyan');

function logVerbose () {
	if (process.env.DEBUG) {
		console.log.apply(console, arguments);
	}
}

var dict = {
};

function getFromDictionary(key) {
	var locale = yargs.locale();

	if (!dict[locale]) {
		try {
			dict[locale] = require('./locales/' + locale + '.json');
		} catch (error) {
			dict[locale] = require('./locales/en.json');
		}
	}

	return dict[locale][key] || key;
}

function suggest(argv) {
	var solutions = [];

	argv.forEach(function (arg, pos) {
		var matcher = matchers[pos];

		if (!matcher) {
			return;
		}

		var terms = matcher.list(arg);
		var solution = argv.slice(0);

		terms.forEach(function (term) {
			if (term.value === arg) {
				return;
			}

			solution.splice(pos, 1, chalk.yellow(term.value))
			var solutionStr = solution.join(' ');
			solutions.push(solutionStr);
		});
	});

	if (solutions.length > 0) {
		console.error('');
		console.error(chalk.cyan(getFromDictionary('Did you mean') + ':'));
		solutions.forEach(function (solution) {
			console.error(' ', solution);
		});
		console.error('');
	}
}

var hasBeenShown = false;

function showCommandNotFound(yargs, commandFragments) {
	if (hasBeenShown) {
		return;
	}

	hasBeenShown = true;

	var areEqual = true;
	var yargsArgv = yargs.argv._;
	yargsArgv.unshift(commandFragments[0]);

	if (yargsArgv.length !== commandFragments.length) {
		areEqual = false;
	} else {
		for (var pos = 0; pos < yargsArgv.length; pos += 1) {
			if (commandFragments[pos] !== yargsArgv[pos]) {
				areEqual = false;
				break;
			}
		}
	}

	var argv = process.argv.slice(0);
	argv.shift();
	argv.shift();
	argv.unshift(commandFragments[0]);

	yargs.showHelp();

	if (!areEqual) {
		console.error(chalk.red(getFromDictionary('Command not found') + ':', argv.join(' ')));
	}
	suggest(argv);
}

function onCompleted(error, exitCode) {
	exitCode = exitCode || error ? 1 : 0;

	if (error) {
		console.error(chalk.red(error.message || error));
		logVerbose('Error stack:');
		logVerbose(error.stack);
	}

	process.exit(exitCode);
}

function formatParamInfo(param, isRequired, maxWidth) {
	var requiredLabel = getFromDictionary('required');
	var optionalLabel = getFromDictionary('optional');

	var maxLabelWidth = Math.max(stringWidth(requiredLabel), stringWidth(optionalLabel)) + 2;

	var description = '  ';
	description += param.name;
	description += new Array(maxWidth - param.name.length + 1).join(' ');
	description += '  ';

	var wrap = wordwrap(COLS_SIZE - maxWidth - maxLabelWidth - 6);
	var describe = getCommandOrParamDescription(param);

	if (describe !== '') {
		describe = wrap(describe);
		describe = describe.split('\n');
		description += describe.shift();
	} else {
		describe = [];
	}


	var tag = '[';
	if (isRequired) {
		m = stringWidth(requiredLabel);
		tag += chalk.yellow(requiredLabel);
	} else {
		m = stringWidth(optionalLabel);
		tag += chalk.green(optionalLabel);
	}
	tag += ']';

	var paddingLength = COLS_SIZE - stringWidth(description) - stringWidth(tag);
	description += new Array(paddingLength + 1).join(' ');
	description += tag;

	describe.forEach(function (line) {
		description += '\n';
		description += (new Array(maxWidth + 5)).join(' ');
		description += line;
	});

	return {
		description: description,
		maxLabelWidth: maxLabelWidth
	};
}

function getCommandOrParamDescription(command) {
	var locale = yargs.locale();

	if (command.describe) {
		if (typeof command.describe === 'string') {
			return command.describe;
		} else if (command.describe[locale]) {
			return command.describe[locale];
		} else if (command.describe['en']) {
			return command.describe['en'];
		}
	}

	return '';
}

function setOptionDescription(option) {
	var locale = yargs.locale();

	if (option.describe && typeof option.describe !== 'string') {
		if (option.describe[locale]) {
			option.describe = option.describe[locale];
		} else if (option.describe['en']){
			option.describe = option.describe['en'];
		} else {
			option.describe = '';
		}
	}

	return option;
}

function maxWidth(table) {
	var width = 0;

	table.forEach(function (v) {
		width = Math.max(v.length, width);
	});

	return width;
}

function formatArgv(argv, commandFragments, command) {
	var params = argv._;
	delete argv._;

	commandFragments.shift();

	while (commandFragments.length > 0 && params[0] === commandFragments[0]) {
		params.shift();
		commandFragments.shift();
	}

	command.params.forEach(function (param, pos) {
		var isRequired = param.demand || false;

		if (params.length <= pos) {
			if (isRequired) {
				throw new Error('Missing required parameter: ' + param.name);
			}

			params.push(null);
		}
	});

	var unnamedParams = [];

	for (var paramsPos = params.length - 1; paramsPos >= command.params.length; paramsPos -= 1) {
		var val = params.splice(paramsPos, paramsPos + 1).pop();
		unnamedParams.unshift(val);
	}

	if (command.unnamedParams) {
		var allow = command.unnamedParams.allow;
		var demand = command.unnamedParams.demand;

		if (unnamedParams.length > 0 && (allow === false || allow < unnamedParams.length)) {
			if (allow !== false) {
				unnamedParams.splice(0, allow);
			}

			var message = 'Unknown parameter';
			message += unnamedParams.length > 1 ? 's' : '';
			message += ': ';
			message += unnamedParams;
			throw new Error(message);
		}

		if ((demand && unnamedParams.length === 0) || demand > unnamedParams.length) {
			var message = 'Missing required parameter(s)';
			if (command.unnamedParams.name) {
				message += ': ' + command.unnamedParams.name;
			}

			throw new Error(message);
		}
	}

	argv.unnamedParams = unnamedParams;
	params.unshift(argv);
	params.push(onCompleted);

	return params;
}

function load(commandFragments, commandPath, yargs) {
	var files = fs.readdirSync(commandPath);
	var matcher = new Matcher();

	files.forEach(function (file) {
		if (file === 'index.js') {
			return;
		}

		var command = require(path.join(commandPath, file));

		if (command.unnamedParams) {
			command.unnamedParams.allow = command.unnamedParams.allow || true;
		}

		matcher.add(file);

		if (file.substring(file.length - 3) !== '.js') {
			var localCommandFragments = commandFragments.slice(0);
			localCommandFragments.push(file);

			var localCommandPath = path.join(commandPath, file);

			var description = getCommandOrParamDescription(command);

			yargs = yargs.command(file, description, function (yargs) {
				load(localCommandFragments, localCommandPath, yargs);

			}).usage(description);

			return;
		}

		var commandName = file.substring(0, file.length - 3);
		var description = getCommandOrParamDescription(command);

		matcher.add(commandName);
		yargs = yargs.command(commandName, description, function (yargs) {
			var localCommandFragments = commandFragments.slice(0);
			localCommandFragments.push(commandName);
			var localCommandString = localCommandFragments.join(' ');

			var description = chalk.magenta.bold(localCommandString);
			description += chalk.cyan(' {options}');
			command.params = command.params || [];

			command.params.forEach(function (param) {
				var isRequired = param.demand;

				var effect;

				if (isRequired) {
					effect = chalk.yellow;
					name = '<' + param.name + '>';
				} else {
					effect = chalk.green;
					name = '[' + param.name + ']';
				}

				description += ' ' + effect(name);
			});

			if (command.unnamedParams && command.unnamedParams.allow) {
				var subDescription = ' [';
				subDescription += command.unnamedParams.name || '';
				subDescription += '...';

				if (typeof command.unnamedParams.demand === 'number') {
					subDescription += ' min:' + command.unnamedParams.demand;
				}

				if (typeof command.unnamedParams.allow === 'number') {
					subDescription += ' max:' + command.unnamedParams.allow;
				}

				subDescription += ']';

				if (command.unnamedParams.demand) {
					description += chalk.yellow(subDescription);
				} else {
					description += chalk.green(subDescription);
				}
			}

			description += '\n\n';
			description += getCommandOrParamDescription(command);

			var hasParams = command.params && command.params.length > 0;
			var hasUnnamedParams = command.unnamedParams && command.unnamedParams.allow;

			var maxParamsWidth = 0;

			if (hasParams || hasUnnamedParams) {
				if (hasParams) {
					var labels = command.params.map(function (param) {
						return param.name;
					});

					maxParamsWidth = maxWidth(labels);
				}

				if (hasUnnamedParams) {
					var name = command.unnamedParams.name;
					maxParamsWidth = Math.max(maxParamsWidth, name.length + 3);
				}

				description += '\n\n';
				description += chalk.cyan(getFromDictionary('Parameters') + ':');
				description += '\n';
			}

			if (hasParams) {
				command.params.forEach(function (param, pos) {
					var formatData = formatParamInfo(param, param.demand, maxParamsWidth);
					description += formatData.description;

					var lines = formatData.description.split('\n');

					console.log(lines.length && (pos !== command.params.length - 1 || hasUnnamedParams));

					if (pos !== command.params.length - 1 || hasUnnamedParams) {
						description += '\n';
					}
				});
			}

			if (hasUnnamedParams) {
				var param = command.unnamedParams;
				param.name += '...';

				var formatData = formatParamInfo(param, param.demand, maxParamsWidth);
				description += formatData.description;
			}

			yargs = yargs.usage(description);
			yargs = yargs.help('help').strict();

			if (command.options) {
				for (var key in command.options) {
					var val = command.options[key];
					yargs = yargs.option(key, setOptionDescription(val));
				}
			}

			yargs = yargs.help('help');

			running = true;

			try {
				var args = formatArgv(yargs.argv, localCommandFragments, command);
			} catch (error) {
				yargs.showHelp();
				onCompleted(error, 1);
			}

			try {
				command.execute.apply(command, args);
			} catch (error) {
				onCompleted(error, 1);
			}
		});
	});

	matchers.push(matcher);

	var command = require(commandPath);
	var description = chalk.magenta.bold(commandFragments.join(' '));

	description += chalk.yellow(' <command>');
	description += '\n\n';
	description += getCommandOrParamDescription(command);

	yargs = yargs.usage(description);
	yargs = yargs.help('help').strict();

	if (yargs.argv && !running) {
		showCommandNotFound(yargs, commandFragments);
	}
};

module.exports = function (name, version, path) {
	yargs = yargs.version(version);
	matchers.push(new Matcher(name));
	load([name], path, yargs);
};

var fs = require('fs');
var path = require('path');

exports.copy = function (source, replaces, dest) {
	var data = fs.readFileSync(path.join(__dirname, '..', 'templates', source));
	var script = data.toString('utf8');

	replaces = dest ? replaces : dest;

	for (var key in replaces) {
		var val = replaces[key];
		var regexp = new RegExp('%' + key + '%', 'g');
		script = script.replace(regexp, val);
	}

	fs.writeFileSync(dest, script);
};

exports.createBinary = function (name, description) {
	var packageInfo = require('package.json');

	[{
		src: 'binary',
		dest: name,
		executable: true
	}, {
		src: 'binary.cmd',
		dest: name + '.cmd'
	}, {
		src: 'binary-cli.js',
		dest: name + '-cli.js'
	}].forEach(function (copyInfo) {
		var data = fs.readFileSync(path.join(__dirname, '..', 'templates', copyInfo.src));
		var script = data.toString('utf8');
		var dest = path.join('bin', copyInfo.dest);

		exports.copy(copyInfo.src, {
			PROJECT_NAME: packageInfo.name,
			BINARY_NAME: name
		}, dest);

		if (copyInfo.executable) {
			fs.chmodSync(dest, 0755);
		}
	});

	// Update package.json
	packageInfo.bin = packageInfo.bin || {};
	packageInfo.bin[name] = './bin/' + name + '-cli.js';
	fs.writeFileSync('package.json', JSON.stringify(packageInfo, null, 2));

	var binaryCommandsPath = path.join('commands', name);
	fs.mkdirSync(binaryCommandsPath);

	exports.copy('subcommand-index.js', {
		DESCRIPTION: description
	}, path.join(binaryCommandsPath, 'index.js'));
};

exports.createCommand = function (binary, commandPath, desc, isParent) {
	var packageInfo = require('package.json');

	if (!binary) {
		binary = packageInfo.name;
	}

	if (!packageInfo.bin || !packageInfo.bin[binary]) {
		throw new Error('Could not create command, binary ' + binary + ' not found');
	}

	var len = commandPath.length;
	var subPath = path.join('commands', binary);

	commandPath.forEach(function (key, pos) {
		subPath = path.join(subPath, key);
		console.log(subPath)

		if (pos === len - 1 && !isParent) {
			var err = false;

			try {
				fs.statSync(subPath);
				err = true;
			} catch (error) {
				exports.copy('command.js', {
					DESCRIPTION:  desc || 'No description.'
				}, subPath + '.js');
			} finally {
				if (err) {
					throw new Error('Command already exists');
				}

				return;
			}
		}

		try {
			fs.statSync(subPath);
		} catch (error) {
			fs.mkdirSync(subPath);

			exports.copy('subcommand-index.js', {
				DESCRIPTION: pos === len - 1 ? desc : 'No description.'
			}, path.join(subPath, 'index.js'));
		}
	});
};

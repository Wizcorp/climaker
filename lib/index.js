var fs = require('fs');
var path = require('path');

exports.copy = function (source, dest) {
	var data = fs.readFileSync(path.join(__dirname, '..', 'templates', source));
	fs.writeFileSync(dest, data);
};

exports.createBinary = function (name) {
	var data = fs.readFileSync(path.join(__dirname, '..', 'templates', 'binary'));
	var script = data.toString('utf8');
	var dest = path.join('bin', name);

	script = script.replace(/%BINARY_NAME%/g, name);
	fs.writeFileSync(dest, script, { mode: 0755 });
};

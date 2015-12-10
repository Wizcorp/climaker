var fs = require('fs');
var npm = require('npm');
var path = require('path');
var maker = require('../../lib/');
var async = require('async');
var chalk = require('chalk');

exports.describe = {
	en: 'Add a binary to your project.',
	ja: 'プロジェクトに新しいバイナリーを追加する。'
};

exports.arguments = [{
	name: 'name',
	demand: 'true'
}];

exports.execute = function (options, name, callback) {
};

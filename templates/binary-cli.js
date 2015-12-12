#!/usr/bin/env node

var maker = require('climaker');
var path = require('path');
var packageInfo = require('../package.json');
var name = '%BINARY_NAME%';

maker(name, packageInfo.version, path.join(__dirname, '../commands/' + name));

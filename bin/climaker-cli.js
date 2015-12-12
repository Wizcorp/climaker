#!/usr/bin/env node

var maker = require('../index.js');
var path = require('path');
var packageInfo = require('../package.json');
var name = 'climaker';

maker(name, packageInfo.version, path.join(__dirname, '../commands/'+ name));

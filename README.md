climaker
========

This library is used for creating nice, clean and
consistent CLI UI tools in Node.js, with great speed.

## Features

* Automated help screen generation for all commands and subcommands
* Automated "Did you mean?" helper on command error
* Automated command-line parameters and argument validation
* Localization support for help content, with default fallback to English

## Todo

- [ ] Documentation in Japanese, French, and other languages
- [ ] Autocompletion script generation for Bash, ZSH and PowerShell
- [ ] Test suite
- [ ] Specification document (for writing commands)
- [ ] Health-check command: check that this project's binaries
      and commands are complying with how things are supposed to be structured
- [ ] Get feedback!

## How to use

The following commands will help you get set up:

```bash
npm install -i climaker

# Create a project with a single binary
climaker create rage-myCommand

# Add commands to the binary
climaker command create newCommand
climaker command create new subCommand

# Add a second binary
climaker binary create rage-mySecondCommand

# Add commands to the second binary
climaker command create --binary rage-mySecondCommand create newCommand
climaker command create --binary rage-mySecondCommand create new subCommand
```

## Manually creating commands

Under the `bin/` folder of your package, add a script with
the following content:

```javascript
#!/usr/bin/env node

var path = require('path');
var packageInfo = require('../package.json');

var maker = require('../../climaker');
var commandName = 'mytool'

maker(commandName, packageInfo.version, path.join(__dirname, '../commands'));
```

Then:

```javascript
chmod +755 bin/mytool
mkdir ./commands
```

And, finally, under `./commands/index.js`:

```javascript
exports.describe = {
	en: 'My sweet command line',
	fr: 'Ma commande de ligne sucrée (tee hee)'
};
```

And start coding! Add your commands in the `./commands` folder:

```javascript
// ./commands/create.js
exports.describe = {
	en: 'Create a new organization.',
	ja: '新しい組織を作成する。'
};

exports.unnamedParams = {
	name: 'something',
	describe: 'I no bother with localize',
	allow: true, // or int for how many to allow, or false if you want to be strict
	demand: true // required, set up a count, or false to make optional
};

exports.params = [{
	name: 'name',
	demand: true,
	describe: {
		en: 'Name',
		ja: '名前です'
	}
}];

// See https://www.npmjs.com/package/yargs#option-key-opt
exports.options = {
	d: {
		alias: 'dest',
		demand: true
	},
	f: {
		alias: 'force',
		describe: 'Force create',
		boolean: true
	}
};

// Options will contain all your options as well as
// unnamed parameters
exports.execute = function (options, name, callback) {
	console.log('HERE IS YOUR NEW ORG');
	callback();
};
```

You can create sub-folders as well: they will become nested commands.
However, you must make sure to put an `index.js` script with the description
of this nested command's subcommand.

For instance, to create the command:

```bash
mytool module create myModule --lang=csharp
```

You would need to create the folder `./commands/module`,
add a description for the module subcommand in `./commands/module/index.js`,
and the nested command itself in `./commands/module/create.js`.

## License

MIT.

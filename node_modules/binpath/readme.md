# binpath
[![Build Status](https://travis-ci.org/metaraine/binpath.svg?branch=master)](https://travis-ci.org/metaraine/binpath)
[![NPM version](https://badge.fury.io/js/binpath.svg)](http://badge.fury.io/js/binpath)

> Returns the executable path of a local npm module.


## Install

```sh
$ npm install --save binpath
```


## Usage

```js
var binpath = require('binpath');
console.log( binpath('mocha') ); // '/PROJECT_DIR/node_modules/mocha/bin/mocha');
```


## License

MIT © [Raine Lourie](https://github.com/metaraine)

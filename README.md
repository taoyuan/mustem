# mustem [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-image]][daviddm-url] [![Coverage percentage][coveralls-image]][coveralls-url]

[![Greenkeeper badge](https://badges.greenkeeper.io/taoyuan/mustem.svg)](https://greenkeeper.io/)

> A template engine based on mustache and bluebird used for rendering a buffer

## Installation

```sh
$ npm install --save mustem
```

## Usage

Most usage could refer to [mustache.js](https://github.com/janl/mustache.js)

### Promise support

```js
var P = require('bluebird');

var mustem = require('../');
mustem.render('3+5={{#add}}[3,5]{{/add}}', {
  add: function (a, b) {
    return new P(function (resolve) {
      setTimeout(function () {
        resolve(a + b);
      }, 100);
    })
  }
}).then(function (result) {
  console.log(result); // 3+5=8
});
```

### Custom view for writing result to a custom buffer

We can write binary buffer by writing result to a custom buffer. 

```js
var mustem = require('../');

function CustomView() {
  this.buffer = [];
  this.text = function (text) {
    this.buffer.push(text);
  };
  this.write = function (i) {
    this.buffer.push(i);
  };
}

var view = new CustomView();

mustem.render('The number is:{{#write}}1{{/write}}', view).then(function (result) {
  console.log(view.buffer);
});
```

__ATTENTION: [Functions](https://github.com/janl/mustache.js#functions) is not supported!!!__

## License

MIT © [taoyuan]()


[npm-image]: https://badge.fury.io/js/mustem.svg
[npm-url]: https://npmjs.org/package/mustem
[travis-image]: https://travis-ci.org/taoyuan/mustem.svg?branch=master
[travis-url]: https://travis-ci.org/taoyuan/mustem
[daviddm-image]: https://david-dm.org/taoyuan/mustem.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/taoyuan/mustem
[coveralls-image]: https://coveralls.io/repos/taoyuan/mustem/badge.svg
[coveralls-url]: https://coveralls.io/r/taoyuan/mustem

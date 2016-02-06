'use strict';

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

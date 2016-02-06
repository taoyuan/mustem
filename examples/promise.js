'use strict';

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
  console.log(result);
});

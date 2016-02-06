var t = require('chai').assert;
var P = require('bluebird');
var Renderer = require('../').Renderer;

var view = {
  "name": {
    "first": "Michael",
    "last": "Jackson"
  },
  "age": "RIP",
  calc: function () {
    return 2 + 4;
  },
  delayed: function () {
    return new P(function (resolve) {
      setTimeout(resolve.bind(undefined, 'foo'), 100);
    });
  }
};

describe('Renderer', function () {

  describe('Basics features', function () {
    it('should render properties', function (done) {
      var renderer = new Renderer();
      renderer.render('Hello {{name.first}} {{name.last}}', {
        "name": {
          "first": "Michael",
          "last": "Jackson"
        }
      }).then(function (result) {
        t.equal(result, 'Hello Michael Jackson');
        done();
      })
    });

    it('should render variables', function (done) {
      var renderer = new Renderer();
      renderer.render('* {{name}} * {{age}} * {{company}} * {{{company}}} * {{&company}}{{=<% %>=}} * {{company}}<%={{ }}=%>', {
        "name": "Chris",
        "company": "<b>GitHub</b>"
      }).then(function (result) {
        t.equal(result, '* Chris *  * &lt;b&gt;GitHub&lt;&#x2F;b&gt; * <b>GitHub</b> * <b>GitHub</b> * {{company}}');
        done();
      })
    });

    it('should render variables with dot notation', function (done) {
      var renderer = new Renderer();
      renderer.render('{{name.first}} {{name.last}} {{age}}', {
        "name": {
          "first": "Michael",
          "last": "Jackson"
        },
        "age": "RIP"
      }).then(function (result) {
        t.equal(result, 'Michael Jackson RIP');
        done();
      })
    });

    it('should render sections with false values or empty lists', function (done) {
      var renderer = new Renderer();
      renderer.render('Shown. {{#person}}Never shown!{{/person}}', {
        "person": false
      }).then(function (result) {
        t.equal(result, 'Shown. ');
        done();
      })
    });

    it('should render sections with non-empty lists', function (done) {
      var renderer = new Renderer();
      renderer.render('{{#stooges}}<b>{{name}}</b>{{/stooges}}', {
        "stooges": [
          {"name": "Moe"},
          {"name": "Larry"},
          {"name": "Curly"}
        ]
      }).then(function (result) {
        t.equal(result, '<b>Moe</b><b>Larry</b><b>Curly</b>');
        done();
      })
    });

    it('should render sections using . for array of strings', function (done) {
      var renderer = new Renderer();
      renderer.render('{{#musketeers}}* {{.}}{{/musketeers}}', {
        "musketeers": ["Athos", "Aramis", "Porthos", "D'Artagnan"]
      }).then(function (result) {
        t.equal(result, '* Athos* Aramis* Porthos* D&#39;Artagnan');
        done();
      })
    });

    it('should render function', function (done) {
      var renderer = new Renderer();
      renderer.render('{{title}} spends {{calc}}', {
        title: "Joe",
        calc: function () {
          return 2 + 4;
        }
      }).then(function (result) {
        t.equal(result, 'Joe spends 6');
        done();
      })
    });

    it('should render function with variable as context', function (done) {
      var renderer = new Renderer();
      renderer.render('{{#beatles}}* {{name}} {{/beatles}}', {
        "beatles": [
          {"firstName": "John", "lastName": "Lennon"},
          {"firstName": "Paul", "lastName": "McCartney"},
          {"firstName": "George", "lastName": "Harrison"},
          {"firstName": "Ringo", "lastName": "Starr"}
        ],
        "name": function () {
          return this.firstName + " " + this.lastName;
        }
      }).then(function (result) {
        t.equal(result, '* John Lennon * Paul McCartney * George Harrison * Ringo Starr ');
        done();
      })
    });

    it('should render inverted sections', function (done) {
      var renderer = new Renderer();
      renderer.render('{{#repos}}<b>{{name}}</b>{{/repos}}{{^repos}}No repos :({{/repos}}', {
        "repos": []
      }).then(function (result) {
        t.equal(result, 'No repos :(');
        done();
      })
    });

    it('should render ignore comments', function (done) {
      var renderer = new Renderer();
      renderer.render('Today{{! ignore me }}.').then(function (result) {
        t.equal(result, 'Today.');
        done();
      })
    });

    it('should render partials', function (done) {
      var renderer = new Renderer();
      renderer.render('{{#names}}{{> user}}{{/names}}', {
        names: [{
          name: 'Athos'
        }, {
          name: 'Porthos'
        }]
      }, {
        user: 'Hello {{name}}.'
      }).then(function (result) {
        t.equal(result, 'Hello Athos.Hello Porthos.');
        done();
      })
    });
  });

  describe('Promise functions', function () {
    it('should render with promise functions', function (done) {
      var renderer = new Renderer();
      renderer.render('3+5={{#add}}[3,5]{{/add}}', {
        add: function (a, b) {
          return new P(function (resolve) {
            setTimeout(function () {
              resolve(a + b);
            }, 100);
          })
        }
      }).then(function (result) {
        t.equal(result, '3+5=8');
        done();
      });
    });
  });

  describe('Custom view', function () {
    function View() {
      this.buffer = [];
      this.text = function (text) {
        this.buffer.push(text);
        return this;
      };
      this.write = function (i) {
        this.buffer.push(i);
        return this;
      };
    }


    it('should render with custom view', function (done) {
      var view = new View();

      var renderer = new Renderer();
      renderer.render('The number is:{{#write}}1{{/write}}', view).then(function (result) {
        t.notOk(result);
        t.deepEqual(view.buffer, ['The number is:', 1]);
        done();
      })
    });
  });
})
;

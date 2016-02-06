'use strict';

var _ = require('lodash');
var P = require('bluebird');
var json5 = require('json5');
var mustache = require('mustache');
var Context = require('./context');

var defaultWriter = new mustache.Writer();

module.exports = Renderer;

/**
 *
 * @returns {Renderer}
 * @constructor
 */
function Renderer() {
  if (!(this instanceof Renderer)) {
    return new Renderer();
  }
}

Renderer.prototype.clearCache = function () {
  return defaultWriter.clearCache();
};

Renderer.prototype.parse = function (template, tags) {
  return defaultWriter.parse(template, tags);
};

Renderer.prototype.render = function (template, view, partials) {
  var that = this;
  try {
    var tokens = defaultWriter.parse(template);
    var context = (view instanceof Context) ? view : new Context(view);
    return that.renderTokens(tokens, context, partials, template);
  } catch (e) {
    return P.reject(e);
  }
};

Renderer.prototype.renderTokens = function (tokens, context, partials, originalTemplate) {
  var that = this;
  var symbol;

  return P.each(tokens, function (token) {
    symbol = token[0];

    if (symbol === '#') return that.renderSection(token, context, partials, originalTemplate);
    else if (symbol === '^') return that.renderInverted(token, context, partials, originalTemplate);
    else if (symbol === '>') return that.renderPartial(token, context, partials, originalTemplate);
    else if (symbol === '&') return that.unescapedValue(token, context);
    else if (symbol === 'name') return that.escapedValue(token, context);
    else if (symbol === 'text') return that.rawValue(token, context);
  }).then(function () {
    return context.value;
  });
};

Renderer.prototype.renderSection = function renderSection(token, context, partials, originalTemplate) {
  var that = this;
  var value = context.lookup(token[1]);

  // This function is used to render an arbitrary template
  // in the current context by higher-order sections.
  function subRender(template) {
    return that.render(template, context, partials);
  }

  if (!value) return;

  if (_.isArray(value)) {
    return P.each(value, function (item) {
      return that.renderTokens(token[4], context.push(item), partials, originalTemplate);
    });
  } else if (typeof value === 'object' || typeof value === 'string' || typeof value === 'number') {
    return this.renderTokens(token[4], context.push(value), partials, originalTemplate);
  } else if (_.isFunction(value)) {
    if (typeof originalTemplate !== 'string')
      throw new Error('Cannot use higher-order sections without the original template');

    // Extract the portion of the original template that the section contains.
    //value.call(context.view, originalTemplate.slice(token[3], token[5]), subRender);

    var args = originalTemplate.slice(token[3], token[5]);
    try {
      args = json5.parse(args);
    } catch (e) {
      // no-op
    }
    if (!_.isArray(args)) args = [args];
    value = value.apply(context.view, args);

    return P.resolve(value).then(function (value) {
      if (!_.isNull(value) && !_.isUndefined(value)) context.render(value);
      return value;
    })

  } else {
    return this.renderTokens(token[4], context, partials, originalTemplate);
  }
};

Renderer.prototype.renderInverted = function renderInverted (token, context, partials, originalTemplate) {
  var value = context.lookup(token[1]);

  // Use JavaScript's definition of falsy. Include empty arrays.
  // See https://github.com/janl/mustache.js/issues/186
  if (!value || (_.isArray(value) && value.length === 0))
    return this.renderTokens(token[4], context, partials, originalTemplate);
};

Renderer.prototype.renderPartial = function renderPartial (token, context, partials) {
  if (!partials) return;

  var that = this;
  var value = _.isFunction(partials) ? partials(token[1]) : partials[token[1]];
  if (value != null) {
    return P.resolve(value).then(function (value) {
      return that.renderTokens(defaultWriter.parse(value), context, partials, value);
    });
  }
};

Renderer.prototype.unescapedValue = function unescapedValue(token, context) {
  var that = this;
  var value = context.lookup(token[1], true);
  if (value != null)
    return P.resolve(value).then(function (value) {
      return that.rawValue(value, context);
    });
};

Renderer.prototype.escapedValue = function escapedValue(token, context) {
  var that = this;
  var value = context.lookup(token[1], true);
  if (value != null)
    return P.resolve(value).then(function (value) {
      if (_.isString(value) || _.isNumber(value)) {
        return that.rawValue(mustache.escape(value), context);
      }
    });
};

Renderer.prototype.rawValue = function (token, context) {
  var text = _.isArray(token) ? token[1]: token;
  return context.render(text);
};

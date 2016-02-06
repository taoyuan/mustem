'use strict';

var _ = require('lodash');
var P = require('bluebird');

module.exports = Context;

/**
 * Null safe way of checking whether or not an object,
 * including its prototype, has a given property
 */
function hasProperty (obj, propName) {
  return obj != null && typeof obj === 'object' && (propName in obj);
}

/**
 * Represents a rendering context by wrapping a view object and
 * maintaining a reference to the parent context.
 */
function Context(view, parentContext) {
  this.view = view;
  this.cache = {'.': this.view};
  this.parent = parentContext;
  this.value = '';
}

/**
 * Creates a new context using the given view with this context
 * as the parent.
 */
Context.prototype.push = function push(view) {
  return new Context(view, this);
};

/**
 * Returns the value of the given name in this context, traversing
 * up the context hierarchy if the value is absent in this context's view.
 */
Context.prototype.lookup = function lookup(name, execIfFunction) {
  var cache = this.cache;

  var value;
  if (cache.hasOwnProperty(name)) {
    value = cache[name];
  } else {
    var context = this, names, index, lookupHit = false;

    while (context) {
      if (name.indexOf('.') > 0) {
        value = context.view;
        names = name.split('.');
        index = 0;

        /**
         * Using the dot notion path in `name`, we descend through the
         * nested objects.
         *
         * To be certain that the lookup has been successful, we have to
         * check if the last object in the path actually has the property
         * we are looking for. We store the result in `lookupHit`.
         *
         * This is specially necessary for when the value has been set to
         * `undefined` and we want to avoid looking up parent contexts.
         **/
        while (value != null && index < names.length) {
          if (index === names.length - 1)
            lookupHit = hasProperty(value, names[index]);

          value = value[names[index++]];
        }
      } else {
        value = context.view[name];
        lookupHit = _.has(context.view, name);
      }

      if (lookupHit)
        break;

      context = context.parent;
    }

    cache[name] = value;
  }

  if (execIfFunction && _.isFunction(value)) {
    value = value.call(this.view);
  }

  return value;
};

Context.prototype.render = function (text) {
  if (this.view && this.view.text) {
    return this.view.text(text);
  } else if (this.parent) {
    return this.parent.render(text);
  } else {
    this.value += text;
    return P.resolve(this.value);
  }
};

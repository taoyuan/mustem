var mustache = require('mustache');
var Context = require('./context');
var Renderer = require('./renderer');

var mustem = exports = module.exports = {};

var pkg = require('../package.json');

mustem.name = pkg.name;
mustem.version = pkg.version;
mustem.tags = [ '{{', '}}' ];

// All high-level mustem.* functions use this writer.
var defaultRenderer = new Renderer();

/**
 * Clears all cached templates in the default writer.
 */
mustem.clearCache = function clearCache () {
  return defaultRenderer.clearCache();
};

/**
 * Parses and caches the given template in the default writer and returns the
 * array of tokens it contains. Doing this ahead of time avoids the need to
 * parse templates on the fly as they are rendered.
 */
mustem.parse = function parse (template, tags) {
  return defaultRenderer.parse(template, tags);
};

/**
 * Renders the `template` with the given `view` and `partials` using the
 * default writer.
 */
mustem.render = function render (template, view, partials) {
  if (typeof template !== 'string') {
    throw new TypeError('Invalid template! Template should be a "string" ' +
      'but "' + typeof template + '" was given as the first ' +
      'argument for mustem#render(template, view, partials)');
  }

  return defaultRenderer.render(template, view, partials);
};

// This is here for backwards compatibility with 0.4.x.,
/*eslint-disable */ // eslint wants camel cased function name
mustem.to_html = function to_html (template, view, partials, send) {
  /*eslint-enable*/

  var result = mustem.render(template, view, partials);

  if (isFunction(send)) {
    send(result);
  } else {
    return result;
  }
};

// Export the escaping function so that the user may override it.
// See https://github.com/janl/mustem.js/issues/244
mustem.escape = mustache.escape;

exports.Renderer = Renderer;
exports.Context = Context;

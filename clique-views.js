(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.jade = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

/**
 * Merge two attribute objects giving precedence
 * to values in object `b`. Classes are special-cased
 * allowing for arrays and merging/joining appropriately
 * resulting in a string.
 *
 * @param {Object} a
 * @param {Object} b
 * @return {Object} a
 * @api private
 */

exports.merge = function merge(a, b) {
  if (arguments.length === 1) {
    var attrs = a[0];
    for (var i = 1; i < a.length; i++) {
      attrs = merge(attrs, a[i]);
    }
    return attrs;
  }
  var ac = a['class'];
  var bc = b['class'];

  if (ac || bc) {
    ac = ac || [];
    bc = bc || [];
    if (!Array.isArray(ac)) ac = [ac];
    if (!Array.isArray(bc)) bc = [bc];
    a['class'] = ac.concat(bc).filter(nulls);
  }

  for (var key in b) {
    if (key != 'class') {
      a[key] = b[key];
    }
  }

  return a;
};

/**
 * Filter null `val`s.
 *
 * @param {*} val
 * @return {Boolean}
 * @api private
 */

function nulls(val) {
  return val != null && val !== '';
}

/**
 * join array as classes.
 *
 * @param {*} val
 * @return {String}
 */
exports.joinClasses = joinClasses;
function joinClasses(val) {
  return (Array.isArray(val) ? val.map(joinClasses) :
    (val && typeof val === 'object') ? Object.keys(val).filter(function (key) { return val[key]; }) :
    [val]).filter(nulls).join(' ');
}

/**
 * Render the given classes.
 *
 * @param {Array} classes
 * @param {Array.<Boolean>} escaped
 * @return {String}
 */
exports.cls = function cls(classes, escaped) {
  var buf = [];
  for (var i = 0; i < classes.length; i++) {
    if (escaped && escaped[i]) {
      buf.push(exports.escape(joinClasses([classes[i]])));
    } else {
      buf.push(joinClasses(classes[i]));
    }
  }
  var text = joinClasses(buf);
  if (text.length) {
    return ' class="' + text + '"';
  } else {
    return '';
  }
};


exports.style = function (val) {
  if (val && typeof val === 'object') {
    return Object.keys(val).map(function (style) {
      return style + ':' + val[style];
    }).join(';');
  } else {
    return val;
  }
};
/**
 * Render the given attribute.
 *
 * @param {String} key
 * @param {String} val
 * @param {Boolean} escaped
 * @param {Boolean} terse
 * @return {String}
 */
exports.attr = function attr(key, val, escaped, terse) {
  if (key === 'style') {
    val = exports.style(val);
  }
  if ('boolean' == typeof val || null == val) {
    if (val) {
      return ' ' + (terse ? key : key + '="' + key + '"');
    } else {
      return '';
    }
  } else if (0 == key.indexOf('data') && 'string' != typeof val) {
    if (JSON.stringify(val).indexOf('&') !== -1) {
      console.warn('Since Jade 2.0.0, ampersands (`&`) in data attributes ' +
                   'will be escaped to `&amp;`');
    };
    if (val && typeof val.toISOString === 'function') {
      console.warn('Jade will eliminate the double quotes around dates in ' +
                   'ISO form after 2.0.0');
    }
    return ' ' + key + "='" + JSON.stringify(val).replace(/'/g, '&apos;') + "'";
  } else if (escaped) {
    if (val && typeof val.toISOString === 'function') {
      console.warn('Jade will stringify dates in ISO form after 2.0.0');
    }
    return ' ' + key + '="' + exports.escape(val) + '"';
  } else {
    if (val && typeof val.toISOString === 'function') {
      console.warn('Jade will stringify dates in ISO form after 2.0.0');
    }
    return ' ' + key + '="' + val + '"';
  }
};

/**
 * Render the given attributes object.
 *
 * @param {Object} obj
 * @param {Object} escaped
 * @return {String}
 */
exports.attrs = function attrs(obj, terse){
  var buf = [];

  var keys = Object.keys(obj);

  if (keys.length) {
    for (var i = 0; i < keys.length; ++i) {
      var key = keys[i]
        , val = obj[key];

      if ('class' == key) {
        if (val = joinClasses(val)) {
          buf.push(' ' + key + '="' + val + '"');
        }
      } else {
        buf.push(exports.attr(key, val, false, terse));
      }
    }
  }

  return buf.join('');
};

/**
 * Escape the given string of `html`.
 *
 * @param {String} html
 * @return {String}
 * @api private
 */

var jade_encode_html_rules = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;'
};
var jade_match_html = /[&<>"]/g;

function jade_encode_char(c) {
  return jade_encode_html_rules[c] || c;
}

exports.escape = jade_escape;
function jade_escape(html){
  var result = String(html).replace(jade_match_html, jade_encode_char);
  if (result === '' + html) return html;
  else return result;
};

/**
 * Re-throw the given `err` in context to the
 * the jade in `filename` at the given `lineno`.
 *
 * @param {Error} err
 * @param {String} filename
 * @param {String} lineno
 * @api private
 */

exports.rethrow = function rethrow(err, filename, lineno, str){
  if (!(err instanceof Error)) throw err;
  if ((typeof window != 'undefined' || !filename) && !str) {
    err.message += ' on line ' + lineno;
    throw err;
  }
  try {
    str = str || require('fs').readFileSync(filename, 'utf8')
  } catch (ex) {
    rethrow(err, null, lineno)
  }
  var context = 3
    , lines = str.split('\n')
    , start = Math.max(lineno - context, 0)
    , end = Math.min(lines.length, lineno + context);

  // Error context
  var context = lines.slice(start, end).map(function(line, i){
    var curr = i + start + 1;
    return (curr == lineno ? '  > ' : '    ')
      + curr
      + '| '
      + line;
  }).join('\n');

  // Alter exception message
  err.path = filename;
  err.message = (filename || 'Jade') + ':' + lineno
    + '\n' + context + '\n\n' + err.message;
  throw err;
};

exports.DebugItem = function DebugItem(lineno, filename) {
  this.lineno = lineno;
  this.filename = filename;
}

},{"fs":2}],2:[function(require,module,exports){

},{}]},{},[1])(1)
});
(function (window) {
window.clique.jade = window.clique.jade || {};
window.clique.jade.linkInfo = function template(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;
;var locals_for_with = (locals || {});(function (_, link, undefined) {
jade_mixins["item"] = function(key, value){
var block = (this && this.block), attributes = (this && this.attributes) || {};
buf.push("<tr><td class=\"text-right\"><strong>" + (jade.escape(null == (jade_interp = key) ? "" : jade_interp)) + "</strong></td><td>" + (jade.escape(null == (jade_interp = value) ? "" : jade_interp)) + "</td></tr>");
};
buf.push("<div class=\"container full-width\">");
if ( _.isUndefined(link))
{
buf.push("<em>(Selection is empty)</em>");
}
else
{
buf.push("<nav><ul class=\"pagination\"><li class=\"prev\"><a aria-label=\"Previous\" class=\"virtual-link prev\"><span aria-hidden=\"true\">&laquo;</span></a></li><li class=\"next\"><a aria-label=\"Next\" class=\"virtual-link next\"><span aria-hidden=\"true\">&raquo;</span></a></li></ul></nav><div class=\"container full-width\"><div class=\"row\"><div class=\"col-md-1\"><table class=\"table table-striped table-bordered select-ok\">");
jade_mixins["item"]("key", link.key());
// iterate link.getAllData()
;(function(){
  var $$obj = link.getAllData();
  if ('number' == typeof $$obj.length) {

    for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
      var item = $$obj[$index];

jade_mixins["item"](item[0], item[1]);
    }

  } else {
    var $$l = 0;
    for (var $index in $$obj) {
      $$l++;      var item = $$obj[$index];

jade_mixins["item"](item[0], item[1]);
    }

  }
}).call(this);

buf.push("</table></div></div></div>");
}
buf.push("</div>");}.call(this,"_" in locals_for_with?locals_for_with._:typeof _!=="undefined"?_:undefined,"link" in locals_for_with?locals_for_with.link:typeof link!=="undefined"?link:undefined,"undefined" in locals_for_with?locals_for_with.undefined:typeof undefined!=="undefined"?undefined:undefined));;return buf.join("");
}})(window);

(function (window) {
window.clique.jade = window.clique.jade || {};
window.clique.jade.selectionInfo = function template(locals) {
var buf = [];
var jade_mixins = {};
var jade_interp;
;var locals_for_with = (locals || {});(function (_, metadata, nav, node, nodeButtons, selectionButtons, selectionSize, undefined) {
jade_mixins["item"] = function(key, value){
var block = (this && this.block), attributes = (this && this.attributes) || {};
buf.push("<tr><td class=\"text-right\"><strong>" + (jade.escape(null == (jade_interp = key) ? "" : jade_interp)) + "</strong></td><td>" + (jade.escape(null == (jade_interp = value) ? "" : jade_interp)) + "</td></tr>");
};
jade_mixins["button"] = function(spec, node){
var block = (this && this.block), attributes = (this && this.attributes) || {};
if ( spec.show(node))
{
if ( spec.icon)
{
buf.push("<button type=\"button\" style=\"margin-right: 3px;\"" + (jade.cls(['btn','btn-xs',["btn-" + spec.color, spec.cssClass]], [null,null,true])) + ">" + (jade.escape((jade_interp = spec.label(node)) == null ? '' : jade_interp)) + " <span" + (jade.cls(['glyphicon',"glyphicon-" + spec.icon], [null,true])) + "></span></button>");
}
else
{
buf.push("<button type=\"button\" style=\"margin-right: 3px;\"" + (jade.cls(['btn','btn-xs',["btn-" + spec.color, spec.cssClass]], [null,null,true])) + ">" + (jade.escape((jade_interp = spec.label(node)) == null ? '' : jade_interp)) + "</button>");
}
}
};
buf.push("<div class=\"container full-width\">");
if ( _.isUndefined(node))
{
buf.push("<em>(Selection is empty)</em>");
}
else
{
if ( nav)
{
buf.push("<nav><ul class=\"pagination\"><li class=\"prev\"><a aria-label=\"Previous\" class=\"virtual-link prev\"><span aria-hidden=\"true\">&laquo;</span></a></li><li class=\"next\"><a aria-label=\"Next\" class=\"virtual-link next\"><span aria-hidden=\"true\">&raquo;</span></a></li></ul></nav>");
}
buf.push("<div class=\"container full-width\">");
if ( metadata)
{
buf.push("<div class=\"row\"><div class=\"col-md-1\"><table class=\"table table-striped table-bordered select-ok\">");
jade_mixins["item"]("key", node.key());
// iterate node.getAllData()
;(function(){
  var $$obj = node.getAllData();
  if ('number' == typeof $$obj.length) {

    for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
      var item = $$obj[$index];

jade_mixins["item"](item[0], item[1]);
    }

  } else {
    var $$l = 0;
    for (var $index in $$obj) {
      $$l++;      var item = $$obj[$index];

jade_mixins["item"](item[0], item[1]);
    }

  }
}).call(this);

buf.push("</table></div></div>");
}
buf.push("<div class=\"row\"><h5>Node</h5>");
// iterate nodeButtons
;(function(){
  var $$obj = nodeButtons;
  if ('number' == typeof $$obj.length) {

    for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
      var buttonSpec = $$obj[$index];

jade_mixins["button"](buttonSpec, node);
    }

  } else {
    var $$l = 0;
    for (var $index in $$obj) {
      $$l++;      var buttonSpec = $$obj[$index];

jade_mixins["button"](buttonSpec, node);
    }

  }
}).call(this);

buf.push("</div>");
if ( selectionSize > 1)
{
buf.push("<div class=\"row\"><h5>Selection</h5>");
// iterate selectionButtons
;(function(){
  var $$obj = selectionButtons;
  if ('number' == typeof $$obj.length) {

    for (var $index = 0, $$l = $$obj.length; $index < $$l; $index++) {
      var buttonSpec = $$obj[$index];

jade_mixins["button"](buttonSpec);
    }

  } else {
    var $$l = 0;
    for (var $index in $$obj) {
      $$l++;      var buttonSpec = $$obj[$index];

jade_mixins["button"](buttonSpec);
    }

  }
}).call(this);

buf.push("</div>");
}
buf.push("</div>");
}
buf.push("</div>");}.call(this,"_" in locals_for_with?locals_for_with._:typeof _!=="undefined"?_:undefined,"metadata" in locals_for_with?locals_for_with.metadata:typeof metadata!=="undefined"?metadata:undefined,"nav" in locals_for_with?locals_for_with.nav:typeof nav!=="undefined"?nav:undefined,"node" in locals_for_with?locals_for_with.node:typeof node!=="undefined"?node:undefined,"nodeButtons" in locals_for_with?locals_for_with.nodeButtons:typeof nodeButtons!=="undefined"?nodeButtons:undefined,"selectionButtons" in locals_for_with?locals_for_with.selectionButtons:typeof selectionButtons!=="undefined"?selectionButtons:undefined,"selectionSize" in locals_for_with?locals_for_with.selectionSize:typeof selectionSize!=="undefined"?selectionSize:undefined,"undefined" in locals_for_with?locals_for_with.undefined:typeof undefined!=="undefined"?undefined:undefined));;return buf.join("");
}})(window);

(function (clique, Backbone, _) {
    "use strict";

    clique.view = clique.view || {};

    clique.view.LinkInfo = Backbone.View.extend({
        initialize: function (options) {
            var debRender;

            options = options || {};
            this.graph = options.graph;

            clique.util.require(this.model, "model");
            clique.util.require(this.graph, "graph");

            debRender = _.debounce(this.render, 100);

            this.listenTo(this.model, "focused", debRender);
            this.listenTo(this.model, "focused", debRender);
        },

        render: function () {
            var key,
                doRender;

            doRender = _.bind(function (link) {
                this.$el.html(clique.jade.linkInfo({
                    link: link
                }));

                this.$("a.prev").on("click", _.bind(function () {
                    this.model.focusLeft();
                }, this));

                this.$("a.next").on("click", _.bind(function () {
                    this.model.focusRight();
                }, this));
            }, this);

            key = this.model.focused();
            if (!key) {
                doRender(undefined);
            } else {
                this.graph.adapter.findLink({
                    key: key
                }).then(doRender);
            }
        }
    });
}(window.clique, window.Backbone, window._, window.template));

(function (clique, Backbone, _) {
    "use strict";

    clique.view = clique.view || {};

    var colors,
        processButtons,
        SelectionInfo;

    colors = {
        white: "default",
        blue: "primary",
        green: "success",
        purple: "info",
        orange: "warning",
        red: "danger",
        clear: "link"
    };

    processButtons = function (specs) {
        return _.map(specs || [], function (button) {
            return {
                label: _.isFunction(button.label) ? button.label : _.constant(button.label),
                cssClass: _.uniqueId("ident-"),
                color: colors[button.color] || "default",
                icon: button.icon,
                repeat: _.isUndefined(button.repeat) ? false : button.repeat,
                callback: button.callback || _.noop,
                show: _.isFunction(button.show) ? button.show : _.constant(_.isUndefined(button.show) ? true : button.show)
            };
        });
    };

    clique.view.SelectionInfo = SelectionInfo = Backbone.View.extend({
        initialize: function (options) {
            var debRender;

            clique.util.require(this.model, "model");
            clique.util.require(options.graph, "graph");

            options = options || {};
            this.graph = options.graph;
            this.nav = _.isUndefined(options.nav) ? true : options.nav;
            this.metadata = _.isUndefined(options.metadata) ? true : options.metadata;

            this.nodeButtons = processButtons(options.nodeButtons);
            this.selectionButtons = processButtons(options.selectionButtons);

            debRender = _.debounce(this.render, 100);

            this.listenTo(this.model, "change", debRender);
            this.listenTo(this.model, "focused", debRender);
            this.listenTo(this.graph, "change", debRender);
        },

        render: function () {
            var focused,
                renderTemplate;

            renderTemplate = _.bind(function (node) {
                this.$el.html(clique.jade.selectionInfo({
                    node: node,
                    degree: node ? this.graph.degree(node.key()) : -1,
                    selectionSize: this.model.size(),
                    nav: this.nav,
                    metadata: this.metadata,
                    nodeButtons: this.nodeButtons,
                    selectionButtons: this.selectionButtons
                }));

                _.each(this.nodeButtons, _.bind(function (spec) {
                    this.$("button." + spec.cssClass).on("click", _.bind(function () {
                        var render = _.bind(spec.callback, this)(this.graph.adapter.getMutator(this.model.focused()));
                        if (render) {
                            this.render();
                        }
                    }, this));
                }, this));

                _.each(this.selectionButtons, _.bind(function (spec) {
                    this.$("button." + spec.cssClass).on("click", _.bind(function () {
                        var render,
                            selectionMutators;

                        selectionMutators = _.map(this.model.items(), this.graph.adapter.getMutator, this.graph.adapter);

                        if (spec.repeat) {
                            render = _.any(_.map(selectionMutators, _.bind(spec.callback, this)));
                        } else {
                            render = _.bind(spec.callback, this)(selectionMutators, this.graph.adapter.getMutator(this.model.focused()));
                        }

                        if (render) {
                            this.render();
                        }
                    }, this));
                }, this));

                this.$("a.prev")
                    .on("click", _.bind(function () {
                        this.model.focusLeft();
                    }, this));

                this.$("a.next")
                    .on("click", _.bind(function () {
                        this.model.focusRight();
                    }, this));
            }, this);

            focused = this.model.focused();

            if (!focused) {
                renderTemplate(focused);
            } else {
                this.graph.adapter.findNodeByKey(focused)
                    .then(renderTemplate);
            }
        }
    });

    SelectionInfo.hideNode = function (node) {
        node.setTransient("selected", false);
        node.clearTransient("root");
        this.graph.removeNeighborhood({
            center: node,
            radius: 0
        });
    };

    SelectionInfo.deleteNode = function (node) {
        var doDelete = !node.getData("deleted");
        if (doDelete) {
            node.setData("deleted", true);
            _.bind(SelectionInfo.hideNode, this)(node);
        } else {
            node.clearData("deleted");
        }

        return !doDelete;
    };

    SelectionInfo.expandNode = function (node) {
        this.graph.addNeighborhood({
            center: node,
            radius: 1
        });
    };

    SelectionInfo.collapseNode = function (node) {
        var loners,
            mutators;

        // Find all neighbors of the node that have exactly one
        // neighbor.
        loners = _.filter(this.graph.neighbors(node.key()), function (nbr) {
            return _.size(this.graph.neighbors(nbr)) === 1;
        }, this);

        // Extract the mutator objects for these nodes.
        mutators = _.map(loners, this.graph.adapter.getMutator, this.graph.adapter);

        // Hide them.
        _.each(mutators, SelectionInfo.hideNode, this);
    };
}(window.clique, window.Backbone, window._, window.template));

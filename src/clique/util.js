import _ from 'underscore';
import Backbone from 'backbone';

export function deepCopy (o) {
  if (_.isUndefined(o)) {
    return undefined;
  }
  return JSON.parse(JSON.stringify(o));
}

export function concat (...lists) {
  return [].concat(...lists);
}

export function CSet () {
  var items = {};

  return {
    add: function (item) {
      items[item] = null;
    },

    remove: function (item) {
      delete items[item];
    },

    has: function (item) {
      return _.has(items, item);
    },

    items: function (mapper) {
      var stuff = _.keys(items);
      if (mapper) {
        stuff = _.map(stuff, mapper);
      }
      return stuff;
    },

    size: function () {
      return _.size(items);
    }
  };
}

export function MultiTable () {
  var table = {};

  return {
    add: function (key, item) {
      if (!_.has(table, key)) {
        table[key] = new CSet();
      }

      table[key].add(item);
    },

    remove: function (key, item) {
      if (_.has(table, key)) {
        table[key].remove(item);
      }
    },

    strike: function (key) {
      delete table[key];
    },

    has: function (key, item) {
      return _.has(table, key) && (_.isUndefined(item) || table[key].has(item));
    },

    items: function (key) {
      if (_.has(table, key)) {
        return table[key].items();
      }
    }
  };
}

export function Accessor (raw) {
  var disallowed = new CSet();

  raw.data = raw.data || {};

  _.each(['key', 'source', 'target', 'data'], function (d) {
    disallowed.add(d);
  });

  return _.extend({
    key: function () {
      return raw.key;
    },

    source: function () {
      return raw.source.key || raw.source;
    },

    target: function () {
      return raw.target.key || raw.target;
    },

    getAttribute: function (prop) {
      if (disallowed.has(prop)) {
        return;
      }
      return raw[prop];
    },

    setAttribute: function (prop, value) {
      if (disallowed.has(prop)) {
        return false;
      }

      raw[prop] = value;
      return true;
    },

    clearAttribute: function (prop) {
      if (disallowed.has(prop)) {
        return false;
      }

      delete raw[prop];
      return true;
    },

    getAllAttributes: function () {
      var result = {};

      _.each(raw, function (value, key) {
        if (!disallowed.has(key)) {
          result[key] = value;
        }
      });

      return result;
    },

    getData: function (prop) {
      return raw.data[prop];
    },

    setData: function (prop, value) {
      raw.data[prop] = value;
      this.trigger('changed', this, prop, value);
    },

    clearData: function (prop) {
      delete raw.data[prop];
      this.trigger('cleared', this, prop);
    },

    getAllData: function () {
      var result = {};

      _.each(raw.data, function (value, key) {
        result[key] = value;
      });

      return result;
    },

    getRaw: function () {
      return raw;
    }
  }, Backbone.Events);
}

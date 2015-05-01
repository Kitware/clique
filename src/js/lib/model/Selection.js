(function (cf, Backbone, _) {
    "use strict";

    cf.model.Selection = Backbone.Model.extend({
        add: function (key) {
            this.set(key, key);
        },

        remove: function (key) {
            this.unset(key);
        },

        items: function () {
            return _.keys(this.attributes);
        }
    });
}(window.cf, window.Backbone, window._));

(function (clique, Backbone, _) {
    "use strict";

    clique.model.Selection = Backbone.Model.extend({
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
}(window.clique, window.Backbone, window._));

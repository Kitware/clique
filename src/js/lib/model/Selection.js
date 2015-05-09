(function (clique, Backbone, _) {
    "use strict";

    clique.model.Selection = Backbone.Model.extend({
        initialize: function () {
            this.focalPoint = 0;
        },

        add: function (key) {
            this.set(key, key);
        },

        remove: function (key) {
            this.unset(key);

            if (this.focalPoint >= this.size()) {
                this.focalPoint = Math.max(0, this.size() - 1);
            }
        },

        items: function () {
            return _.keys(this.attributes);
        },

        focus: function (target) {
            this.focalPoint = target;
            this.trigger("focused", this.focused());
        },

        focusLeft: function () {
            if (this.focalPoint > 0) {
                this.focus(this.focalPoint - 1);
            }
        },

        focusRight: function () {
            if (this.focalPoint < this.size() - 1) {
                this.focus(this.focalPoint + 1);
            }
        },

        focused: function () {
            return this.items()[this.focalPoint];
        },

        size: function () {
            return _.size(this.attributes);
        }
    });
}(window.clique, window.Backbone, window._));

(function (clique, Backbone, _) {
    "use strict";

    clique.model.Selection = Backbone.Model.extend({
        initialize: function () {
            this.focalPoint = 0;
        },

        add: function (key) {
            this.set(key, key);
            if (this.size()) {
                this.trigger("focused", this.focused());
            }
        },

        remove: function (key) {
            var focused = this.focused() === key;

            this.unset(key);

            if (this.focalPoint >= this.size()) {
                this.focalPoint = Math.max(0, this.size() - 1);
                this.trigger("focused", this.focused());
            } else if (focused) {
                this.focusLeft();
            }
        },

        items: function () {
            return _.keys(this.attributes);
        },

        focus: function (target) {
            this.focalPoint = target;
            if (this.focalPoint < 0) {
                this.focalPoint = 0;
            }
            if (this.focalPoint >= this.size()) {
                this.focalPoint = this.size() - 1;
            }

            this.trigger("focused", this.focused());
        },

        focusLeft: function () {
            this.focus(this.focalPoint - 1);
        },

        focusRight: function () {
            this.focus(this.focalPoint + 1);
        },

        focused: function () {
            return this.items()[this.focalPoint];
        },

        size: function () {
            return _.size(this.attributes);
        }
    });
}(window.clique, window.Backbone, window._));

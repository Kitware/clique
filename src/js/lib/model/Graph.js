(function (cf, Backbone) {
    "use strict";

    cf.Graph = Backbone.Model.extend({
        initialize: function (options) {
            if (!options.adapter) {
                throw cf.error.required("adapter");
            }

            this.adapter = new options.adapter(options.options);
        },

        getNeighborhood: function (options) {
            return this.adapter.getNeighborhood(options);
        }
    });
}(window.cf, window.Backbone));

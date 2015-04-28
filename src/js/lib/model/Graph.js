(function (cf, Backbone) {
    "use strict";

    cf.Graph = Backbone.Model.extend({
        initialize: function (options) {
            console.log(options);
        }
    });
}(window.cf, window.Backbone));

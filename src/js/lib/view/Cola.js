(function (cf, Backbone) {
    "use strict";

    cf.view.Cola = Backbone.View.extend({
        tagName: "g",

        initialize: function () {
            if (!this.model) {
                throw cf.error.required("model");
            }

            this.listenTo(this.model, "change", this.render);
        },

        render: function () {
            console.log("hello!", this.model);
        }
    });
}(window.cf, window.Backbone));

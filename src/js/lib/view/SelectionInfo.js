(function (cf, Backbone) {
    "use strict";

    cf.view.SelectionInfo = Backbone.View.extend({
        initialize: function () {
            if (!this.model) {
                throw cf.error.required("model");
            }

            this.listenTo(this.model, "change", this.render);
        },

        render: function () {
            var nodes = this.model.items();

            console.log(nodes);
        }
    });
}(window.cf, window.Backbone));

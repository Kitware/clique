(function (clique, Backbone, _) {
    "use strict";

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
                this.$el.html(clique.template.linkInfo({
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
}(window.clique, window.Backbone, window._));

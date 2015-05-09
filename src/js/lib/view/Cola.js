(function (clique, Backbone, _, d3, cola) {
    "use strict";

    var fill = function (d) {
        if (d.key === this.focused) {
            return "crimson";
        } else if (d.root) {
            return "gold";
        } else {
            return "limegreen";
        }
    };

    clique.view.Cola = Backbone.View.extend({
        initialize: function (options) {
            clique.util.require(this.model, "model");
            clique.util.require(this.el, "el");

            options = options || {};

            this.nodeRadius = options.nodeRadius || 7.5;

            this.cola = cola.d3adaptor()
                .linkDistance(options.linkDistance || 100)
                .avoidOverlaps(true)
                .size([this.$el.width(), this.$el.height()])
                .start();

            this.selection = new clique.model.Selection();

            this.listenTo(this.selection, "nodefocus", function (focus) {
                this.focused = focus;
            });

            this.$el.html(clique.template.cola());
            this.listenTo(this.model, "change", this.render);
            this.listenTo(this.selection, "focused", function (focused) {
                this.focused = focused;
                this.nodes.style("fill", _.bind(fill, this));
            });
        },

        render: function () {
            console.log("render");

            var nodeData = this.model.get("nodes"),
                linkData = this.model.get("links"),
                drag,
                that = this;

            this.cola
                .nodes(nodeData)
                .links(linkData);

            this.nodes = d3.select(this.el)
                .select("g.nodes")
                .selectAll("circle.node")
                .data(nodeData, _.property("key"));

            drag = this.cola.drag()
                .on("drag", _.bind(function () {
                    this.dragging = true;
                }, this));

            this.nodes.enter()
                .append("circle")
                .classed("node", true)
                .attr("r", 0)
                .style("fill", "limegreen")
                .on("click", function (d) {
                    var me = d3.select(this),
                        selected = !me.classed("selected");

                    if (!that.dragging) {
                        me.classed("selected", selected);

                        if (selected) {
                            that.selection.add(d.key);
                        } else {
                            that.selection.remove(d.key);
                        }
                    }
                    that.dragging = false;
                })
                .call(drag)
                .transition()
                .duration(500)
                .attr("r", this.nodeRadius);

            this.nodes.style("fill", _.bind(fill, this));

            this.nodes.exit()
                .each(_.bind(function (d) {
                    this.selection.remove(d.key);
                }, this))
                .transition()
                .duration(1000)
                .attr("r", 0)
                .style("opacity", 0)
                .remove();

            this.links = d3.select(this.el)
                .select("g.links")
                .selectAll("line.link")
                .data(linkData, function (d) {
                    return JSON.stringify([d.source.key, d.target.key]);
                });

            this.links.enter()
                .append("line")
                .classed("link", true)
                .style("stroke-width", 0)
                .style("stroke", "black")
                .transition()
                .duration(500)
                .style("stroke-width", 1);

            this.links.exit()
                .transition()
                .duration(1000)
                .style("stroke-width", 0)
                .style("opacity", 0)
                .remove();

            this.cola.on("tick", _.bind(function () {
                var width = this.$el.width(),
                    height = this.$el.height(),
                    clamp = function (value, low, high) {
                        return value < low ? low : (value > high ? high : value);
                    },
                    clampX = _.partial(clamp, _, this.nodeRadius, width - this.nodeRadius),
                    clampY = _.partial(clamp, _, this.nodeRadius, height - this.nodeRadius);

                this.nodes
                    .attr("cx", _.compose(clampX, _.property("x")))
                    .attr("cy", _.compose(clampY, _.property("y")));

                this.links
                    .attr("x1", _.compose(clampX, function (d) {
                        return d.source.x;
                    }))
                    .attr("y1", _.compose(clampY, function (d) {
                        return d.source.y;
                    }))
                    .attr("x2", _.compose(clampX, function (d) {
                        return d.target.x;
                    }))
                    .attr("y2", _.compose(clampY, function (d) {
                        return d.target.y;
                    }));
            }, this));

            this.cola.start();
        }
    });
}(window.clique, window.Backbone, window._, window.d3, window.cola));

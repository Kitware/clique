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

            this.transitionTime = 500;

            this.cola = cola.d3adaptor()
                .linkDistance(options.linkDistance || 100)
                .avoidOverlaps(true)
                .size([this.$el.width(), this.$el.height()])
                .start();

            this.selection = new clique.model.Selection();

            this.$el.html(clique.template.cola());
            this.listenTo(this.model, "change", _.debounce(this.render, 100));
            this.listenTo(this.selection, "focused", function (focused) {
                this.focused = focused;
                this.nodes.style("fill", _.bind(fill, this));
            });
        },

        render: function () {
            var nodeData = this.model.get("nodes"),
                linkData = this.model.get("links"),
                drag,
                me = d3.select(this.el),
                that = this;

            this.cola
                .nodes(nodeData)
                .links(linkData);

            this.nodes = me.select("g.nodes")
                .selectAll("circle.node")
                .data(nodeData, _.property("key"));

            drag = this.cola.drag()
                .on("drag", _.bind(function () {
                    this.dragging = true;
                }, this));

            this.nodes.datum(function (d) {
                d.fixed = true;
                return d;
            });

            this.nodes.enter()
                .append("circle")
                .classed("node", true)
                .attr("r", 0)
                .style("fill", "limegreen")
                .on("mousedown.signal", _.bind(function () {
                    d3.event.stopPropagation();
                }, this))
                .on("click", function (d) {
                    var me = d3.select(this),
                        selected;

                    if (!that.dragging) {
                        if (d3.event.shiftKey) {
                            // If the shift key is pressed, then simply toggle
                            // the presence of the clicked node in the current
                            // selection.
                            selected = !me.classed("selected");
                        } else if (d3.event.ctrlKey) {
                            // If the control key is pressed, then move the
                            // focus to the clicked node, adding it to the
                            // selection first if necessary.
                            if (!me.classed("selected")) {
                                me.classed("selected", true);
                                that.selection.add(d.key);
                            }

                            that.selection.focusKey(d.key);
                            return;
                        } else {
                            // If the shift key isn't pressed, then clear the
                            // selection before doing anything else.
                            _.each(that.selection.items(), function (key) {
                                that.selection.remove(key);
                            });

                            d3.select(that.el)
                                .selectAll("circle.node")
                                .classed("selected", false);
                            selected = true;
                        }

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
                .duration(this.transitionTime)
                .attr("r", this.nodeRadius);

            this.nodes.style("fill", _.bind(fill, this));

            this.nodes.exit()
                .each(_.bind(function (d) {
                    this.selection.remove(d.key);
                }, this))
                .transition()
                .duration(this.transitionTime)
                .attr("r", 0)
                .style("opacity", 0)
                .remove();

            this.links = me.select("g.links")
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
                .duration(this.transitionTime)
                .style("stroke-width", 1);

            this.links.exit()
                .transition()
                .duration(this.transitionTime)
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

            // Attach some selection actions to the background.
            (function () {
                var dragging = false,
                    active = false,
                    origin,
                    selector,
                    start = {
                        x: null,
                        y: null
                    },
                    endBrush,
                    between = function (val, low, high) {
                        var tmp;

                        if (low > high) {
                            tmp = high;
                            high = low;
                            low = tmp;
                        }

                        return low < val && val < high;
                    };

                me.on("mousedown", function () {
                    active = true;
                    dragging = false;

                    origin = that.$el.offset();

                    start.x = d3.event.pageX - origin.left;
                    start.y = d3.event.pageY - origin.top;
                });

                me.on("mousemove", function () {
                    var x,
                        y;

                    if (!active) {
                        return;
                    }

                    if (!dragging) {
                        dragging = true;

                        // Instantiate an SVG rect to act as the selector range.
                        selector = me.append("rect")
                            .classed("selector", true)
                            .attr("x", start.x)
                            .attr("y", start.y)
                            .attr("width", 0)
                            .attr("height", 0)
                            .style("opacity", 0.1)
                            .style("fill", "black");
                    }

                    x = d3.event.pageX - origin.left;
                    y = d3.event.pageY - origin.top;

                    // Resize the rect to reflect the current mouse position
                    if (x > start.x) {
                        selector.attr("width", x - start.x);
                    } else {
                        selector.attr("width", start.x - x)
                            .attr("x", x);
                    }

                    if (y > start.y) {
                        selector.attr("height", y - start.y);
                    } else {
                        selector.attr("height", start.y - y)
                            .attr("y", y);
                    }

                    // Compute which nodes are inside the rect
                    _.each(that.model.get("nodes"), function (node) {
                        node.selected = between(node.x, start.x, x) && between(node.y, start.y, y);

                        if (node.selected) {
                            that.selection.add(node.key);
                        } else {
                            that.selection.remove(node.key);
                        }
                    });

                    // Update the view.
                    that.nodes
                        .classed("selected", _.property("selected"))
                        .style("fill", _.bind(fill, that));
                });

                endBrush = function () {
                    if (dragging) {
                        me.selectAll(".selector")
                            .remove();
                        selector = null;
                    } else if (active) {
                        // If this was merely a click (no dragging), then also
                        // unselect everything.
                        _.each(that.model.get("nodes"), function (node) {
                            that.selection.remove(node.key);
                        });

                        // Update the view.
                        that.nodes
                            .classed("selected", false)
                            .style("fill", _.bind(fill, that));
                    }

                    dragging = false;
                    active = false;
                };

                // On mouseup, regardless of where the mouse is (as taken care
                // of by the second handler below), go ahead and terminate the
                // brushing movement.
                me.on("mouseup", endBrush);
                d3.select(document)
                    .on("mouseup", endBrush);
            }());

            this.cola.start();

            _.delay( _.bind(function () {
                this.nodes.datum(function (d) {
                    d.fixed = false;
                    return d;
                });
            }, this), this.transitionTime + 5);
        }
    });
}(window.clique, window.Backbone, window._, window.d3, window.cola));

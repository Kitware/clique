(function (clique, Backbone, _, d3, cola) {
    "use strict";

    var fill,
        strokeWidth;

    fill = function (d) {
        if (d.key === this.focused) {
            return "crimson";
        } else if (d.root) {
            return "gold";
        } else {
            return "limegreen";
        }
    };

    strokeWidth = function (d) {
        return d.selected ? "2px" : "0px";
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
                this.renderNodes();
            });
        },

        renderNodes: function () {
            this.nodes
                .style("fill", _.bind(fill, this))
                .style("stroke", "blue")
                .style("stroke-width", _.bind(strokeWidth, this));
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
                    if (!that.dragging) {
                        if (d3.event.shiftKey) {
                            // If the shift key is pressed, then simply toggle
                            // the presence of the clicked node in the current
                            // selection.
                            d.selected = !d.selected;
                        } else if (d3.event.ctrlKey) {
                            // If the control key is pressed, then move the
                            // focus to the clicked node, adding it to the
                            // selection first if necessary.
                            d.selected = true;
                            that.selection.add(d.key);
                            that.selection.focusKey(d.key);
                        } else {
                            // If the shift key isn't pressed, then clear the
                            // selection before selecting the clicked node.
                            _.each(that.selection.items(), function (key) {
                                that.selection.remove(key);
                            });

                            d3.select(that.el)
                                .selectAll("circle.node")
                                .datum(function (d) {
                                    d.selected = false;
                                    return d;
                                });

                            d.selected = true;
                        }

                        if (d.selected) {
                            that.selection.add(d.key);
                        } else {
                            that.selection.remove(d.key);
                        }

                        that.renderNodes();
                    }
                    that.dragging = false;
                })
                .call(drag)
                .transition()
                .duration(this.transitionTime)
                .attr("r", this.nodeRadius);

            this.renderNodes();

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
                this.nodes
                    .attr("cx", _.property("x"))
                    .attr("cy", _.property("y"));

                this.links
                    .attr("x1", _.compose(_.property("x"), _.property("source")))
                    .attr("y1", _.compose(_.property("y"), _.property("source")))
                    .attr("x2", _.compose(_.property("x"), _.property("target")))
                    .attr("y2", _.compose(_.property("y"), _.property("target")));
            }, this));

            // Attach some selection actions to the background.
            (function () {
                var dragging = false,
                    active = false,
                    moving = false,
                    curTransform,
                    origin,
                    selector,
                    start = {
                        x: null,
                        y: null
                    },
                    end = {
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

                    // If shift is not held at the beginning of the operation,
                    // then remove the current selection.
                    if (d3.event.ctrlKey) {
                        _.each(that.model.get("nodes"), function (node) {
                            node.selected = false;
                            that.selection.remove(node.key);
                        });

                        that.renderNodes();
                    } else if (!d3.event.shiftKey) {
                        active = false;
                        moving = true;

                        curTransform = me.select("g").attr("transform");

                        if (!curTransform) {
                            curTransform = {
                                x: 0,
                                y: 0
                            };
                        } else {
                            curTransform = curTransform.slice(curTransform.indexOf("(")+1, curTransform.indexOf(")")).split(",").map(Number);
                            curTransform = {
                                x: curTransform[0],
                                y: curTransform[1]
                            };
                        }
                    }

                    origin = that.$el.offset();

                    start.x = end.x = d3.event.pageX - origin.left;
                    start.y = end.y = d3.event.pageY - origin.top;
                });

                me.on("mousemove", function () {
                    var x,
                        y;

                    if (active || moving) {
                        if (!dragging) {
                            dragging = true;

                            // Instantiate an SVG rect to act as the selector range.
                            if (active) {
                                selector = me.append("rect")
                                    .classed("selector", true)
                                    .attr("x", start.x)
                                    .attr("y", start.y)
                                    .attr("width", 0)
                                    .attr("height", 0)
                                    .style("opacity", 0.1)
                                    .style("fill", "black");
                            }
                        }

                        end.x = x = d3.event.pageX - origin.left;
                        end.y = y = d3.event.pageY - origin.top;
                    }

                    if (active) {
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

                        // Update the view.
                        that.renderNodes();
                    } else if (moving) {
                        curTransform.x += d3.event.movementX;
                        curTransform.y += d3.event.movementY;

                        me.select("g").attr("transform", "translate(" + curTransform.x + "," + curTransform.y + ")");
                    }
                });

                endBrush = function () {
                    if (active) {
                        if (dragging) {
                            me.selectAll(".selector")
                                .remove();
                            selector = null;
                        }

                        _.each(that.model.get("nodes"), function (node) {
                            if (between(node.x, start.x, end.x) && between(node.y, start.y, end.y)) {
                                node.selected = true;
                                that.selection.add(node.key);
                            }
                        });

                        // Update the view.
                        that.renderNodes();
                    }

                    dragging = false;
                    active = false;
                    moving = false;
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

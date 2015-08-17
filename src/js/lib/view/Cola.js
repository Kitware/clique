(function (clique, Backbone, _, d3, cola) {
    "use strict";

    var prefill,
        fill,
        strokeWidth;

    prefill = function (cmap) {
        return function (d) {
            if (d.key === this.focused) {
                return "pink";
            } else if (d.root) {
                return "gold";
            } else {
                return cmap(d);
            }
        };
    };

    fill = function (cmap) {
        return function (d) {
            this.model.adapter.getMutator({
                _id: {
                    $oid: d.key
                }
            }).clearTransient("root");

            if (d.key === this.focused) {
                return "pink";
            } else {
                return cmap(d);
            }
        };
    };

    strokeWidth = function (d) {
        return this.selected.has(d.key) ? "2px" : "0px";
    };

    clique.view.Cola = Backbone.View.extend({
        initialize: function (options) {
            var cmap;

            clique.util.require(this.model, "model");
            clique.util.require(this.el, "el");

            options = options || {};

            this.nodeRadius = function (d) {
                var r = options.nodeRadius || 7.5;
                return d.data && d.data.grouped ? 2*r : r;
            };

            this.transitionTime = 500;

            cmap = d3.scale.category10();
            this.colormap = function (d) {
                return cmap((d.data || {}).type || "no type");
            };

            this.prefill = prefill(this.colormap);
            this.fill = fill(this.colormap);

            this.cola = cola.d3adaptor()
                .linkDistance(options.linkDistance || 100)
                .avoidOverlaps(true)
                .size([this.$el.width(), this.$el.height()])
                .start();

            this.selection = new clique.model.Selection();
            this.linkSelection = new clique.model.Selection();

            this.$el.html(clique.template.cola());
            this.listenTo(this.model, "change", _.debounce(this.render, 100));
            this.listenTo(this.selection, "focused", function (focused) {
                this.focused = focused;
                this.renderNodes();
            });
            this.selected = new clique.util.Set();
            this.listenTo(this.selection, "added", function (key) {
                this.selected.add(key);
            });
            this.listenTo(this.selection, "removed", function (key) {
                this.selected.remove(key);
            });
        },

        renderNodes: function (cfg) {
            var that = this;

            if (cfg && cfg.cancel) {
                this.nodes.interrupt();
            }

            this.nodes
                .style("fill", _.bind(this.prefill, this))
                .style("stroke", "blue")
                .style("stroke-width", _.bind(strokeWidth, this))
                .filter(function (d) {
                    return d.root;
                })
                .transition()
                .delay(this.transitionTime)
                .each("interrupt", function () {
                    d3.select(this)
                        .style("fill", _.bind(that.fill, that));
                })
                .duration(1500)
                .style("fill", _.bind(this.fill, this));
        },

        render: function () {
            var nodeData = this.model.get("nodes"),
                linkData = this.model.get("links"),
                drag,
                me = d3.select(this.el),
                groups,
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

            this.links = me.select("g.links")
                .selectAll("g.link")
                .data(linkData, function (d) {
                    return JSON.stringify([d.source.key, d.target.key]);
                });

            groups = this.links.enter()
                .append("g")
                .classed("link", true);

            groups.append("line")
                .style("stroke-width", 0)
                .style("stroke", "black")
                .style("stroke-dasharray", function (d) {
                    return d.data && d.data.grouping ? "5,5" : "none";
                })
                .transition()
                .duration(this.transitionTime)
                .style("stroke-width", 1);

            groups.append("line")
                .classed("handle", true)
                .style("stroke-width", 10)
                .on("mouseenter", function () {
                    d3.select(this)
                        .classed("hovering", true);
                })
                .on("mouseout", function () {
                    d3.select(this)
                        .classed("hovering", false);
                })
                .on("mousedown", function () {
                    d3.event.stopPropagation();
                })
                .on("click", function (d) {
                    var selected;

                    if (d3.event.shiftKey) {
                        console.log("shift click on link");
                    } else if (d3.event.ctrlKey) {
                        console.log("ctrl click on link");
                    } else {
                        selected = d3.select(this).classed("selected");

                        _.each(that.linkSelection.items(), function (key) {
                            that.linkSelection.remove(key);
                        });

                        that.linkSelection.add(clique.util.linkHash(d));

                        d3.select(that.el)
                            .selectAll(".handle")
                            .classed("selected", false);

                        d3.select(this)
                            .classed("hovering", false)
                            .classed("selected", true);
                    }
                });

            this.links.exit()
                .transition()
                .duration(this.transitionTime)
                .style("stroke-width", 0)
                .style("opacity", 0)
                .remove();

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
                            if (that.selected.has(d.key)) {
                                that.selection.remove(d.key);
                            } else {
                                that.selection.add(d.key);
                            }
                        } else if (d3.event.ctrlKey) {
                            // If the control key is pressed, then move the
                            // focus to the clicked node, adding it to the
                            // selection first if necessary.
                            that.selection.add(d.key);
                            that.selection.focusKey(d.key);
                        } else {
                            // If the shift key isn't pressed, then clear the
                            // selection before selecting the clicked node.
                            _.each(that.selection.items(), function (key) {
                                that.selection.remove(key);
                            });

                            that.selection.add(d.key);
                        }

                        that.renderNodes({
                            cancel: true
                        });
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

            this.cola.on("tick", _.bind(function () {
                this.nodes
                    .attr("cx", _.property("x"))
                    .attr("cy", _.property("y"));

                this.links.selectAll("line")
                    .attr("x1", _.compose(_.property("x"), _.property("source")))
                    .attr("y1", _.compose(_.property("y"), _.property("source")))
                    .attr("x2", _.compose(_.property("x"), _.property("target")))
                    .attr("y2", _.compose(_.property("y"), _.property("target")));
            }, this));

            (function () {
                var transform = [1, 0, 0, 1, 0, 0],
                    pan,
                    zoom;

                pan = function (dx, dy) {
                    transform[4] += dx;
                    transform[5] += dy;

                    me.select("g").attr("transform", "matrix(" + transform.join(" ") + ")");
                };

                zoom = function (s, c) {
                    transform[0] *= s;
                    transform[3] *= s;

                    transform[4] *= s;
                    transform[5] *= s;

                    transform[4] += (1-s)*c[0];
                    transform[5] += (1-s)*c[1];

                    me.select("g").attr("transform", "matrix(" + transform.join(" ") + ")");
                };

                // Panning actions.
                (function () {
                    var active = false,
                        endMove;

                    me.on("mousedown.pan", function () {
                        if (d3.event.which !== 3) {
                            return;
                        }

                        active = true;
                    });

                    me.on("mousemove.pan", function () {
                        if (!active) {
                            return;
                        }

                        pan(d3.event.movementX, d3.event.movementY);
                    });

                    endMove = function () {
                        active = false;
                    };

                    me.on("mouseup.pan", endMove);
                    d3.select(document)
                        .on("mouseup.pan", endMove);
                }());

                me.on("wheel.zoom", function () {
                    var factor = 1 + Math.abs(d3.event.deltaY) / 200;
                    if (d3.event.deltaY > 0) {
                        factor = 1 / factor;
                    }

                    zoom(factor, [d3.event.pageX - that.$el.offset().left, d3.event.pageY - that.$el.offset().top]);
                });

                d3.select(document.body)
                    .on("wheel", function () {
                        d3.event.preventDefault();
                        d3.event.stopPropagation();
                    });
            }());

            (function () {
                var dragging = false,
                    active = false,
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
                    invMatMult,
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

                me.on("mousedown.select", function () {
                    if (d3.event.which !== 1) {
                        // Only select on left mouse click.
                        return;
                    }

                    active = true;
                    dragging = false;

                    // If shift is not held at the beginning of the operation,
                    // then remove the current selection.
                    if (!d3.event.shiftKey) {
                        _.each(that.model.get("nodes"), function (node) {
                            that.selection.remove(node.key);
                        });

                        that.renderNodes();
                    }

                    origin = that.$el.offset();

                    start.x = end.x = d3.event.pageX - origin.left;
                    start.y = end.y = d3.event.pageY - origin.top;
                });

                me.on("mousemove.select", function () {
                    var x,
                        y;

                    if (active) {
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
                    }
                });

                invMatMult = function (m, p) {
                    var s = 1/m[0],
                        t = {x: -m[4]*s, y: -m[5]*s};

                    return {
                        x: s*p.x + t.x,
                        y: s*p.y + t.y
                    };
                };

                endBrush = function () {
                    var matrix;

                    if (active) {
                        if (dragging) {
                            me.selectAll(".selector")
                                .remove();
                            selector = null;
                        }

                        // Transform the start and end coordinates of the
                        // selector box.
                        matrix = (me.select("g").attr("transform") || "matrix(1 0 0 1 0 0)").slice("matrix(".length, -1).split(" ").map(Number);
                        start = invMatMult(matrix, start);
                        end = invMatMult(matrix, end);

                        _.each(that.model.get("nodes"), function (node) {
                            if (between(node.x, start.x, end.x) && between(node.y, start.y, end.y)) {
                                that.selection.add(node.key);
                            }
                        });

                        // Update the view.
                        that.renderNodes({
                            cancel: true
                        });
                    }

                    dragging = false;
                    active = false;
                };

                // On mouseup, regardless of where the mouse is (as taken care
                // of by the second handler below), go ahead and terminate the
                // brushing movement.
                me.on("mouseup.select", endBrush);
                d3.select(document)
                    .on("mouseup.select", endBrush);
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

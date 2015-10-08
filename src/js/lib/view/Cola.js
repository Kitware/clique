(function (clique, Backbone, _, d3, cola) {
    "use strict";

    var strokeWidth;

    strokeWidth = function (d) {
        return this.selected.has(d.key) ? "2px" : "0px";
    };

    clique.view.Cola = Backbone.View.extend({
        initialize: function (options) {
            var group,
                userFill,
                userNodeRadius;

            clique.util.require(this.model, "model");
            clique.util.require(this.el, "el");

            options = options || {};

            this.label = options.label || _.constant("foobar");
            this.mode = "node";

            this.postLinkAdd = options.postLinkAdd || _.noop;

            this.baseNodeRadius = 7.5;
            userNodeRadius = options.nodeRadius || function (_, r) {
                return r;
            };
            if (!_.isFunction(userNodeRadius)) {
                userNodeRadius = _.constant(userNodeRadius);
            }
            this.nodeRadius = function (d) {
                return userNodeRadius(d, this.baseNodeRadius);
            };

            this.transitionTime = options.transitionTime || 500;

            this.focusColor = _.isUndefined(options.focusColor) ? "pink" : options.focusColor;
            this.rootColor = _.isUndefined(options.rootColor) ? "gold" : options.rootColor;

            userFill = options.fill || "blue";
            if (!_.isFunction(userFill)) {
                userFill = _.constant(userFill);
            }

            this.fill = _.bind(function (d) {
                var initial;

                this.model.adapter.getMutator(d.key)
                    .clearTransient("root");

                if (d.key === this.focused) {
                    initial = this.focusColor;
                }

                return initial ? initial : userFill(d);
            }, this);

            this.prefill = _.bind(function (d) {
                var initial;

                if (d.key === this.focused) {
                    initial = this.focusColor;
                } else if (d.root) {
                    initial = this.rootColor;
                }

                return initial ? initial : userFill(d);
            }, this);

            this.cola = cola.d3adaptor()
                .linkDistance(options.linkDistance || 100)
                .avoidOverlaps(true)
                .size([this.$el.width(), this.$el.height()])
                .start();

            this.selection = new clique.model.Selection();
            this.linkSelection = new clique.model.Selection();

            // Empty the target element.
            d3.select(this.el)
                .selectAll("*")
                .remove();

            // Place a group element in the target element.
            group = d3.select(this.el)
                .append("g");

            // Place two more group elements in the group element - one for
            // nodes and one for links (the links go first so they are drawn
            // "under" the nodes).
            group.append("g")
                .classed("links", true);
            group.append("g")
                .classed("nodes", true);

            this.listenTo(this.model, "change", _.debounce(this.render, 100));
            this.listenTo(this.selection, "focused", function (focused) {
                this.focused = focused;
                this.renderNodes();
            });
            this.listenTo(this.linkSelection, "removed", function (key) {
                d3.select(this.el)
                    .selectAll(".handle")
                    .filter(function (d) {
                        return d.key === key;
                    })
                .classed("selected", false);
            });
            this.listenTo(this.linkSelection, "added", function (key) {
                d3.select(this.el)
                    .selectAll(".handle")
                    .filter(function (d) {
                        return d.key === key;
                    })
                .classed("selected", true);
            });
            this.listenTo(this.linkSelection, "focused", function (focused) {
                d3.select(this.el)
                    .selectAll(".handle")
                    .classed("focused", false)
                    .filter(function (d) {
                        return d.key === focused;
                    })
                .classed("focused", true);
            });

            this.selected = new clique.util.Set();
            this.listenTo(this.selection, "added", function (key) {
                this.selected.add(key);
            });
            this.listenTo(this.selection, "removed", function (key) {
                this.selected.remove(key);
            });
        },

        showLabels: function () {
            var phase = 500;

            this.nodes.selectAll("rect")
                .style("pointer-events", null)
                .transition()
                .delay(function (d, i, j) {
                    return j * 10;
                })
                .duration(phase)
                .attr("x", function (d) {
                    return -d.textBBox.width / 2;
                })
                .attr("y", function (d) {
                    return -d.textBBox.height / 2;
                })
                .attr("width", function (d) {
                    return d.textBBox.width;
                })
                .attr("height", function (d) {
                    return d.textBBox.height;
                });

            this.nodes.selectAll("text")
                .style("pointer-events", null)
                .transition()
                .delay(phase / 2)
                .duration(phase / 2)
                .style("opacity", 1.0);
        },

        hideLabels: function () {
            var cards,
                phase = 500;

            cards = this.nodes
                .selectAll("g");

            cards.selectAll("rect")
                .transition()
                .delay(function (d, i, j) {
                    return j * 10;
                })
                .duration(phase)
                .attr("x", 0.0)
                .attr("y", 0.0)
                .attr("width", 0.0)
                .attr("height", 0.0);

            cards.selectAll("text")
                .style("pointer-events", "none")
                .transition()
                .duration(phase / 2)
                .style("opacity", 0.0);
        },

        toggleLabels: function () {
            if (this.mode === "node") {
                this.mode = "label";
            } else if (this.mode === "label") {
                this.mode = "node";
            } else {
                throw new Error("illegal state for mode: '" + this.mode + "'");
            }

            if (this.mode === "node") {
                this.hideLabels();
            } else if (this.mode === "label") {
                this.showLabels();
            }
        },

        renderNodes: function (cfg) {
            var that = this;

            if (cfg && cfg.cancel) {
                this.nodes.interrupt();
            }

            this.nodes
                .selectAll("circle.node")
                .style("fill", _.bind(this.prefill, this))
                .style("stroke", "blue")
                .style("stroke-width", _.bind(strokeWidth, this))
                .filter(function (d) {
                    return d.root;
                })
                .transition()
                .delay(this.transitionTime * 2)
                .each("interrupt", function () {
                    d3.select(this)
                        .style("fill", _.bind(that.fill, that));
                })
                .duration(this.transitionTime * 2)
                .style("fill", _.bind(this.fill, this));
        },

        render: function () {
            var nodeData = this.model.get("nodes"),
                linkData = this.model.get("links"),
                drag,
                me = d3.select(this.el),
                groups,
                labels,
                sel,
                that = this;

            this.nodes = me.select("g.nodes")
                .selectAll("g.node")
                .data(nodeData, _.property("key"));

            linkData = _.filter(this.model.get("links"), function (link) {
                // Filter away all "shadow" halves of bidirectional links.
                return !(link.data && link.data.bidir && _.has(link.data || {}, "reference"));
            });

            this.cola
                .nodes(nodeData)
                .links(linkData);

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
                .data(linkData, _.property("key"));

            groups = this.links.enter()
                .append("g")
                .classed("link", true);

            sel = groups.append("path")
                .style("fill", "lightslategray")
                .style("opacity", 0.0)
                .style("stroke-width", 1)
                .style("stroke", "lightslategray");

            this.postLinkAdd(sel);

            sel.transition()
                .duration(this.transitionTime)
                .style("opacity", 1.0);

            groups.append("path")
                .style("fill", "none")
                .classed("handle", true)
                .style("stroke-width", 7)
                .on("mouseenter", function () {
                    d3.select(this)
                        .classed("hovering", true);
                })
                .on("mouseout", function () {
                    d3.select(this)
                        .classed("hovering", false);
                })
                .on("click", function (d) {
                    if (d3.event.shiftKey) {
                        if (that.linkSelection.has(d.key)) {
                            that.linkSelection.remove(d.key);
                        } else {
                            that.linkSelection.add(d.key);
                        }
                    } else if (d3.event.ctrlKey) {
                        if (!that.linkSelection.has(d.key)) {
                            that.linkSelection.add(d.key);
                        }

                        that.linkSelection.focusKey(d.key);
                    } else {
                        _.each(that.linkSelection.items(), function (key) {
                            that.linkSelection.remove(key);
                        });

                        that.linkSelection.add(d.key);
                    }
                });

            (function () {
                var count = {},
                    key,
                    bumpCount;

                key = function (source, target) {
                    var min,
                        max;

                    if (source < target) {
                        min = source;
                        max = target;
                    } else {
                        min = target;
                        max = source;
                    }

                    return min + "," + max;
                };

                bumpCount = function (source, target) {
                    var name = key(source, target);
                    if (!_.has(count, name)) {
                        count[name] = 0;
                    }

                    count[name] += 1;
                    return count[name] - 1;
                };

                that.links.datum(function (d) {
                    d.linkRank = bumpCount(d.source.key, d.target.key);
                    return d;
                });
            }());

            this.links.exit()
                .transition()
                .duration(this.transitionTime)
                .style("stroke-width", 0)
                .style("opacity", 0)
                .remove();

            groups = this.nodes.enter()
                .append("g")
                .classed("node", true)
                .call(drag);

            groups.append("circle")
                .classed("node", true)
                .attr("r", 0)
                .style("fill", "limegreen")
                .on("mousedown.signal", function () {
                    // This flag prevents the selection action from occurring
                    // when we're just picking and moving nodes around.
                    that.movingNode = true;
                })
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
                .on("mouseup.signal", function () {
                    that.movingNode = false;
                })
                .transition()
                .duration(this.transitionTime)
                .attr("r", _.bind(this.nodeRadius, this));

            labels = groups.append("g");

            labels.append("rect")
                .attr("x", 0)
                .attr("y", 0)
                .attr("width", 0)
                .attr("height", 0)
                .style("pointer-events", "none")
                .style("stroke-width", "2px")
                .style("stroke", _.bind(this.fill, this))
                .style("fill", "lightgray");

            labels.append("text")
                .text(this.label)
                .datum(function (d) {
                    d.textBBox = this.getBBox();
                    return d;
                })
                .attr("x", function (d) {
                    return -d.textBBox.width / 2;
                })
                .attr("y", function (d) {
                    return d.textBBox.height / 4;
                })
                .style("opacity", 0.0)
                .style("pointer-events", "none")
                .style("cursor", "default");

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
                    .attr("transform", function (d) {
                        return "translate(" + d.x + " " + d.y + ")";
                    });

                this.links.selectAll("path")
                    .attr("d", function (d) {
                        var multiplier,
                            dx,
                            dy,
                            invLen,
                            offset,
                            flip,
                            control,
                            nControl,
                            path,
                            point,
                            data;

                        data = d.data || {};

                        point = function (x, y) {
                            return x + "," + y;
                        };

                        multiplier = 0.15 * (d.linkRank % 2 === 0 ? -d.linkRank / 2 : (d.linkRank + 1) / 2);
                        flip = d.linkRank % 2 === 0 ? -1.0 : 1.0;

                        dx = d.target.x - d.source.x;
                        dy = d.target.y - d.source.y;

                        control = {
                            x: d.source.x + 0.5*dx + multiplier * dy,
                            y: d.source.y + 0.5*dy + multiplier * -dx
                        };

                        invLen = 1.0 / Math.sqrt(dx*dx + dy*dy);
                        offset = {
                            x: flip * dy * invLen * 5,
                            y: flip * -dx * invLen * 5
                        };

                        if (d.linkRank === 0) {
                            if (data.bidir) {
                                path = [
                                    "M", point(d.source.x + 0.25 * offset.x, d.source.y + 0.25 * offset.y),
                                    "L", point(d.target.x + 0.25 * offset.x, d.target.y + 0.25 * offset.y),
                                    "L", point(d.target.x - 0.25 * offset.x, d.target.y - 0.25 * offset.y),
                                    "L", point(d.source.x - 0.25 * offset.x, d.source.y - 0.25 * offset.y)
                                ];
                            } else {
                                path = [
                                    "M", point(d.source.x + 0.5 * offset.x, d.source.y + 0.5 * offset.y),
                                    "L", point(d.target.x, d.target.y),
                                    "L", point(d.source.x - 0.5 * offset.x, d.source.y - 0.5 * offset.y)
                                ];
                            }
                        } else {
                            if (data.bidir) {
                                nControl = {
                                    x: d.source.x + 0.5*dx - multiplier * dy,
                                    y: d.source.y + 0.5*dy - multiplier * -dx
                                };

                                path = [
                                    "M", point(d.source.x + 0.5 * offset.x, d.source.y + 0.5 * offset.y),
                                    "Q", point(control.x, control.y), point(d.target.x + 0.5 * offset.x, d.target.y + 0.5 * offset.y),
                                    "L", point(d.target.x, d.target.y),
                                    "Q", point(control.x - 0.5 * offset.x, control.y - 0.5 * offset.y), point(d.source.x, d.source.y)
                                ];
                            } else {
                                path = [
                                    "M", point(d.source.x + offset.x, d.source.y + offset.y),
                                    "Q", point(control.x, control.y), point(d.target.x, d.target.y),
                                    "Q", point(control.x, control.y), point(d.source.x, d.source.y)
                                ];
                            }
                        }

                        return path.join(" ");
                    });
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
                    },
                    inBox = function (start, end, point) {
                        return between(point.x, start.x, end.x) && between(point.y, start.y, end.y);
                    };

                me.on("mousedown.select", function () {
                    if (d3.event.which !== 1 || that.movingNode) {
                        // Only select on left mouse click.
                        return;
                    }

                    active = true;
                    dragging = false;

                    d3.event.preventDefault();

                    // Disable pointer events (temporarily) on the menu panels.
                    d3.selectAll(".panel-group")
                        .style("pointer-events", "none");

                    // If shift is not held at the beginning of the operation,
                    // then remove the current selections.
                    if (!d3.event.shiftKey) {
                        _.each(that.model.get("nodes"), function (node) {
                            that.selection.remove(node.key);
                        });

                        that.renderNodes();

                        _.each(that.model.get("links"), function (link) {
                            that.linkSelection.remove(link.key);
                        });
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

                        // Restore pointer events on the menu panels.
                        d3.selectAll(".panel-group")
                            .style("pointer-events", "auto");

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

                        _.each(that.model.get("links"), function (link) {
                            if (_.any([inBox(start, end, link.source), inBox(start, end, link.target)])) {
                                that.linkSelection.add(link.key);
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

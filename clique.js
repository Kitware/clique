(function () {
    "use strict";

    var oldClique,
        clique;

    // Save old value of clique, just in case.
    oldClique = window.clique;

    // Establish a namespace for Clique.
    clique = window.clique = {};

    // Return the old value to the previous owner.
    clique.noConflict = function () {
        var handle = clique;
        clique = oldClique;
        return handle;
    };

    // Namespaces.
    clique.model = {};
    clique.view = {};
}());

(function (clique, _, Backbone, $) {
    "use strict";

    clique.adapter = {};

    clique.Adapter = function (options) {
        var accessors;

        // Keep track of accessors.
        this.accessors = accessors = {};
        this.onNewAccessor = this.onNewAccessor || _.noop;
        this.addAccessor = function (blob) {
            var mut;

            if (!_.has(accessors, blob.key)) {
                accessors[blob.key] = new clique.util.Accessor(blob);
                this.onNewAccessor(mut);
            }

            mut = accessors[blob.key];

            return mut;
        };

        // Define methods.
        this.getAccessor = _.propertyOf(accessors);

        this.findNodes = function (spec) {
            return $.when(this.findNodesImpl(spec)).then(_.partial(_.map, _, this.addAccessor, this));
        };

        this.findNode = function (spec) {
            return $.when(this.findNodesImpl(spec)).then(_.bind(function (results) {
                if (_.isEmpty(results)) {
                    return undefined;
                }

                return this.addAccessor(results[0]);
            }, this));
        };

        this.findNodeByKey = function (key) {
            return this.findNode({
                key: key
            });
        };

        this.findLinks = function (_spec) {
            var spec = clique.util.deepCopy(_spec),
                undirected = _.isUndefined(spec.undirected) ? true : spec.undirected,
                directed = _.isUndefined(spec.directed) ? true : spec.directed,
                source = spec.source,
                target = spec.target;

            delete spec.undirected;
            delete spec.directed;
            delete spec.source;
            delete spec.target;

            return $.when(this.findLinksImpl(spec, source, target, undirected, directed)).then(_.partial(_.map, _, this.addAccessor, this));
        };

        this.findLink = function (spec) {
            return $.when(this.findLinksImpl(spec)).then(_.bind(function (results) {
                if (_.isEmpty(results)) {
                    return undefined;
                }

                return this.addAccessor(results[0]);
            }, this));
        };

        this.findLinkByKey = function (key) {
            return this.findLink({
                key: key
            });
        };

        this.getNeighborLinks = function (node, opts) {
            var reqs = [];

            opts = opts || {};
            _.each(["outgoing", "incoming", "undirected"], function (mode) {
                opts[mode] = _.isUndefined(opts[mode]) ? true : opts[mode];
            });

            if (opts.outgoing) {
                reqs.push(this.findLinks({
                    source: node.key(),
                    undirected: false
                }));
            }

            if (opts.incoming) {
                reqs.push(this.findLinks({
                    target: node.key(),
                    undirected: false
                }));
            }

            if (opts.undirected) {
                reqs.push(this.findLinks({
                    source: node.key(),
                    undirected: true
                }));

                reqs.push(this.findLinks({
                    target: node.key(),
                    undirected: true
                }));
            }

            return $.when.apply($, reqs).then(function () {
                return _.reduce(_.toArray(arguments), function (memo, item) {
                    return memo.concat(item);
                }, []);
            });
        };

        this.getOutgoingLinks = function (node) {
            return this.getNeighborLinks(node, {
                outgoing: true,
                incoming: false,
                undirected: false
            });
        };

        this.getOutflowingLinks = function (node) {
            return this.getNeighborLinks(node, {
                outgoing: true,
                incoming: false,
                undirected: true
            });
        };

        this.getIncomingLinks = function (node) {
            return this.getNeighborLinks(node, {
                outgoing: false,
                incoming: true,
                undirected: false
            });
        };

        this.getInflowingLinks = function (node) {
            return this.getNeighborLinks(node, {
                outgoing: false,
                incoming: true,
                undirected: true
            });
        };

        this.getUndirectedLinks = function (node) {
            return this.getNeighborLinks(node, {
                outgoing: false,
                incoming: false,
                undirected: true
            });
        };

        this.getDirectedLinks = function (node) {
            return this.getNeighborLinks(node, {
                outgoing: true,
                incoming: true,
                undirected: false
            });
        };

        this.getNeighbors = function (node, opts) {
            var key = node.key();
            return this.getNeighborLinks(node, opts).then(_.bind(function (links) {
                var neighborKeys,
                    muts;

                neighborKeys = _.map(links, function (link) {
                    return key === link.source() ? link.target() : link.source();
                });

                // Attempt to retrieve the accessors.  The ones we don't have
                // yet will show up as undefined in this array.
                muts = _.map(neighborKeys, this.getAccessor, this);

                _.each(muts, function (mut, i) {
                    if (_.isUndefined(mut)) {
                        muts[i] = this.findNodeByKey(neighborKeys[i]);
                    } else {
                        muts[i] = $.when(muts[i]);
                    }
                }, this);

                return $.when.apply($, muts);
            }, this)).then(function () {
                return _.toArray(arguments);
            });
        };

        this.getOutgoingNeighbors = function (node) {
            return this.getNeighbors(node, {
                outgoing: true,
                incoming: false,
                undirected: false
            });
        };

        this.getOutflowingNeighbors = function (node) {
            return this.getNeighbors(node, {
                outgoing: true,
                incoming: false,
                undirected: true
            });
        };

        this.getIncomingNeighbors = function (node) {
            return this.getNeighbors(node, {
                outgoing: false,
                incoming: true,
                undirected: false
            });
        };

        this.getInflowingNeighbors = function (node) {
            return this.getNeighbors(node, {
                outgoing: false,
                incoming: true,
                undirected: true
            });
        };

        this.getUndirectedNeighbors = function (node) {
            return this.getNeighbors(node, {
                outgoing: false,
                incoming: false,
                undirected: true
            });
        };

        this.getDirectedNeighbors = function (node) {
            return this.getNeighbors(node, {
                outgoing: true,
                incoming: true,
                undirected: false
            });
        };

        this.createNode = function (data) {
            return $.when(this.createNodeImpl(data || {}))
                .then(_.bind(this.addAccessor, this));
        };

        this.createLink = function (source, target, _data, undirected) {
            var data;

            // If source/target is a accessor, call its key method to get the
            // key; otherwise, assume it is a string describing the key already.
            source = _.result(source, "key", source);
            target = _.result(target, "key", target);

            data = _data || {};
            undirected = _.isUndefined(undirected) ? false : undirected;

            return $.when(this.createLinkImpl(source, target, data, undirected))
                .then(_.bind(this.addAccessor, this));
        };

        this.destroyNode = function (node) {
            var key = node.key();
            return this.destroyNodeImpl(key).then(function (response) {
                return {
                    key: key,
                    response: response
                };
            });
        };

        this.destroyLink = function (link) {
            var key = link.key();
            return this.destroyLinkImpl(key).then(function (response) {
                return {
                    key: key,
                    response: response
                };
            });
        };

        options = options || {};
        this.initialize.apply(this, arguments);
    };

    clique.Adapter.extend = Backbone.Model.extend;

    clique.adapter.NodeLinkList = clique.Adapter.extend({
        initialize: function (options) {
            var table = {};

            this.nodes = clique.util.deepCopy(options.nodes);
            this.links = clique.util.deepCopy(options.links);

            _.each(this.nodes, function (node, i) {
                var tmpNs = "datax",
                    ns;

                // Promote the data elements into a dedicated namespace.
                //
                // First figure out a suitable temporary name to use for the
                // namespace.
                while (_.has(node, tmpNs)) {
                    tmpNs += "x";
                }

                // Create the namespace.
                ns = node[tmpNs] = {};

                // Move all top-level properties into the namespace.
                _.each(node, function (v, k) {
                    if (k !== tmpNs) {
                        ns[k] = v;
                        delete node[k];
                    }
                });

                // Rename the temporary namespace as "data".
                if (tmpNs !== "data") {
                    node.data = ns;
                    delete node[tmpNs];
                }

                table[i] = node;

                // Assign a unique key to this node.
                node.key = _.uniqueId("node_");
            });

            _.each(this.links, function (link) {
                link.key = _.uniqueId("link_");

                link.source = table[link.source];
                link.target = table[link.target];
            }, this);
        },

        findNodesImpl: function (_spec) {
            var spec = clique.util.deepCopy(_spec),
                searchspace = this.nodes,
                result;

            if (spec.key) {
                searchspace = _.filter(searchspace, function (node) {
                    return node.key === spec.key;
                });

                delete spec.key;
            }

            result = _.filter(searchspace, function (node) {
                return _.isMatch(node.data, spec);
            });

            return result;
        },

        findLinksImpl: function (spec, source, target, undirected, directed) {
            return _.filter(this.links, function (link) {
                var undirectedMatch = (link.undirected || false) === undirected,
                    directedMatch = (_.isUndefined(link.undirected) || !link.undirected) === directed,
                    sourceMatch = _.isUndefined(source) || (link.source.key === source),
                    targetMatch = _.isUndefined(target) || (link.target.key === target),
                    dataMatch = _.isMatch(spec, link.data);

                return _.every([sourceMatch, targetMatch, dataMatch, undirectedMatch || directedMatch]);
            });
        },

        newNode: _.noop,
        newLink: _.noop,
        destroyNode: _.noop,
        destroyLink: _.noop
    });
}(window.clique, window._, window.Backbone, window.jQuery));

(function (clique, Hashes, _, Backbone) {
    "use strict";

    clique.util = {};

    clique.util.deepCopy = function (o) {
        if (_.isUndefined(o)) {
            return undefined;
        }
        return JSON.parse(JSON.stringify(o));
    };

    clique.util.concat = function () {
        var lists = _.toArray(arguments);
        return _.reduce(lists, function (a, b) {
            return a.concat(b);
        }, []);
    };

    clique.util.jqSequence = function (reqs) {
        var helper,
            chain;

        helper = function (reqs, accum, i) {
            if (i === _.size(reqs)) {
                return accum;
            } else {
                accum = accum.then(function () {
                    return reqs[i];
                });

                return helper(reqs, accum, i+1);
            }
        };

        chain = Backbone.$.Deferred();
        chain.resolve();

        return helper(reqs, chain, 0);
    };

    clique.util.Set = function () {
        var items = {};

        return {
            add: function (item) {
                items[item] = null;
            },

            remove: function (item) {
                delete items[item];
            },

            has: function (item) {
                return _.has(items, item);
            },

            items: function (mapper) {
                var stuff = _.keys(items);
                if (mapper) {
                    stuff = _.map(stuff, mapper);
                }
                return stuff;
            },

            size: function () {
                return _.size(items);
            }
        };
    };

    clique.util.MultiTable = function () {
        var table = {};

        return {
            add: function (key, item) {
                if (!_.has(table, key)) {
                    table[key] = new clique.util.Set();
                }

                table[key].add(item);
            },

            remove: function (key, item) {
                if (_.has(table, key)) {
                    table[key].remove(item);
                }
            },

            strike: function (key) {
                delete table[key];
            },

            has: function (key, item) {
                return _.has(table, key) && (_.isUndefined(item) || table[key].has(item));
            },

            items: function (key) {
                if (_.has(table, key)) {
                    return table[key].items();
                }
            }
        };
    };

    clique.util.require = function (arg, name) {
        if (_.isUndefined(arg)) {
            throw new Error("argument '" + name + "' is required");
        }
    };

    clique.util.Accessor = function (raw) {
        var disallowed = new clique.util.Set();

        raw.data = raw.data || {};

        _.each(["key", "source", "target", "data"], function (d) {
            disallowed.add(d);
        });

        return _.extend({
            key: function () {
                return raw.key;
            },

            source: function () {
                return raw.source.key || raw.source;
            },

            target: function () {
                return raw.target.key || raw.target;
            },

            getAttribute: function (prop) {
                if (disallowed.has(prop)) {
                    return;
                }
                return raw[prop];
            },

            setAttribute: function (prop, value) {
                if (disallowed.has(prop)) {
                    return false;
                }

                raw[prop] = value;
                return true;
            },

            clearAttribute: function (prop) {
                if (disallowed.has(prop)) {
                    return false;
                }

                delete raw[prop];
                return true;
            },

            getAllAttributes: function () {
                var result = {};

                _.each(raw, function (value, key) {
                    if (!disallowed.has(key)) {
                        result[key] = value;
                    }
                });

                return result;
            },

            getData: function (prop) {
                return raw.data[prop];
            },

            setData: function (prop, value) {
                raw.data[prop] = value;
                this.trigger("changed", this, prop, value);
            },

            clearData: function (prop) {
                delete raw.data[prop];
                this.trigger("cleared", this, prop);
            },

            getAllData: function () {
                var result = {};

                _.each(raw.data, function (value, key) {
                    result[key] = value;
                });

                return result;
            },

            getRaw: function () {
                return raw;
            }
        }, Backbone.Events);
    };
}(window.clique, window.Hashes, window._, window.Backbone));

(function (clique, Backbone, _) {
    "use strict";

    clique.Graph = Backbone.Model.extend({
        constructor: function (options) {
            Backbone.Model.call(this, {}, options || {});
        },

        initialize: function (attributes, options) {
            clique.util.require(options.adapter, "adapter");

            this.adapter = options.adapter;

            this.nodes = {};
            this.links = new clique.util.Set();

            this.forward = new clique.util.MultiTable();
            this.back = new clique.util.MultiTable();

            this.set({
                nodes: [],
                links: []
            });
        },

        addNeighborhood: function (options) {
            var $ = Backbone.$,
                center,
                radius,
                chain,
                nextFrontier;

            clique.util.require(options.center, "center");
            clique.util.require(options.radius, "radius");

            center = options.center;
            radius = options.radius;

            nextFrontier = _.bind(function (frontier) {
                return $.when.apply($, _.map(frontier, function (node) {
                    return this.adapter.getNeighbors(node);
                }, this)).then(function () {
                    return clique.util.concat.apply(this, _.toArray(arguments));
                }).then(_.bind(function (newFrontier) {
                    return this.addNodes(newFrontier).then(function () {
                        return newFrontier;
                    });
                }, this));
            }, this);

            chain = $.when([center]);
            this.addNode(center);

            _.times(radius, function () {
                chain = chain.then(nextFrontier);
            });

            return chain;
        },

        addNode: function (node, neighborCache) {
            var request;

            // Bail if node is already in graph.
            if (_.has(this.nodes, node.key())) {
                return;
            }

            request = _.isUndefined(neighborCache) ? this.adapter.getNeighborLinks(node) : Backbone.$.when(neighborCache);

            // Get all neighboring links.
            request.then(_.bind(function (links) {
                var newLinks;

                // Add the node to the graph model.
                this.nodes[node.key()] = node.getRaw();

                // Filter away links not incident on nodes currently in the
                // graph.
                links = _.filter(links, function (link) {
                    return _.has(this.nodes, link.source()) && _.has(this.nodes, link.target());
                }, this);

                // Add the links to the graph.
                newLinks = _.compact(_.map(links, function (link) {
                    var key = link.key();

                    if (!this.links.has(key)) {
                        this.links.add(key);

                        this.forward.add(link.source(), link.target());

                        if (link.getAttribute("undirected")) {
                            this.back.add(link.target(), link.source());
                        }

                        link.getRaw().source = this.nodes[link.source()];
                        link.getRaw().target = this.nodes[link.target()];

                        return link.getRaw();
                    }
                }, this));

                this.set({
                    nodes: this.get("nodes").concat([node.getRaw()]),
                    links: this.get("links").concat(newLinks)
                });
            }, this));
        },

        addNodes: function (nodes) {
            var reqs = _.map(nodes, function (node) {
                this.addNode(node);
            }, this);

            return clique.util.jqSequence(reqs);
        },

        removeNode: function (node) {
            this.removeNeighborhood({
                center: node,
                radius: 0
            });
        },

        removeNeighborhood: function (options) {
            var center,
                radius,
                frontier,
                neighborhood,
                marked,
                newNodes,
                newLinks;

            options = options || {};
            center = options.center;
            radius = options.radius;

            clique.util.require(center, "center");
            clique.util.require(radius, "radius");

            // Compute the set of nodes that lie within the requested
            // neighborhood of the central node.
            neighborhood = new clique.util.Set();
            neighborhood.add(center.key());

            frontier = new clique.util.Set();
            frontier.add(center.key());

            _.each(_.range(radius), _.bind(function () {
                var newFrontier = new clique.util.Set();

                // Collect the outgoing and incoming nodes for each node in the
                // frontier.
                _.each(frontier.items(), _.bind(function (key) {
                    var forward = this.forward.items(key) || [],
                        back = this.back.items(key) || [];

                    _.each(forward.concat(back), function (neighbor) {
                        newFrontier.add(neighbor);
                        neighborhood.add(neighbor);
                    });
                }, this));

                frontier = newFrontier;
            }, this));

            // Mark for removal the neighborhood nodes from the node list.
            marked = new clique.util.Set();
            _.each(neighborhood.items(), _.bind(function (node) {
                marked.add(node);
                delete this.nodes[node];

                _.each(this.forward[node], _.bind(function (to) {
                    this.back.remove(to, node);
                }, this));

                _.each(this.back[node], _.bind(function (from) {
                    this.forward.remove(from, node);
                }, this));

                this.forward.strike(node);
                this.back.strike(node);
            }, this));

            // Copy over the nodes into a new array that omits the marked ones.
            newNodes = _.filter(this.get("nodes"), function (node) {
                return !marked.has(node.key);
            });

            // Copy over the links into a new array that omits ones involved
            // with deleted nodes.
            newLinks = [];
            _.each(this.get("links"), _.bind(function (link) {
                if (!marked.has(link.source.key) && !marked.has(link.target.key)) {
                    newLinks.push(link);
                } else {
                    this.links.remove(link.key);
                }
            }, this));

            // Set the new node and link data on the model.
            this.set({
                nodes: newNodes,
                links: newLinks
            });
        },

        inNeighbors: function (key) {
            return _.clone(this.back.items(key));
        },

        outNeighbors: function (key) {
            return _.clone(this.forward.items(key));
        },

        neighbors: function (key) {
            var inn = this.inNeighbors(key),
                outn = this.outNeighbors(key),
                nbs;

            if (_.isUndefined(inn) && _.isUndefined(outn)) {
                return undefined;
            }

            nbs = new clique.util.Set();
            _.each((inn || []).concat(outn || []), nbs.add, nbs);

            return nbs.items();
        },

        inDegree: function (key) {
            var neighbors = this.back.items(key);
            return neighbors && _.size(neighbors) || -1;
        },

        outDegree: function (key) {
            var neighbors = this.forward.items(key);
            return neighbors && _.size(neighbors) || -1;
        },

        degree: function (key) {
            var ind = this.inDegree(key),
                outd = this.outDegree(key);

            if (ind < 0 && outd < 0) {
                return -1;
            }

            return (ind < 0 ? 0 : ind) + (outd < 0 ? 0 : outd);
        }
    });
}(window.clique, window.Backbone, window._));

(function (clique, Backbone, _) {
    "use strict";

    clique.model.Selection = Backbone.Model.extend({
        initialize: function () {
            this.focalPoint = 0;
        },

        add: function (key) {
            this.set(key, key);
            if (this.size()) {
                this.trigger("focused", this.focused());
            }

            this.trigger("added", key);
        },

        remove: function (key) {
            var focused = this.focused() === key;

            this.unset(key);

            if (this.focalPoint >= this.size()) {
                this.focalPoint = Math.max(0, this.size() - 1);
                this.trigger("focused", this.focused());
            } else if (focused) {
                this.focusLeft();
            }

            this.trigger("removed", key);
        },

        items: function () {
            return _.keys(this.attributes);
        },

        focusKey: function (target) {
            var index = _.indexOf(this.items(), target);
            if (index === -1) {
                return false;
            }

            this.focus(index);
            return true;
        },

        focus: function (target) {
            this.focalPoint = target;
            if (this.focalPoint < 0) {
                while (this.focalPoint < 0) {
                    this.focalPoint += this.size();
                }
            } else if (this.focalPoint >= this.size()) {
                this.focalPoint = this.focalPoint % this.size();
            }

            this.trigger("focused", this.focused());
        },

        focusLeft: function () {
            this.focus(this.focalPoint - 1);
        },

        focusRight: function () {
            this.focus(this.focalPoint + 1);
        },

        focused: function () {
            return this.items()[this.focalPoint];
        },

        size: function () {
            return _.size(this.attributes);
        }
    });
}(window.clique, window.Backbone, window._));

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

            this.nodeEnter = _.bind(options.nodeEnter || function (enter) {
                var labels;

                enter.append("circle")
                    .classed("node", true)
                    .attr("r", 0)
                    .style("fill", "limegreen")
                    .transition()
                    .duration(this.transitionTime)
                    .attr("r", _.bind(this.nodeRadius, this));

                labels = enter.append("g");

                labels.append("rect")
                    .attr("x", 0)
                    .attr("y", 0)
                    .attr("width", 0)
                    .attr("height", 0)
                    .attr("rx", 5)
                    .attr("ry", 5)
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
            }, this);

            this.nodeExit = _.bind(options.nodeExit || function (exit) {
                exit.each(_.bind(function (d) {
                    this.selection.remove(d.key);
                }, this))
                    .transition()
                    .duration(this.transitionTime)
                    .attr("r", 0)
                    .style("opacity", 0)
                    .remove();
            }, this);

            this.linkEnter = _.bind(options.linkEnter || function (enter) {
                var sel;

                sel = enter.append("path")
                    .style("fill", "lightslategray")
                    .style("opacity", 0.0)
                    .style("stroke-width", 1)
                    .style("stroke", "lightslategray");

                this.postLinkAdd(sel);

                sel.transition()
                    .duration(this.transitionTime)
                    .style("opacity", 1.0);

                enter.append("path")
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
                    .on("click", _.bind(function (d) {
                        if (d3.event.shiftKey) {
                            if (this.linkSelection.has(d.key)) {
                                this.linkSelection.remove(d.key);
                            } else {
                                this.linkSelection.add(d.key);
                            }
                        } else if (d3.event.ctrlKey) {
                            if (!this.linkSelection.has(d.key)) {
                                this.linkSelection.add(d.key);
                            }

                            this.linkSelection.focusKey(d.key);
                        } else {
                            _.each(this.linkSelection.items(), function (key) {
                                this.linkSelection.remove(key);
                            });

                            this.linkSelection.add(d.key);
                        }
                    }, this));

                (_.bind(function () {
                    var key,
                        bumpCount;

                    key = function (source, target) {
                        var min,
                            max,
                            reverse = false;

                        if (source < target) {
                            min = source;
                            max = target;
                        } else {
                            reverse = true;

                            min = target;
                            max = source;
                        }

                        return {
                            name: min + "," + max,
                            reverse: reverse
                        };
                    };

                    this.count = {};

                    bumpCount = _.bind(function (source, target, undirected) {
                        var info = key(source, target),
                            name = info.name,
                            tier;

                        if (undirected) {
                            tier = "undirected";
                        } else if (info.reverse) {
                            tier = "back";
                        } else {
                            tier = "forward";
                        }

                        if (!_.has(this.count, name)) {
                            this.count[name] = {
                                forward: 0,
                                back: 0,
                                undirected: 0
                            };
                        }

                        this.count[name][tier] += 1;
                        return {
                            name: name,
                            tier: tier,
                            rank: this.count[name][tier] - 1
                        };
                    }, this);

                    this.links.datum(function (d) {
                        d.linkRank = bumpCount(d.source.key, d.target.key, d.undirected);
                        return d;
                    });
                }, this)());
            }, this);

            this.linkExit = _.bind(options.linkExit || function (exit) {
                exit.transition()
                    .duration(this.transitionTime)
                    .style("stroke-width", 0)
                    .style("opacity", 0)
                    .remove();
            }, this);

            this.renderNodes = _.bind(options.renderNodes || function (nodes) {
                var that = this;

                nodes.selectAll("circle.node")
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

                nodes.selectAll("rect")
                    .style("fill", _.bind(function (d) {
                        return d.key === this.focused ? "pink" : "lightgray";
                    }, this))
                    .style("stroke", _.bind(function (d) {
                        return this.selected.has(d.key) ? "blue" : _.bind(this.fill, this, d)();
                    }, this));

                this.renderLabels();
            }, this);

            this.onTick = _.bind(options.onTick || function () {
                this.links.selectAll("path")
                    .attr("d", _.bind(function (d) {
                        var linkRank,
                            undirectedCount,
                            undirectedOffset,
                            forwardCount,
                            backCount,
                            multiplier,
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

                        undirectedCount = this.count[d.linkRank.name].undirected;
                        undirectedOffset = Number(undirectedCount % 2 === 0);
                        forwardCount = this.count[d.linkRank.name].forward;
                        backCount = this.count[d.linkRank.name].back;

                        if (d.linkRank.tier === "undirected") {
                            linkRank = d.linkRank.rank + undirectedOffset;
                        } else if (d.linkRank.tier === "forward") {
                            linkRank = undirectedCount + undirectedOffset + 2 * d.linkRank.rank;
                        } else if (d.linkRank.tier === "back") {
                            linkRank = undirectedCount + 1 + undirectedOffset + 2 * d.linkRank.rank;
                        }

                        multiplier = 0.15 * (linkRank % 2 === 0 ? -linkRank / 2 : (linkRank + 1) / 2);
                        flip = linkRank % 2 === 0 ? -1.0 : 1.0;
                        if (d.source.key < d.target.key) {
                            // This implements "right-handedness" - make links
                            // going "forward" (whether directd or undirected)
                            // curve the other way as the ones going "backward".
                            multiplier = multiplier * -1;
                            flip = flip * -1;
                        }

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

                        if (linkRank === 0) {
                            if (d.undirected) {
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
                            if (d.undirected) {
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
                    }, this));
            }, this);

            this.label = options.label || "";
            if (!_.isFunction(this.label)) {
                this.label = _.constant(this.label);
            }
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

                this.model.adapter.getAccessor(d.key)
                    .clearAttribute("root");

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
                this.renderNodes(this.nodes);
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
            var phase = 500,
                padding = 1.1;

            this.nodes.selectAll("circle.node")
                .filter(this.label)
                .transition()
                .delay(function (d, i, j) {
                    return j * 10;
                })
                .duration(phase)
                .attr("r", 2);

            this.nodes.selectAll("rect")
                .style("pointer-events", null)
                .transition()
                .delay(phase)
                .duration(phase)
                .attr("x", function (d) {
                    return -padding * d.textBBox.width / 2;
                })
                .attr("y", function (d) {
                    return -padding * d.textBBox.height / 2;
                })
                .attr("width", function (d) {
                    return padding * d.textBBox.width;
                })
                .attr("height", function (d) {
                    return padding * d.textBBox.height;
                });

            this.nodes.selectAll("text")
                .style("pointer-events", null)
                .transition()
                .delay(phase + phase / 2)
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

            this.nodes.selectAll("circle.node")
                .transition()
                .delay(phase)
                .duration(phase)
                .attr("r", _.bind(this.nodeRadius, this));
        },

        toggleLabels: function () {
            if (this.mode === "node") {
                this.mode = "label";
            } else if (this.mode === "label") {
                this.mode = "node";
            } else {
                throw new Error("illegal state for mode: '" + this.mode + "'");
            }

            this.renderLabels();
        },

        renderLabels: function () {
            if (this.mode === "node") {
                this.hideLabels();
            } else if (this.mode === "label") {
                this.showLabels();
            }
        },

        render: function () {
            var nodeData = this.model.get("nodes"),
                linkData = this.model.get("links"),
                me = d3.select(this.el),
                groups,
                drag,
                that = this;

            this.nodes = me.select("g.nodes")
                .selectAll("g.node")
                .data(nodeData, _.property("key"));

            this.cola
                .nodes(nodeData)
                .links(linkData);

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
            this.linkEnter(groups);

            this.linkExit(this.links.exit());

            groups = this.nodes.enter()
                .append("g")
                .classed("node", true);
            this.nodeEnter(groups);

            drag = this.cola.drag()
                .on("drag", _.bind(function () {
                    this.dragging = true;
                }, this));

            groups.on("mousedown.signal", _.bind(function () {
                if (d3.event.which !== 1) {
                    return;
                }

                // This flag prevents the selection action from occurring
                // when we're just picking and moving nodes around.
                this.movingNode = true;
            }, this)).on("click", _.bind(function (d) {
                if (d3.event.which !== 1) {
                    return;
                }

                if (!this.dragging) {
                    if (d3.event.shiftKey) {
                        // If the shift key is pressed, then simply toggle
                        // the presence of the clicked node in the current
                        // selection.
                        if (this.selected.has(d.key)) {
                            this.selection.remove(d.key);
                        } else {
                            this.selection.add(d.key);
                        }
                    } else if (d3.event.ctrlKey) {
                        // If the control key is pressed, then move the
                        // focus to the clicked node, adding it to the
                        // selection first if necessary.
                        this.selection.add(d.key);
                        this.selection.focusKey(d.key);
                    } else {
                        // If the shift key isn't pressed, then clear the
                        // selection before selecting the clicked node.
                        _.each(this.selection.items(), _.bind(function (key) {
                            this.selection.remove(key);
                        }, this));

                        this.selection.add(d.key);
                    }

                    this.nodes.interrupt();
                    this.renderNodes(this.nodes);
                }
                this.dragging = false;
            }, this)).on("mouseup.signal", _.bind(function () {
                if (d3.event.which !== 1) {
                    return;
                }
                this.movingNode = false;
            }, this))
            .call(drag);

            this.renderNodes(this.nodes);

            this.nodeExit(this.nodes.exit());

            this.cola.on("tick", _.bind(function () {
                this.nodes
                    .attr("transform", function (d) {
                        return "translate(" + d.x + " " + d.y + ")";
                    });

                this.onTick();
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
                        _.each(that.model.get("nodes"), _.bind(function (node) {
                            that.selection.remove(node.key);
                        }, this));

                        that.renderNodes(that.nodes);

                        _.each(that.model.get("links"), _.bind(function (link) {
                            that.linkSelection.remove(link.key);
                        }, this));
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
                        that.nodes.interrupt();
                        that.renderNodes(that.nodes);
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

                this.trigger("render", this);
            }, this), this.transitionTime + 5);
        }
    });
}(window.clique, window.Backbone, window._, window.d3, window.cola));

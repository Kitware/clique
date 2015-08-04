(function (clique, Backbone, _) {
    "use strict";

    var $ = Backbone.$;

    clique.view.SelectionInfo = Backbone.View.extend({
        initialize: function (options) {
            var debRender;

            clique.util.require(this.model, "model");
            clique.util.require(options.graph, "graph");

            options = options || {};
            this.graph = options.graph;

            debRender = _.debounce(this.render, 100);

            this.listenTo(this.model, "change", debRender);
            this.listenTo(this.model, "focused", debRender);
            this.listenTo(this.graph, "change", debRender);
        },

        hideNode: function (node) {
            node.setTransient("selected", false);
            node.clearTransient("root");
            this.graph.removeNeighborhood({
                center: node,
                radius: 0
            });
        },

        deleteNode: function (node, deleted) {
            if (deleted) {
                node.setData("deleted", true);
                this.hideNode(node);
            } else {
                node.clearData("deleted");
                this.render();
            }
        },

        expandNode: function (node) {
            this.graph.addNeighborhood({
                center: node,
                radius: 1
            });
        },

        collapseNode: function (node) {
            var loners,
                mutators;

            // Find all neighbors of the node that have exactly one neighbor.
            loners = _.filter(this.graph.neighbors(node), function (nbr) {
                return _.size(this.graph.neighbors(nbr)) === 1;
            }, this);

            // Extract the mutator objects for these nodes.
            mutators = _.map(loners, function (key) {
                return this.graph.adapter.getMutator({
                    _id: {
                        $oid: key
                    }
                });
            }, this);

            // Hide them.
            _.each(mutators, _.partial(this.hideNode, _, false), this);
        },

        groupNodes: function (nodes) {
            var nodeSet,
                newKey;

            // Construct a new node with special properties.
            this.graph.adapter.newNode({
                grouped: true
            }).then(_.bind(function (mongoRec) {
                newKey = mongoRec._id.$oid;

                // Find all links to/from the nodes in the group.
                return $.when.apply($, _.flatten(_.map(nodes, _.bind(function (node) {
                    return [
                        this.graph.adapter.findLinks({
                            source: node
                        }),
                        this.graph.adapter.findLinks({
                            target: node
                        })
                    ];
                }, this)), true));
            }, this)).then(_.bind(function () {
                var links,
                    addLinks = [];

                links = Array.prototype.concat.apply([], Array.prototype.slice.call(arguments));

                nodeSet = new clique.util.Set();
                _.each(nodes, _.bind(function (node) {
                    nodeSet.add(node);

                    // Add an "inclusion" link between the group node and
                    // constituents.
                    addLinks.push(this.graph.adapter.newLink(newKey, node, {
                        grouping: true
                    }));
                }, this));

                _.each(links, _.bind(function (link) {
                    var source = link.getTransient("source"),
                        target = link.getTransient("target");

                    if (!nodeSet.has(source)) {
                        addLinks.push(this.graph.adapter.newLink(newKey, source));
                    }

                    if (!nodeSet.has(link.getTransient("target"))) {
                        addLinks.push(this.graph.adapter.newLink(newKey, target));
                    }
                }, this));

                return $.when.apply($, addLinks);
            }, this)).then(_.bind(function () {
                var mongoRecs = _.map(nodeSet.items(), function (key) {
                    return {
                        _id: {
                            $oid: key
                        }
                    };
                });

                this.graph.adapter.findNode({
                    key: newKey
                }).then(_.bind(function (groupNode) {
                    return this.graph.addNeighborhood({
                        center: groupNode,
                        radius: 1
                    });
                }, this)).then(_.bind(function () {
                    var children = _.map(mongoRecs, this.graph.adapter.getMutator, this.graph.adapter);
                    _.each(children, _.bind(function (child) {
                        child.setData("deleted", true);
                        this.hideNode(child);
                    }, this));
                }, this));
            }, this));
        },

        ungroupNode: function (node) {
            this.graph.adapter.findLinks({
                source: node.key(),
                grouping: true
            }).then(_.bind(function (links) {
                this.hideNode(node);
                this.graph.adapter.destroyNode(node.key());

                _.each(links, _.bind(function (link) {
                    this.graph.adapter.findNode({
                        key: link.getTransient("target")
                    }).then(_.bind(function (child) {
                        child.setData("deleted", false);
                        this.graph.addNeighborhood({
                            center: child,
                            radius: 1
                        });
                    }, this));
                }, this));
            }, this));
        },

        render: function () {
            var focused,
                renderTemplate;

            renderTemplate = _.bind(function (node) {
                this.$el.html(clique.template.selectionInfo({
                    node: node,
                    degree: node ? this.graph.degree(node.key()) : -1,
                    selectionSize: this.model.size()
                }));

                this.$("a.prev")
                    .on("click", _.bind(function () {
                        this.model.focusLeft();
                    }, this));

                this.$("a.next")
                    .on("click", _.bind(function () {
                        this.model.focusRight();
                    }, this));

                this.$("button.remove").on("click", _.bind(function () {
                    this.graph.adapter.findNode({key: this.model.focused()})
                        .then(_.bind(this.hideNode, this));
                }, this));

                this.$("button.remove-sel").on("click", _.bind(function () {
                    _.each(this.model.items(), _.bind(function (key) {
                        this.graph.adapter.findNode({key: key})
                            .then(_.bind(this.hideNode, this));
                    }, this));
                }, this));

                this.$("button.delete").on("click", _.bind(function () {
                    this.graph.adapter.findNode({key: this.model.focused()})
                        .then(_.bind(function (node) {
                            this.deleteNode(node, !node.getData("deleted"));
                        }, this));
                }, this));

                this.$("button.delete-sel").on("click", _.bind(function () {
                    _.each(this.model.items(), _.bind(function (key) {
                        this.graph.adapter.findNode({key: key})
                            .then(_.bind(this.deleteNode, this, _, true));
                    }, this));
                }, this));

                this.$("button.expand").on("click", _.bind(function () {
                    this.graph.adapter.findNode({key: this.model.focused()})
                        .then(_.bind(this.expandNode, this));
                }, this));

                this.$("button.expand-sel").on("click", _.bind(function () {
                    _.each(this.model.items(), _.bind(function (key) {
                        this.graph.adapter.findNode({ key: key})
                            .then(_.bind(this.expandNode, this));
                    }, this));
                }, this));

                this.$("button.collapser").on("click", _.bind(function () {
                    this.collapseNode(this.model.focused());
                }, this));

                this.$("button.collapser-sel").on("click", _.bind(function () {
                    _.each(this.model.items(), function (key) {
                        this.collapseNode(key);
                    }, this);
                }, this));

                this.$("button.ungroup").on("click", _.bind(function () {
                    this.graph.adapter.findNode({key: this.model.focused()})
                        .then(_.bind(this.ungroupNode, this));
                }, this));

                this.$("button.group-sel").on("click", _.bind(function () {
                    this.groupNodes(this.model.items());
                }, this));
            }, this);

            focused = this.model.focused();

            if (!focused) {
                renderTemplate(focused);
            } else {
                this.graph.adapter.findNode({key: focused})
                    .then(renderTemplate);
            }
        }
    });
}(window.clique, window.Backbone, window._));

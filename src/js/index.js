/*jshint browser: true, jquery: true */
/*global clique, _ */

function bigramGraph() {
    "use strict";

    return $.getJSON("assets/bigram.json").then(function (bigram) {
        var alphabet = "abcdefghijklmnopqrstuvwxyz",
            nodes = [],
            links = [],
            threshold = 3 * (1 / 676),
            aCodePoint = "a".codePointAt(0);

        _.each(alphabet, function (letter) {
            nodes.push({
                name: letter
            });
        });

        _.each(alphabet, function (first) {
            _.each(alphabet, function (second) {
                if (first !== second && bigram[first + second] > threshold) {
                    links.push({
                        source: first.codePointAt(0) - aCodePoint,
                        target: second.codePointAt(0) - aCodePoint
                    });
                }
            });
        });

        return {
            nodes: nodes,
            links: links
        };
    });
}

$(function () {
    "use strict";

    bigramGraph().then(function (graphData) {
        var graph,
            view,
            info;

        window.graph = graph = new clique.Graph({
            adapter: new clique.adapter.NodeLinkList(graphData)
        });

        $("#seed").on("click", function () {
            var name = $("#name").val().trim(),
                spec,
                radiusText = $("#radius").val().trim(),
                radius = Number(radiusText);

            if (name === "" || radiusText === "" || isNaN(radius)) {
                return;
            }

            spec = {
                name: name
            };

            graph.adapter.findNode(spec)
                .then(function (center) {
                    if (center) {
                        graph.addNeighborhood(center, radius);
                    }
                });
        });

        window.view = view = new clique.view.Cola({
            model: graph,
            el: "#content",
            linkDistance: 200,
            fill: function (d) {
                var colors = [
                    "rgb(166,206,227)",
                    "rgb(31,120,180)",
                    "rgb(178,223,138)",
                    "rgb(51,160,44)",
                    "rgb(251,154,153)",
                    "rgb(227,26,28)",
                    "rgb(253,191,111)",
                    "rgb(255,127,0)",
                    "rgb(202,178,214)",
                    "rgb(106,61,154)",
                    "rgb(255,255,153)",
                    "rgb(177,89,40)"
                ];

                return colors[(d.data.name.codePointAt(0) - "a".codePointAt(0)) % colors.length];
            }
        });

        info = new clique.view.SelectionInfo({
            model: view.selection,
            el: "#info",
            graph: graph,
            nodeButtons: [
                {
                    label: "Hide",
                    color: "purple",
                    icon: "eye-close",
                    callback: function (node) {
                        _.bind(clique.view.SelectionInfo.hideNode, this)(node);
                    }
                },
                {
                    label: function (node) {
                        return node.getData("deleted") ? "Undelete" : "Delete";
                    },
                    color: "red",
                    icon: "remove",
                    callback: function (node) {
                        _.bind(clique.view.SelectionInfo.deleteNode, this)(node);
                    }
                },
                {
                    label: "Ungroup",
                    color: "blue",
                    icon: "scissors",
                    callback: function (node) {
                        console.log(node);
                    },
                    show: function (node) {
                        return node.getData("grouped");
                    }

                },
                {
                    label: "Expand",
                    color: "blue",
                    icon: "fullscreen",
                    callback: function (node) {
                        _.bind(clique.view.SelectionInfo.expandNode, this)(node);
                    }
                },
                {
                    label: "Collapse",
                    color: "blue",
                    icon: "resize-small",
                    callback: function (node) {
                        _.bind(clique.view.SelectionInfo.collapseNode, this)(node);
                    }
                }
            ],
            selectionButtons: [
                {
                    label: "Hide",
                    color: "purple",
                    icon: "eye-close",
                    repeat: true,
                    callback: function (node) {
                        _.bind(clique.view.SelectionInfo.hideNode, this)(node);
                    }
                },
                {
                    label: "Delete",
                    color: "red",
                    icon: "remove",
                    repeat: true,
                    callback: function (node) {
                        return _.bind(clique.view.SelectionInfo.deleteNode, this)(node);
                    }
                },
                {
                    label: "Expand",
                    color: "blue",
                    icon: "fullscreen",
                    repeat: true,
                    callback: function (node) {
                        _.bind(clique.view.SelectionInfo.expandNode, this)(node);
                    }
                },
                {
                    label: "Collapse",
                    color: "blue",
                    icon: "resize-small",
                    repeat: true,
                    callback: function (node) {
                        _.bind(clique.view.SelectionInfo.collapseNode, this)(node);
                    }
                }
            ]
        });
        info.render();
    });
});

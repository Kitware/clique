/*jshint browser: true, jquery: true */
/*global clique, _ */

function bigramGraph() {
    "use strict";

    // Construct a graph based on bigram frequency in the English language. The
    // nodes each represent a letter of the alphabet, while a link from one
    // letter to another means the bigram frequency of those two letter is
    // greater than three times that predicted by chance alone. If the reverse
    // bigram also has this property, the link will be undirected.
    return $.getJSON("assets/bigram.json").then(function (bigram) {
        var alphabet = "abcdefghijklmnopqrstuvwxyz",
            nodes = [],
            links = [],
            threshold = 3 * (1 / 676),
            done = {},
            aCodePoint = "a".codePointAt(0);

        // Construct the node set, one per English letter.
        _.each(alphabet, function (letter) {
            nodes.push({
                name: letter
            });
        });

        // Iterate through each possible bigram.
        _.each(alphabet, function (first) {
            _.each(alphabet, function (second) {
                var key = first + second,
                    rev = second + first,
                    link;

                // Omitting double letters (not supported by Clique cola view),
                // check to see whether the bigram has high enough frequence
                // (and wasn't already processed as a frequent reverse of an
                // earlier bigram).
                if (first !== second && !_.has(done, key) && bigram[key] > threshold) {
                    link = {
                        source: first.codePointAt(0) - aCodePoint,
                        target: second.codePointAt(0) - aCodePoint
                    };

                    // Make the link undirected if the reverse bigram is
                    // sufficiently frequent as well.
                    if (bigram[rev] > threshold) {
                        link.undirected = true;
                        done[rev] = null;
                    }

                    links.push(link);
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
                spec;

            if (name === "") {
                return;
            }

            spec = {
                name: name
            };

            graph.adapter.findNode(spec)
                .then(function (center) {
                    if (center) {
                        graph.addNode(center);
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

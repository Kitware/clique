import bigram from './bigram.json';
import Set from 'es6-set';
import $ from 'jquery';
import 'bootstrap/dist/js/bootstrap.js';
import _ from 'underscore';
import { Graph } from './../../clique/model.js';
import { NodeLinkList } from './../../clique/adapter.js';
import { Cola } from './../../clique/view.js';
import { SelectionInfo } from './../../clique/view.js';
import { LinkInfo } from './../../clique/view.js';

const aCodePoint = 'a'.codePointAt(0);

function bigramGraph (data) {
  // Construct the node set, one per English letter.
  const alphabet = 'abcdefghijklmnopqrstuvwxyz';
  let nodes = [];
  for (let letter of alphabet) {
    nodes.push({
      name: letter
    });
  }

  // Iterate through each possible bigram.
  let done = new Set();
  const threshold = 3 * (1 / 676);
  let links = [];
  for (let first of alphabet) {
    for (let second of alphabet) {
      const key = first + second;
      const rev = second + first;

      // Omitting double letters (not supported by Clique cola view), check to
      // see whether the bigram has high enough frequency (and wasn't already
      // processed as a frequent reverse of an earlier bigram).
      if (first !== second && !done.has(key) && data[key] > threshold) {
        let link = {
          source: first.codePointAt(0) - aCodePoint,
          target: second.codePointAt(0) - aCodePoint,
          data: {
            letters: `${first}-${second}`,
            forward_frequency: data[key]
          }
        };

        // Make the link undirected if the reverse bigram is sufficiently
        // frequent as well.
        if (data[rev] > threshold) {
          link.undirected = true;
          link.data.back_frequency = data[rev];
          done.add(rev);
        }

        links.push(link);
      }
    }
  }

  return {
    nodes,
    links
  };
}

import './bootswatch.less';
import './index.styl';

$(function () {
  const html = require('./index.jade');
  $('body').html(html());

  const {nodes, links} = bigramGraph(bigram);
  let graph = new Graph({
    adapter: new NodeLinkList(nodes, links)
  });

  $('#seed').on('click', function () {
    const name = $('#name').val().trim();
    if (name === '') {
      return;
    }

    const spec = {
      name
    };

    graph.adapter.findNode(spec)
      .then(function (center) {
        if (center) {
          graph.addNode(center);
        }
      });
  });

  let view = new Cola({
    model: graph,
    el: '#content',
    linkDistance: 200,
    fill: function (d) {
      var colors = [
        'rgb(166,206,227)',
        'rgb(31,120,180)',
        'rgb(178,223,138)',
        'rgb(51,160,44)',
        'rgb(251,154,153)',
        'rgb(227,26,28)',
        'rgb(253,191,111)',
        'rgb(255,127,0)',
        'rgb(202,178,214)',
        'rgb(106,61,154)',
        'rgb(255,255,153)',
        'rgb(177,89,40)'
      ];

      return colors[(d.data.name.codePointAt(0) - aCodePoint) % colors.length];
    }
  });

  let info = new SelectionInfo({
    model: view.selection,
    el: '#info',
    graph: graph,
    nodeButtons: [
      {
        label: 'Hide',
        color: 'purple',
        icon: 'eye-close',
        callback: function (node) {
          _.bind(SelectionInfo.hideNode, this)(node);
        }
      },
      {
        label: function (node) {
          return node.getData('deleted') ? 'Undelete' : 'Delete';
        },
        color: 'red',
        icon: 'remove',
        callback: function (node) {
          _.bind(SelectionInfo.deleteNode, this)(node);
        }
      },
      {
        label: 'Ungroup',
        color: 'blue',
        icon: 'scissors',
        callback: function (node) {
          console.log(node);
        },
        show: function (node) {
          return node.getData('grouped');
        }

      },
      {
        label: 'Expand',
        color: 'blue',
        icon: 'fullscreen',
        callback: function (node) {
          _.bind(SelectionInfo.expandNode, this)(node);
        }
      },
      {
        label: 'Collapse',
        color: 'blue',
        icon: 'resize-small',
        callback: function (node) {
          _.bind(SelectionInfo.collapseNode, this)(node);
        }
      }
    ],
    selectionButtons: [
      {
        label: 'Hide',
        color: 'purple',
        icon: 'eye-close',
        repeat: true,
        callback: function (node) {
          _.bind(SelectionInfo.hideNode, this)(node);
        }
      },
      {
        label: 'Delete',
        color: 'red',
        icon: 'remove',
        repeat: true,
        callback: function (node) {
          return _.bind(SelectionInfo.deleteNode, this)(node);
        }
      },
      {
        label: 'Expand',
        color: 'blue',
        icon: 'fullscreen',
        repeat: true,
        callback: function (node) {
          _.bind(SelectionInfo.expandNode, this)(node);
        }
      },
      {
        label: 'Collapse',
        color: 'blue',
        icon: 'resize-small',
        repeat: true,
        callback: function (node) {
          _.bind(SelectionInfo.collapseNode, this)(node);
        }
      }
    ]
  });
  info.render();

  let linkInfo = new LinkInfo({
    model: view.linkSelection,
    el: '#link-info',
    graph: graph
  });
  linkInfo.render();
});

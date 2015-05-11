# Clique
Graph editor library/application

**Clique** is a library for processing social network graphs, using *adapters*
to load in graph data from any source, a client application (such as the example
application included in this repository) to explore, manipulate, and annotate
the graph, and the adapters' ability to perform *writebacks* to save the updated
graph for later use.

This document contains some information about Clique's API.

## Clique API

Clique has two major components:  a ``Graph`` class to explore and annotate a
social network graph (implemented as a [Backbone](http://backbonejs.org/)
model), and an ``Adapter`` API which can be implemented to provide a path from
any source of graph data into the format required by ``Graph`` to do its work.

### ``Graph`` class

``Graph`` is a JavaScript class with the following properties and methods:

- ``new Graph(options)`` - Unlike an ordinary Backbone model, the ``Graph``
  constructor does not take an object describing the initial model attributes,
  but only an ``options`` object containing the following properties:

  - ``adapter`` - a graph data adapter object.

- ``addNeighborhood(options)`` - This method queries the adapter for the graph
  neighborhood described by ``options``, and blends that subgraph into the
  ``Graph``'s current view of the network.  The ``options`` object should contain
  at least a ``center`` property identifying a node in the graph, and the
  ``radius`` property, which specifies how many hops out to go from the center.
  Any other properties of the ``options`` object are bound by the particular
  adapter associated with this ``Graph`` instance.

- ``removeNeighborhood(options)``.  This method removes the neighborhood
  specified by ``options.center`` and ``options.radius`` from the ``Graph``'s
  view of the graph.  This includes both the nodes and links making up the
  neighborhood itself, as well as any links connecting the outermost nodes of the
  neighborhood to the rest of the current view of the graph, if any.  Setting
  ``options.radius`` to ``0`` will cause just the center node to be removed in
  this manner.

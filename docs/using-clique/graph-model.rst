=============
 Graph Model
=============

Central to Clique is the notion of a graph or network. Mathematically, a graph
is defined as set of vertices (or *nodes*) :math:`V` together with a set of edges (or
*links*) :math:`E` , each of which names two nodes that it connects. Depending
on other properties ascribed to :math:`V` and :math:`E`, different types of
graphs can result, such as directed/undirected, simple/multi, and combinations
of these.

Broadly speaking, Clique's graph model is a sort of hybrid. Nominally, links are
directed; however, they can be marked undirected as needed, on a case-by-case
basis. Links from a node to itself (*loops*) are allowed, as are multiple links
between a given pair of nodes. Furthermore, data may be carried by both nodes
and links; these may be useful for visualization and computation, to simulate a
weighted graph (by placing floating point values on the links), or may otherwise
be used to model some problem in a general way.

Terminology
===========

Throughout this documentation (and the Clique source code) we will use the
following terms to describe graphs and networks:

Graph
    Also known as a *network*, this is a collection of nodes and links as
    discussed above.

Node
    A single object belonging to a graph. A node can have data, as a collection
    of key-value pairs, associated with it. In the standard visualization that
    ships with Clique, nodes are represented as circles.

Link
    A connection between a pair of nodes. As with nodes, links can carry data
    (again, as a set of key-value pairs). By default, links are *directed*,
    meaning they flow from one node to the other. However, they can be marked
    *undirected*, in which case the directional distinction disappears. The
    standard visualization depicts links as tapered (for directed links) or
    untapered (for undirected links) lines attached at both ends to the nodes it
    connects.

    Clique's graphs are technically *multigraphs*, so multiple distinct links
    are allowed between a given pair of nodes. These links might vary in
    directionality, and they carry completely separate data. Loops (that is,
    links going from a node to itself) are allowed as well.

Data
    Nodes and links may be associated with data, as a set of key-value pairs.
    The data is completely arbitrary and can encode the particulars of the
    problem being modeled with Clique graphs. For instance, you might choose to
    include a boolean ``deleted`` flag on your nodes, and direct your
    application logic not to report the existence of such nodes when searching
    or walking along the edges of a graph. Or, you might choose to store
    *weights* on your links in order to simulate a weighted graph (e.g., for
    applying `Dijkstra's algorithm
    <https://en.wikipedia.org/wiki/Dijkstra%27s_algorithm>`_, etc.).

Subgraph
    A graph formed from a subset of another graph's nodes and links. Clique
    operates on the basis that it may be useful to view a graph from a close-up
    vantage, focusing on a few nodes and links at a time. As such, most
    visualizations designed on top of Clique will focus on a changing subgraph
    of a much larger, fuller graph. On occasion, to focus on the currently
    visualized portion of a large graph, we will use this term.

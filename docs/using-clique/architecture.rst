=======================
 Software Architecture
=======================

To implement Clique's :ref:`graph-model`, Clique supplies some APIs for
querying, representing, manipulating, and visualizing graphs, arranged as a
collection of JavaScript object types. This section explains at a high level
what these objects are and how they fit together to form a Clique application.
For particular details of the APIs themselves, see :ref:`data-adapter`,
:ref:`backbone-graph`, and :ref:`backbone-view`.

Components
==========

The major software components Clique are the *graph data adapter*, the *Backbone
graph model* and the *Backbone graph view*. These components are used to
retrieve graph data from storage, form a local subgraph suitable for holding in
memory by the application, and visualize the local graph data, respectively.

Graph Data Adapter
------------------

The graph data adapter forms the heart of a Clique application. It is
responsible for interpreting queries from the user for nodes or links, then
retrieving the appropriate raw data from a backing store, and converting that
raw response into a standardized format used by Clique for all such descriptions
of graphs and subgraphs.

To provide an example of the possibly very different kinds of backends such
adapters can handle, Clique ships with two data adapters: one uses in-memory
arrays as the original source of the graph data, while the other uses a Mongo
database. Both export the same API (see :ref:`data-adapter` for an in-depth
description) and can therefore be used in place of each other in a given
application.

The generic data adapter is based around two primitive operations: "find nodes"
and "find links". These can be used to search the data store for nodes or links
matching certain properties, which can then be retrieved to bootstrap the
visualization portion of the application.

To implement a new data adapter, it is necessary to define the "find"
operations, deferring to whatever even more primitive operations the particular
backend might require. For example, the in-memory array adapter simply uses an
inefficient, linear filter operation against the data arrays, culling the nodes
or links matching the requested specification. By contrast, the Mongo adapter
constructs a database query which, if the database itself is optimized and
indexed properly, should return results much more quickly.

Other compound operations are exported by the data adapter API, expressed by
default in terms of the primitive operations. For example, there is a "get
neighbor nodes" operation, which by default calls "get links", looking for links
connected to the target node, then moves through the link data, collecting all
nodes appearing on the far side of the target node, and finally returning this
set of nodes. It is expected that many data adapters will provide their own
implementation of this, and other operations, to take again advantage of the
particular backend in question. For instance, the Mongo adapter is able to
perform "get neighbor nodes" much more efficiently than the naive base
implementation by constructing a single compound query to retrieve all neighbor
nodes at once, rather than issuing several primitive requests as the base
implementation does.

For more details about how graph data adapters work, and how to develop one, see
:ref:`data-adapter` and :ref:`tour-mongo`.

Backbone Graph Model
--------------------

Clique's infrastructure is built as a flexible collection of `Backbone
<http://backbonejs.org/>`_ models, views, and events. ``Graph`` is a central
model that partners with a data adapter to store a subgraph from the backing
store as a collection of node and link objects. The model provides a few
high-performance methods to query the state of the currently available subgraph,
but mainly exists as a convenient data source for creating visualizations.

A graph model object is instantiated by passing in the data adapter to be used
as the interface to the target graph. The graph model has an ``addNode()``
method that requests data through its data adapter and adds the resulting node
data to the local model, together with any links to available nodes. For
instance, in the example application (see :ref:`bigram-app-tour`) when the user
types in a letter and clicks the "query" button, the data adapter is directed to
perform a node search, and the result is passed to the model's ``addNode()``
method to cause the model to update with the new data. In turn, the model emits
a ``change`` event, which is picked up by the view object, which finally
re-renders the graph, including the newest node.

In general, if an application requires, e.g., different events emitted when
certain things happen, the ``Graph`` JavaScript class can be extended to a new
class that implements the necessary behavior.

Backbrone Graph View
--------------------

The graph model's partner is the graph view. Backbone view objects are rather
general, since how to view the data in some particular model is a very
application-specific matter. Clique's notion of graph views is similarly
abstract; therefore, Clique ships with a basic, yet flexible graph view that
uses SVG and `cola.js <http://marvl.infotech.monash.edu/webcola/>`_ to provide a
generic but well-designed node-link diagram that, by default, works for all
graphs. This ``Cola`` view is full-featured enough to serve many graph
visualization tasks, yet represents only one idea for how to visualize graphs.
Peculiar use cases where a node-link diagram is insufficient simply require the
developer to create a new instance of a Backbone view object.

Clique also ships with other, more specific views, in particular to provide
table views of the data values residing on nodes and links. As an example, if
you click on a node in the example application, you will see a table of data
appear in the control panel, in the "Selection Operations" section. This view
responds to changes in the graph view's selection state, and displays the
appropriate data accordingly.

This is just to give an idea of how flexible and wide-ranging the concept of a
"view" can be in Backbone and Clique. For more details on the many options and
settings available in the ``Cola`` view, see :ref:`backbone-view`.

General Application Dataflow
============================

Many Clique applications will have a common dataflow structure. In such
applications, a *graph data adapter* is instantiated and used in turn to
instantiate a *graph model*. This model's "change" event will be attached to a
*graph view* to cause it to re-render the model.

Some type of application level event (e.g., typing in search terms, or clicking
a "search" button) will cause the adapter's find function (either for nodes, or
links) to be engaged, and the results will be added to the model via its
``addNode()`` method. This in turn will touch off a re-rendering of the
on-screen view of the graph.

Finally, the view itself will often react to user input as well. For instance,
when a node or link is clicked, this event may be registered to a view that
shows the data residing on that node or link; it may also, e.g., bring up a
context menu that has operations in it like hiding the node, or seeking out its
neighbors (via data adapter) and adding those to the visualization (via the
``addNode()`` method).

Of course, Clique and its software components are supremely flexible, enough to
support not just the foregoing application logic pattern, but also unusual
scenarios in which keeping a node-link diagram updated on screen is not the
major goal. By adapting the way in which the application responds to input,
implementing custom data adapters to retrieve data in a particular format, and
designing custom models and view to handle the graph data in particular ways,
any graph-based application can be designed using Clique.

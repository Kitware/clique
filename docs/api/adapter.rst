.. _data-adapter:

.. todo::
    Fill in adapter API section

==============
 Data Adapter
==============

The graph data adapter is a class that provides services for retrieving graph
data from and posting updates to a backing store of arbitrary nature and
configuration. It is what allows Clique to be agnostic about the kinds of graph
data it can work with.

To demonstrate just a sampling of the kinds of backends Clique can support,
Clique ships with two data adapter instances: ``NodeLinkList``
[#nll-inefficient]_ and ``Mongo``.  ``NodeLinkList`` uses a pair of arrays as
its graph data store (one for the nodes and one for links), while ``Mongo`` uses
a specified database and collection in a Mongo server running on some host. Both
adapters supply a few required low-level operations to implement their exact
behavior; ``Mongo`` additionally overrides a few more because it can provide
much better performance on certain operations using Mongo's strengths as a
database system.

For more details about how a concrete data adapter is built, see
:ref:`tour-mongo`.

Asynchronicity and Promises
===========================

In the general case, a data adapter operates by firing off an HTTP request to
some resource that can compute the requested results. ``NodeLinkList`` (the
demonstration adapter that ships with Clique), operating on data in browser
memory, represents an exception. Generally speaking, then, data adapters must
work on an *asynchronous* basis. Asynchronicity is a common programming paradigm
for the web, and Clique embraces it wholeheartedly.

Therefore, the ``Adapter`` methods that return data to the user do so using
*promise objects*\ —in particular, `JQuery Deferred objects
<https://api.jquery.com/category/deferred-object/>`_. [#promise]_ Even when an
adapter can compute results synchronously (e.g., ``NodeLinkList``), the
``Adapter`` base infrastructure converts such results into promises
automatically.

Data Accessors
==============

The *Data Accessor* is the interface used to communicate about a node or link
between the adapter and the client application. Data accessors are objects that
maintain a pointer to a raw data object representing a node or link, and provide
read and write access to that data via accessor and mutator functions. When the
mutator methods of a data accessor are used, the object emits an event
describing the mutation; the originating data adapter can react to this event to
cause the backing store to be updated in the appropriate manner. For example,
the ``Mongo`` data adapter can intercept such mutation events and react by
issuing the appropriate commands to the Mongo server to update data fields as
requested. For a detailed example of how this is set up, see :ref:`tour-mongo`.

By comparison, if a raw data object were given to the client instead, changes
made to that object would be impossible to relay back to the data store, which
would result in a read-only graph.

APIs
====

Accessor API
------------

Adapter API
-----------

Clique's ``Adapter`` is an *abstract base class* that provides access to data
services from some particular source of graph data. That is, the most
fundamental behaviors of this class vary with the application and must be
provided by the developer.

The heart of this class is the ``findNodes()`` and ``findLinks()`` functions;
these enable bootstrapping a Clique application with graph data, serving as a
springboard for further interactions both with the user and the data backend.

This section details the API for ``Adapter``, explaining just which methods need
to be specified, and which can optionally be overridden (usually for performance
or application logic reasons).

To create a concrete subclass of ``Adapter``, use a construction like the
following:

.. code:: javascript

    var MyAdapter = clique.Adapter.extend({
        initialize: function (...) {
            .
            .
            .
        },

        findNodesRaw: function (...) {
            .
            .
            .
        },

        .
        .
        .
    });

    var adapter = new MyAdapter(...);

The mention of each method in the argument to ``eAdapter.extend()`` will
override that method's implementation in the resulting ``MyAdapter`` class.

Abstract behavior
^^^^^^^^^^^^^^^^^

The following seven methods have no default implementation; the ones marked as
*Overridable: required* must be given implementations

.. js:function:: Adapter.initialize([...])

    :overridable: yes

    This method is called automatically as the last step when initializing a new instance of
    the adapter (i.e. when the ``new`` operator is used). Whatever arguments are
    given to the constructor will be passed along whole to the invocation.
    
    Note that, generally speaking, you never have to invoke this method
    explicitly. For example, in the following code block,

    .. code:: javascript

        var adapter = new MyAdapter("foo", 5, {
            database: "foo",
            collection: "bar"
        });

    ``MyAdapter``'s initialize method will be called automatically, being passed
    the arguments shown above.

    Use this method to perform any adapter-specific initialization that needs to
    be done once per instance. For example, the ``Mongo`` data adapter uses its
    ``initialize()`` method to store the Mongo host, database, and collection it
    will use to query from, as variables stored in its ``this`` context.

.. js:function:: Adapter.findNodesRaw(spec, offset, limit)

    :overridable: required

.. js:function:: Adapter.findLinksRaw(spec, source, target, directed, offset, limit)

    :overridable: required

.. js:function:: Adapter.createNode(data)

    :overridable: required

.. js:function:: Adapter.createLink(source, target, data, undirected)

    :overridable: required

.. js:function:: Adapter.destroyNode(node)

    :overridable: required

.. js:function:: Adapter.destroyLink(link)

    :overridable: required

.. js:function:: Adapter.findNodes(cfg)

    :overridable: no

    :param Object cfg.spec: The data search specification; defaults to ``{}``
    :param Number cfg.offset: The paging offset; defaults to ``0``
    :param Number cfg.limit: The paging limit; defaults to ``null``

    :returns:
        A promise object for a (possibly empty) array of node data accessors.

    This is a required method without which the adapter cannot function (the
    default implementation simply ``throw``\ s an error object.

.. js:function:: Adapter.findNode(spec)

    :overridable: no

.. js:function:: Adapter.findNodeByKey(key)

    :overridable: no

.. js:function:: Adapter.findLinks(cfg)

    :overridable: no

.. js:function:: Adapter.findLink(spec)

    :overridable: no

.. js:function:: Adapter.findLinkByKey(key)

    :overridable: no

.. js:function:: Adapter.neighborLinkCount(node[, opts])

    :overridable: yes

.. js:function:: Adapter.outgoingLinkCount(node)

    :overridable: no

.. js:function:: Adapter.outflowingLinkCount(node)

    :overridable: no

.. js:function:: Adapter.incomingLinkCount(node)

    :overridable: no

.. js:function:: Adapter.inflowingLinkCount(node)

    :overridable: no

.. js:function:: Adapter.undirectedLinkCount(node)

    :overridable: no

.. js:function:: Adapter.directedLinkCount(node)

    :overridable: no

.. js:function:: Adapter.neighborLinks(node, opts)

    :overridable: yes

.. js:function:: Adapter.outgoingLinks(node)

    :overridable: no

.. js:function:: Adapter.outflowingLinks(node)

    :overridable: no

.. js:function:: Adapter.incomingLinks(node)

    :overridable: no

.. js:function:: Adapter.inflowingLinks(node)

    :overridable: no

.. js:function:: Adapter.undirectedLinks(node)

    :overridable: no

.. js:function:: Adapter.directedLinks(node)

    :overridable: no

.. js:function:: Adapter.neighborNodeCount(node, opts)

    :overridable: yes

.. js:function:: Adapter.outgoingNodeCount(node)

    :overridable: no

.. js:function:: Adapter.outflowingNodeCount(node)

    :overridable: no

.. js:function:: Adapter.incomingNodeCount(node)

    :overridable: no

.. js:function:: Adapter.inflowingNodeCount(node)

    :overridable: no

.. js:function:: Adapter.undirectedNodeCount(node)

    :overridable: no

.. js:function:: Adapter.directedNodeCount(node)

    :overridable: no

.. js:function:: Adapter.neighborNodes(node, opts)

    :overridable: yes

.. js:function:: Adapter.outgoingNodes(node)

    :overridable: no

.. js:function:: Adapter.outflowingNodes(node)

    :overridable: no

.. js:function:: Adapter.incomingNodes(node)

    :overridable: no

.. js:function:: Adapter.inflowingNodes(node)

    :overridable: no

.. js:function:: Adapter.undirectedNodes(node)

    :overridable: no

.. js:function:: Adapter.directedNodes(node)

    :overridable: no

.. rubric:: Footnotes

.. [#nll-inefficient]
    Keep in mind that ``NodeLinkList`` exists only for demonstration purposes—it
    provides inefficient search functionality for the benefit of keeping its
    source code simple.

.. [#promise]

    Of course, since JavaScript effectively uses `duck typing
    <https://en.wikipedia.org/wiki/Duck_typing>`_, any object
    with a ``.then()`` method that passes the computed data to a callback will
    work here. However, using JQuery's ``Deferred`` object is the easiest way to
    achieve that.

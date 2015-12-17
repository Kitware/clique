.. Clique documentation master file, created by
   sphinx-quickstart on Wed Dec  9 18:08:27 2015.
   You can adapt this file completely to your liking, but it should at least
   contain the root `toctree` directive.

.. todolist::

Welcome to Clique's documentation!
==================================

**Clique** is a JavaScript library for handling, visualizing, and computing with
graphs and networks as part of your web application. Clique uses *adapters* to
load in graph data from any source, which is then piped on demand to models and
views in the browser. The views provide visualization and user interaction with
the graph, while the adapter can trickle in data from even the largest graphs,
allowing you to explore graphs step by step, from the bottom up, to formulate
insights about your data that are not possible solely from large graph
visualization techniques.

Clique is also a *framework* - you can use the built in models and views to get
started quickly, or you can design your own custom visualization to match the
particulars of your problems and applications. Clique is built on top of
`Backbone <http://backbonejs.org/>`_ (and `Underscore
<http://underscorejs.org/>`_) to provide a general collection of objects that
you can extend and deploy as needed.

This documentation will include descriptions of the kinds of graph and network
services Clique provides, along with a discussion of possible use cases, before
describing the API of the data adapters, and how to write your own. Finally, it
will provide examples of building a Clique application from the ground up.

Clique is open source software. Visit the `GitHub repository
<https://github.com/Kitware/clique/>`_ to explore the code, file issues, and
contribute!

Using Clique
============

.. toctree::
    :maxdepth: 2

    using-clique/overview
    using-clique/graph-model
    using-clique/architecture

Tutorials
=========

.. toctree::
    :maxdepth: 2

    tutorials/tour-example
    tutorials/tour-mongo
    tutorials/from-scratch

Clique API
==========

.. toctree::
    :maxdepth: 2

    api/adapter.rst
    api/graph.rst
    api/view.rst

Indices and tables
==================

* :ref:`genindex`
* :ref:`modindex`
* :ref:`search`


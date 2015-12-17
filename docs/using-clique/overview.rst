==========
 Overview
==========

.. todo::
    Fill in Overview section

Clique is a JavaScript framework library for designing, creating, displaying,
and interacting with visualizations for graph data. The framework nature of
Clique means you can design a custom mode of visualization for your particular
data, while its library nature means you can include such visualizations
directly in any web application. Such applications may be focused solely on
exploring and visualizing a graph or network, or they may include a Clique
component to aid in providing data to another part of the application as a
selector UI, for instance.

Clique is different from other graph visualization systems in that it provides a
bottom-up approach to understanding graphs and networks. The primitive
operations in Clique are focused at the node or vertex level: you can search the
graph data for a particular node matching certain properties, import that node,
then explore its neighbors by querying its edges. This enables an exploratory
mode where you walk along edges in the graph step by step, uncovering new nodes
and structure as you go. Clique can also give you a medium-scale understanding
of more global structure in your data, which you may choose to couple with other
tools that can handle the largest-scale structures of the graph or network.

Installing Clique
=================

Clique can be either built from source, then included manually in your project,
or imported via `Bower <http://bower.io/>`_.

Installing from Bower
---------------------

Installing from Bower is straightforward. The following command will accomplish
it:

.. code:: sh

    bower install clique

creating a ``bower_components`` directory (if it didn't already exist), with the
following structure:

.. code:: sh

    bower_components
    └── clique
        ├── bower.json
        ├── clique.js
        ├── clique.min.js
        └── tangelo
            └── mongo
                ├── python
                │   ├── __init__.py
                │   └── util.py
                └── web
                    ├── clear.py
                    ├── destroyNode.py
                    ├── findLinks.py
                    ├── findNodes.py
                    ├── mongo.js
                    ├── neighborhood.py
                    ├── newLink.py
                    ├── newNode.py
                    ├── rexster.py
                    └── update.py

From here, you can manually copy ``clique.js`` and ``clique.min.js`` into your
own application.

The other alternative is to include Clique as a Bower dependency in your web
project, as described `here <http://bower.io/docs/creating-packages/>`_. A
command like:

.. code:: sh

    bower install clique --save

or

.. code:: sh

    bower install clique --save-dev

will update your ``bower.json`` file so that Clique is installed when you build
your project.

Building from Source
--------------------

Running the Example Application
===============================

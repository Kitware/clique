==========
 Overview
==========

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

Clique is a `Gulp <http://gulpjs.com/>`_ project with dependencies taken from
both `Node <https://nodejs.org/>`_ and `Bower <http://bower.io/>`_. To build,
follow these steps.

1. Make sure you have Node, Bower, Gulp, and `Tangelo
   <http://tangelo.readthedocs.org/en/v0.9/>`_ installed.

2. Clone the Clique Git repository and move into the directory:

.. code::

    git clone https://github.com/Kitware/clique
    cd clique

3. Install the Node dependencies:

.. code::

    npm install

4. Build the project with Gulp:

.. code::

    gulp

If all goes well, you should now have a directory ``build/site`` containing
``clique.js`` and ``clique.min.js`` files, and an example application
demonstrating Clique.

Running the Example Application
===============================

After following the build instructions above, you will be able to run the
example application as follows:

.. code::

    gulp serve

This command will attempt to serve the application to the web at ``localhost``,
port 3000. If this port is unavailable on your computer, you can use a command
like the following instead:

.. code::

    tangelo --port 9000 --root build/site --config tangelo-config.yaml

varying the ``--port`` parameter to an appropriate value.

If you now visit http://localhost:3000, you'll be greeted by a blank canvas and
an input form. This application visualizes the prevalence of two-letter
sequences (bigrams) in an English-language corpus. Out of all :math:`26^2 = 676`
possible bigrams, some will occur at a much greater rate than chance (i.e.,
their relative frequency of occurrence will be more than :math:`\frac{1}{676}
\approx 0.0015`). The graph in this application is structured to contain an edge
from letter :math:`l_1` to :math:`l_2` if the bigram frequency of :math:`l_1
l_2` is at least 3 times the "chance" rate. If both :math:`l_1 l_2` and
:math:`l_2 l_1` meet the threshold, then instead of containing two
unidirectional links, the graph will contain a single, bidirectional link
between the appropriate nodes.

For instance, if you type "f" into the query field and click the query button,
you will see a single node representing the letter "f" appear. Click on this
node to select it, then click the "expand" button in the left panel. You should
see a single link, with a node on the far end, appear. This is a bidirectional
link indicating that bigrams for both "of" and "fo" appear frequently. Repeat
this process on the "o" node to see a more complex subgraph appear (since "o",
being a vowel, is involved in several frequent bigrams). As you can see,
unidirectional links appear as curved, tapered lines, while bi-directional ones
are straight and untapered. These choices were implemented in the standard
*view* used to produce this visualization. A custom view with very different
behavior could be created to serve different needs.

See :ref:`bigram-app-tour` for a detailed analysis of how this application was
constructed.

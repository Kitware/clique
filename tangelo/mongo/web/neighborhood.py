from bson.objectid import ObjectId
import itertools
from pymongo import MongoClient


def process_node(node):
    return {"key": str(node["_id"]),
            "data": node.get("data", {})}


def process_link(link):
    return {"key": str(link["_id"]),
            "source": str(link["source"]),
            "target": str(link["target"]),
            "data": link.get("data", {})}


def run(host=None, db=None, coll=None, start_key=None, radius=None, linklimit=None):
    # Connect to database.
    graph = MongoClient(host)[db][coll]

    # Prepare arguments.
    radius = int(radius)
    linklimit = int(linklimit) if linklimit is not None else None

    # Find the starting node in the database.
    start = graph.find_one({"_id": ObjectId(start_key)})
    if start is None:
        return {"nodes": [],
                "links": []}

    # Initialize return value data.
    nbd_nodes = {start_key: start}
    nbd_links = {}

    # Initialize frontier.
    frontier = [start]

    # Walk through each level of the neighborhood, computing new frontiers as we
    # go.
    for i in range(radius + 1):
        new_frontier = {}

        # Compute the next frontier from the current frontier.
        for node in frontier:
            node_id = node["_id"]

            # Find all incoming and outgoing links from the node.
            links = graph.find({"type": "link",
                                "$or": [{"source": node_id},
                                        {"target": node_id}]})

            # Collect the neighbor nodes of the node and all them to the new
            # frontier if they have not already been seen previously.
            for link in itertools.islice(links, linklimit):
                is_source = link["source"] == node_id
                noid = link["target"] if is_source else link["source"]

                neighbor = graph.find_one({"_id": noid})
                if neighbor is not None:
                    # If on the final level (at the final frontier) don't add
                    # the neighbor nodes, just the neighbor links.
                    if i < radius and noid not in nbd_nodes:
                        nbd_nodes[noid] = neighbor
                        new_frontier[noid] = neighbor

                    nbd_links[link["_id"]] = link

        # Set the new frontier equal to the one we just computed.
        frontier = new_frontier.values()

    return {"nodes": map(process_node, nbd_nodes.values()),
            "links": map(process_link, nbd_links.values())}

from bson.objectid import ObjectId
import json
from pymongo import MongoClient


def run(host=None, db=None, coll=None, node=None, outgoing="true", incoming="true", undirected="true"):
    # Connect to the mongo collection.
    graph = MongoClient(host)[db][coll]

    outgoing = json.loads(outgoing)
    incoming = json.loads(incoming)
    undirected = json.loads(undirected)

    # Construct the query according to the given options.
    query = {"type": "link"}
    clauses = []
    oid = ObjectId(node)
    if outgoing or incoming:
        dirclauses = []
        orclause = {"$or": [{"undirected": {"$not": {"$exists": 1}}},
                            {"undirected": False}]}
        if outgoing:
            dirclauses.append({"source": oid})

        if incoming:
            dirclauses.append({"target": oid})

        clauses.append({"$and": [orclause, {"$or": dirclauses}]})

    if undirected:
        clauses.append({"$and": [{"undirected": True},
                                 {"$or": [{"source": oid},
                                          {"target": oid}]}]})

    query["$or"] = clauses

    # Get all the links
    links = graph.find(query)

    # Count the unique nodes adjacent to the target node.
    seen = set()
    for link in links:
        source = str(link["source"])
        target = str(link["target"])

        nbr = source if node == target else target
        seen.add(nbr)

    return json.dumps(len(seen))

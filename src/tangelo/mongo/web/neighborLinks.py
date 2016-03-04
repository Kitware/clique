from bson.objectid import ObjectId
import bson.json_util
import json
from pymongo import MongoClient


def run(host=None, db=None, coll=None, node=None, outgoing="true", incoming="true", undirected="true", offset=0, limit=0):
    # Connect to the mongo collection.
    graph = MongoClient(host)[db][coll]

    outgoing = json.loads(outgoing)
    incoming = json.loads(incoming)
    undirected = json.loads(undirected)

    offset = int(offset)
    limit = int(limit)

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

    return bson.json_util.dumps(list(graph.find(query, skip=offset, limit=limit)))

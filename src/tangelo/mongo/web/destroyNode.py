import json

import bson.json_util
from bson.objectid import ObjectId
from pymongo import MongoClient

import tangelo


def run(host=None, db=None, coll=None, key=""):
    # Connect to the Mongo collection
    client = MongoClient(host)
    db = client[db]
    graph = db[coll]

    # Find the target node; make sure it (1) exists and (2) is a node.
    oid = ObjectId(key)
    victim = graph.find_one({"_id": oid})

    if victim is None:
        tangelo.http_status(400, "Bad Argument")
        return {"error": "No node with key %s" % (key)}

    if victim.get("type") != "node":
        tangelo.http_status(400, "Bad Argument")
        return {"error": "Document with key %s is not a node" % (key),
                "document": json.loads(bson.json_util.dumps(victim))}

    # Remove all links associated to the target node.
    graph.remove({"type": "link",
                  "$or": [{"source": oid},
                          {"target": oid}]})

    # Remove the node itself.
    graph.remove({"_id": oid})

    return "OK"

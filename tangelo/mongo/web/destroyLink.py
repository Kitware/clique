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
        return {"error": "No link with key %s" % (key)}

    if victim.get("type") != "link":
        tangelo.http_status(400, "Bad Argument")
        return {"error": "Document with key %s is not a link" % (key),
                "document": json.loads(bson.json_util.dumps(victim))}

    # Remove the link itself.
    graph.remove({"_id": oid})

    return "OK"

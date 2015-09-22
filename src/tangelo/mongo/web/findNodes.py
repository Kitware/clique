import bson.json_util
from bson.objectid import ObjectId
import json
from pymongo import MongoClient


def run(host=None, db=None, coll=None, spec=None, singleton=json.dumps(False)):
    # Connect to the mongo collection.
    client = MongoClient(host)
    db = client[db]
    graph = db[coll]

    spec = bson.json_util.loads(spec)
    singleton = json.loads(singleton)

    spec.update({"type": "node"})

    if singleton:
        result = graph.find_one(spec)
    else:
        result = list(graph.find(spec))

    return bson.json_util.dumps(result)

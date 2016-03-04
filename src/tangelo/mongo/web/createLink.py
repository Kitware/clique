import json

import bson.json_util
from bson.objectid import ObjectId
from pymongo import MongoClient

from tangelo.plugin.mongo import readValue


def run(host=None, db=None, coll=None, source=None, target=None, data="{}", undirected="false"):
    # Connect to the Mongo collection
    client = MongoClient(host)
    db = client[db]
    graph = db[coll]

    data = json.loads(data)
    undirected = json.loads(undirected)

    rec = {"_id": ObjectId(),
           "type": "link",
           "source": ObjectId(source),
           "target": ObjectId(target),
           "data": {k: readValue(v) for k, v in data.iteritems()}}

    if undirected:
        rec["undirected"] = True

    graph.insert_one(rec)

    return bson.json_util.dumps(rec)

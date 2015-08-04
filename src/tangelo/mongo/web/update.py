from bson.objectid import ObjectId
import json
from pymongo import MongoClient


def run(host=None, db=None, coll=None, key=None, prop=None, value=None):
    # Connect to the Mongo collection
    client = MongoClient(host)
    db = client[db]
    graph = db[coll]

    value = json.loads(value)

    graph.update({"_id": ObjectId(key)}, {"$set": {"data.%s" % (prop): value}})

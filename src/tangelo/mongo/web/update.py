from bson.objectid import ObjectId
from pymongo import MongoClient


def readValue(value):
    try:
        return float(value)
    except ValueError:
        pass

    try:
        return int(value)
    except ValueError:
        pass

    return value


def run(host=None, db=None, coll=None, key=None, prop=None, value=None):
    # Connect to the Mongo collection
    client = MongoClient(host)
    db = client[db]
    graph = db[coll]

    value = readValue(value)

    graph.update({"_id": ObjectId(key)}, {"$set": {"data.%s" % (prop): value}})

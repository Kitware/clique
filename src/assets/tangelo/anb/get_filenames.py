from pymongo import MongoClient


def run(host=None, db=None, coll=None):
    client = MongoClient(host)
    db = client[db]
    graph = db[coll]

    return graph.distinct("data.filename", {"type": "node"})

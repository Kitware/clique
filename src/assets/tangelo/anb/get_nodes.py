from pymongo import MongoClient


def run(host=None, db=None, coll=None, filename=None):
    client = MongoClient(host)
    db = client[db]
    graph = db[coll]

    return graph.distinct("data.label", {"type": "node",
                                         "data.filename": filename})

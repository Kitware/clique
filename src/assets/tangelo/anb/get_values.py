from pymongo import MongoClient


def run(host=None, db=None, coll=None, field=None):
    client = MongoClient(host)
    db = client[db]
    graph = db[coll]

    return sorted(list(set(map(lambda x: x["data"][field], graph.find({"type": "node", "data.%s" % (field): {"$exists": 1}})))))

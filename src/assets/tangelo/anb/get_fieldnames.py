from pymongo import MongoClient


def run(host=None, db=None, coll=None):
    client = MongoClient(host)
    db = client[db]
    graph = db["%s.fields" % (coll)]

    # Reverse sort the entries by frequency.
    return map(lambda x: x["_id"], sorted(graph.find(), lambda x, y: int(y["value"]) - int(x["value"])))

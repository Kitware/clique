import bson.json_util
import json
from pymongo import MongoClient
import tangelo

def run(host=None, db=None, coll=None, spec=None):
    # Connect to the mongo collection.
    client = MongoClient(host)
    db = client[db]
    graph = db[coll]

    spec = json.loads(spec)

    matcher = {"type": "node"}
    for field, value in spec.iteritems():
        matcher["data.%s" % (field)] = value

    return bson.json_util.dumps(list(graph.find(matcher)))

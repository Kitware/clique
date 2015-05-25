import bson.json_util
import json
from pymongo import MongoClient
import tangelo

def run(host=None, db=None, coll=None, spec=None, singleton=json.dumps(False)):
    # Connect to the mongo collection.
    client = MongoClient(host)
    db = client[db]
    graph = db[coll]

    spec = json.loads(spec)
    singleton = json.loads(singleton)

    matcher = {"type": "node"}
    for field, value in spec.iteritems():
        matcher["data.%s" % (field)] = value

    it = graph.find(matcher)
    try:
        result = it.next() if singleton else list(it)
    except StopIteration:
        result = None

    return bson.json_util.dumps(result)

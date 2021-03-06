import bson.json_util
from bson.objectid import ObjectId
import json
from pymongo import MongoClient


def run(host=None, db=None, coll=None, spec=None, offset=None, limit=None):
    # Connect to the mongo collection.
    client = MongoClient(host)
    db = client[db]
    graph = db[coll]

    # Parse the offset and limit arguments.
    offset = 0 if offset is None else int(offset)
    limit = 0 if limit is None else int(limit)

    spec = json.loads(spec)
    spec2 = {"type": "node"}
    for k, v in spec.iteritems():
        if k == "key":
            spec2["_id"] = ObjectId(v)
        else:
            spec2["data.%s" % (k)] = v

    result = list(graph.find(spec2, skip=offset, limit=limit))

    return bson.json_util.dumps(result)

import bson.json_util
from bson.objectid import ObjectId
import json
from pymongo import MongoClient

import tangelo


def run(host=None, db=None, coll=None, spec=None):
    tangelo.log_warning(spec)

    # Connect to the mongo collection.
    client = MongoClient(host)
    db = client[db]
    graph = db[coll]

    spec = json.loads(spec)
    spec2 = {"type": "node"}
    for k, v in spec.iteritems():
        if k == "key":
            tangelo.log_warning(v)
            spec2["_id"] = ObjectId(v)
        else:
            spec2["data.%s" % (k)] = v

    tangelo.log_warning(spec2)

    result = list(graph.find(spec2))

    return bson.json_util.dumps(result)

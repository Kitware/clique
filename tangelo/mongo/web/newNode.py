import json

import bson.json_util
from bson.objectid import ObjectId
from pymongo import MongoClient
import tangelo

from tangelo.plugin.mongo import readValue


@tangelo.types(data=json.loads)
def run(host=None, db=None, coll=None, data={}):
    # Connect to the Mongo collection
    client = MongoClient(host)
    db = client[db]
    graph = db[coll]

    tangelo.log_warning(data)

    rec = {"_id": ObjectId(),
           "type": "node",
           "data": {k: readValue(v) for k, v in data.iteritems()}}

    graph.insert_one(rec)

    return bson.json_util.dumps(rec)

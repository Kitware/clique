import bson.json_util
from bson.objectid import ObjectId
import json
from pymongo import MongoClient


def run(host=None, db=None, coll=None, spec=None, singleton=json.dumps(False)):
    # Connect to the mongo collection.
    client = MongoClient(host)
    db = client[db]
    graph = db[coll]

    spec = json.loads(spec)
    singleton = json.loads(singleton)

    # Look for links matching the keys and metadata specified.
    matcher = {"type": "link"}
    for field, value in spec.iteritems():
        if field == "key":
            matcher["_id"] = ObjectId(value)
        elif field in ["source", "target"]:
            matcher[field] = ObjectId(value)
        else:
            matcher["data.%s" % (field)] = value

    # Formulate an exception for the shadow-halves of bidirectional links.
    no_shadow = {"$or": [{"data.bidir": {"$ne": True}},
                         {"data.reference": {"$not": {"$exists": True}}}]}

    # Join the content and exception queries together.
    query = {"$and": [matcher, no_shadow]}

    # Perform the query and return the result(s).
    it = graph.find(query)
    try:
        result = it.next() if singleton else list(it)
    except StopIteration:
        result = None

    return bson.json_util.dumps(result)

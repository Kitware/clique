import bson.json_util
from bson.objectid import ObjectId
import json
from pymongo import MongoClient


def load_json(value, default):
    return default if value is None else json.loads(value)


def run(host=None, db=None, coll=None, spec=None, source=None, target=None, directed=None):
    # Connect to the mongo collection.
    client = MongoClient(host)
    db = client[db]
    graph = db[coll]

    spec = load_json(spec, {})
    directed = load_json(directed, None)

    # Look for links matching the keys and metadata specified.
    matcher = {"type": "link"}
    for field, value in spec.iteritems():
        if field == "key":
            matcher["_id"] = ObjectId(value)
        else:
            matcher["data.%s" % (field)] = value

    if source is not None:
        matcher["source"] = ObjectId(source)

    if target is not None:
        matcher["target"] = ObjectId(target)

    directedness = []

    if directed is not None:
        if directed:
            directedness.append({"undirected": {"$exists": False}})
            directedness.append({"undirected": False})
        else:
            directedness.append({"undirected": True})

    if len(directedness) > 0:
        directedness = {"$or": directedness}
    else:
        directedness = {}

    # Join the content, directedness, and exception queries together.
    query = {"$and": [matcher, directedness]}

    # Perform the query and return the result(s).
    return bson.json_util.dumps(list(graph.find(query)))

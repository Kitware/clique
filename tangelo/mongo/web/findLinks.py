import bson.json_util
from bson.objectid import ObjectId
import json
from pymongo import MongoClient


def load_json(value, default):
    return default if value is None else json.loads(value)


def run(host=None, db=None, coll=None, spec=None, source=None, target=None, undirected=None, directed=None):
    # Connect to the mongo collection.
    client = MongoClient(host)
    db = client[db]
    graph = db[coll]

    spec = load_json(spec, {})
    # source = load_json(source, None)
    # target = load_json(target, None)
    undirected = load_json(undirected, True)
    directed = load_json(directed, True)

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

    if not undirected:
        directedness.append({"data.bidir": {"$exists": False}})

    if not directed:
        directedness.append({"data.bidir": True,
                             "data.reference": {"$exists": False}})

    if len(directedness) > 0:
        directedness = {"$or": directedness}
    else:
        directedness = {}

    # Formulate an exception for the shadow-halves of bidirectional links.
    no_shadow = {"$or": [{"data.bidir": {"$ne": True}},
                         {"data.reference": {"$not": {"$exists": True}}}]}

    # Join the content, directedness, and exception queries together.
    query = {"$and": [matcher, directedness, no_shadow]}

    # Perform the query and return the result(s).
    return bson.json_util.dumps(list(graph.find(query)))

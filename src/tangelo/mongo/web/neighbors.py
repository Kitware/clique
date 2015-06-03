from bson.objectid import ObjectId
import json
from pymongo import MongoClient


def run(host=None, db=None, coll=None, start=None, deleted=None):
    # Connect to the Mongo collection
    client = MongoClient(host)
    db = client[db]
    graph = db[coll]

    # Prepare the arguments.
    deleted = json.loads(deleted)

    query = {"_id": ObjectId(start)}
    center_node = graph.find_one(query)
    if center_node is None:
        return None

    center_id = center_node["data"]["id"]

    query_clauses = [{"type": "link"},
                     {"$or": [{"data.source": center_id},
                              {"data.target": center_id}]}]

    if not deleted:
        query_clauses.append({"$or": [{"data.deleted": {"$exists": False}},
                                      {"data.deleted": False}]})

    neighbors = {"incoming": [],
                 "outgoing": []}

    for link in graph.find({"$and": query_clauses}):
        source = link["data"]["source"] != center_id

        neighbor_id = link["data"]["source"] if source else link["data"]["target"]
        neighbor = graph.find_one({"type": "node",
                                   "data.id": neighbor_id})
        neighbors["incoming" if source else "outgoing"].append(str(neighbor["_id"]))

    return neighbors

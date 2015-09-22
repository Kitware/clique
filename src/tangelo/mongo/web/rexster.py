import tangelo

from bson.objectid import ObjectId
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure


def vertices(m, id=None, op=None, key=None, value=None):
    if id is not None:
        # Return the requested vertex
        vertex = m.find_one({"_id": ObjectId(id)})

        if vertex is None or vertex["type"] != "node":
            tangelo.http_status(404)
            return {"error": "No such vertex"}

        response = {"version": "*.*",
                    "results": {"_type": "vertex",
                                "_id": id},
                    "queryTime": 0.0}
        for key, value in vertex.get("data", {}).iteritems():
            response["results"][key] = value

        return response

    tangelo.http_status(501)
    return {"error": "unimplemented"}


def edges(m, id=None, key=None, value=None):
    def convert(mongoEdge):
        edge = {k: str(v) if isinstance(v, ObjectId) else v for k, v in mongoEdge.get("data", {}).iteritems()}
        edge["_id"] = str(mongoEdge["_id"])
        edge["_type"] = "edge"
        edge["_inV"] = str(mongoEdge["source"])
        edge["_outV"] = str(mongoEdge["target"])

        return edge

    if id is None and key is None and value is None:
        # Return all edges.
        results = map(convert, m.find({"type": "link"}))
        return {"version": "*.*",
                "results": results,
                "queryTime": 0.0}

    tangelo.http_status(501)
    return {"error": "unimplemented"}


@tangelo.restful
def get(mainOp, graph, op, *args, **qargs):
    if mainOp != "graphs":
        tangelo.http_status(400)
        return {"error": "'%s' is not a legal method" % (mainOp)}

    graph_path = graph.split(",")
    if len(graph_path) == 2:
        host = "localhost"
        db = graph_path[0]
        coll = graph_path[1]
    elif len(graph_path) == 3:
        host = graph_path[0]
        db = graph_path[1]
        coll = graph_path[2]
    else:
        tangelo.http_status(400)
        return {"error": "Invalid graph name %s" % (graph)}

    try:
        m = MongoClient(host)[db][coll]
    except ConnectionFailure:
        tangelo.http_status(404)
        return {"error": "Could not connect to graph %s" % (graph)}

    if op == "vertices":
        return vertices(m, *args, **qargs)
    elif op == "edges":
        return edges(m, *args, **qargs)
    else:
        tangelo.http_status(501)
        return {"error": "Operation %s not implemented"}

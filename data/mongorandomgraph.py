import bson.json_util
from bson.objectid import ObjectId
import itertools
import random
import string
import sys


def emit_node(name):
    oid = ObjectId()

    print bson.json_util.dumps({"_id": oid,
                                "type": "node",
                                "data": {"name": name}})

    return oid


def emit_link(oid1, oid2, undirected=False):
    oid = ObjectId()

    record = {"_id": oid,
              "type": "link",
              "source": oid1,
              "target": oid2,
              "data": {}}

    if undirected:
        record["undirected"] = True

    print bson.json_util.dumps(record)


def main():
    table = {letter: emit_node(letter) for letter in string.ascii_lowercase}

    for (a, b) in itertools.product(string.ascii_lowercase, repeat=2):
        if a == b:
            continue

        if random.random() > 0.2:
            undirected = random.random() > 0.5

            emit_link(table[a], table[b], undirected)

if __name__ == "__main__":
    sys.exit(main())

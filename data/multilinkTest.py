import bson.json_util
from bson.objectid import ObjectId

import sys


def main():
    node1 = ObjectId()
    print bson.json_util.dumps({"_id": node1,
                                "type": "node",
                                "data": {"foo": "bar"}})

    node2 = ObjectId()
    print bson.json_util.dumps({"_id": node2,
                                "type": "node",
                                "data": {"foo": "bar"}})


    link1 = ObjectId()
    print bson.json_util.dumps({"_id": link1,
                                "type": "link",
                                "source": node1,
                                "target": node2,
                                "data": {"bidir": True}})

    link2 = ObjectId()
    print bson.json_util.dumps({"_id": link2,
                                "type": "link",
                                "source": node1,
                                "target": node2,
                                "data": {"bidir": True}})

    link3 = ObjectId()
    print bson.json_util.dumps({"_id": link3,
                                "type": "link",
                                "source": node1,
                                "target": node2})

    link4 = ObjectId()
    print bson.json_util.dumps({"_id": link4,
                                "type": "link",
                                "source": node2,
                                "target": node1})

    node5 = ObjectId()
    print bson.json_util.dumps({"_id": node5,
                                "type": "node",
                                "data": {"foo": "bar"}})

    node6 = ObjectId()
    print bson.json_util.dumps({"_id": node6,
                                "type": "node",
                                "data": {"foo": "bar"}})


    link5 = ObjectId()
    print bson.json_util.dumps({"_id": link5,
                                "type": "link",
                                "source": node5,
                                "target": node6})

    link6 = ObjectId()
    print bson.json_util.dumps({"_id": link6,
                                "type": "link",
                                "source": node5,
                                "target": node6,
                                "data": {"bidir": True}})

    link7 = ObjectId()
    print bson.json_util.dumps({"_id": link7,
                                "type": "link",
                                "source": node5,
                                "target": node6})

    link8 = ObjectId()
    print bson.json_util.dumps({"_id": link8,
                                "type": "link",
                                "source": node6,
                                "target": node5})

if __name__ == "__main__":
    sys.exit(main())

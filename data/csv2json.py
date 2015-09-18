import csv
import itertools
import json
import pprint
import sys

import bson.json_util
from bson.objectid import ObjectId


def emit_node(node):
    oid = ObjectId()
    print bson.json_util.dumps({"_id": oid,
                                "type": "node",
                                "data": node})
    return oid


def emit_link(link, source, target, bi=False):
    oid = ObjectId()
    output = {"_id": oid,
              "type": "link",
              "source": source,
              "target": target,
              "data": link}
    if bi:
        output["data"]["bidir"] = True

    print bson.json_util.dumps(output)

    if bi:
        print bson.json_util.dumps({"_id": ObjectId(),
                                    "type": "link",
                                    "data": {"bidir": True,
                                             "reference": oid},
                                    "source": target,
                                    "target": source})


def make_node_record(filename=None, label=None, semtype=None, card=None, attr=None):
    attr_dict = {}
    if attr:
        attr = json.loads(attr)

        for o in attr:
            attr_dict[o["Name"]] = o["Value"]

    card_dict = {}
    if card:
        card = json.loads(card)

        for o in card:
            if "Summary" in o:
                summary = o["Summary"]
                if summary in card_dict:
                    print >>sys.stderr, "Warning: duplicate Summary field '%s'" % (summary)
                card_dict[summary] = o.get("Text", "")

    base = {"filename": filename,
            "label": label,
            "type": semtype}

    base.update(attr_dict)
    base.update(card_dict)

    return base


def make_link_record(filename=None, label=None, semtype=None, contype=None, card=None, attr=None):
    attr_dict = {}
    if attr:
        attr = json.loads(attr)

        for o in attr:
            attr_dict[o["Name"]] = o["Value"]

    card_dict = {}
    if card:
        card = json.loads(card)

        for o in card:
            if "Summary" in o:
                summary = o["Summary"]
                if summary in card_dict:
                    print >>sys.stderr, "Warning: duplicate Summary field '%s'" % (summary)
                card_dict[summary] = o.get("Text", "")

    base = {"filename": filename,
            "label": label,
            "semtype": semtype,
            "contype": contype}

    base.update(attr_dict)
    base.update(card_dict)

    return base


def find_list_starts(row):
    return map(lambda x: x[0], filter(lambda x: x[1].startswith("["), enumerate(row)))


def get_filename(text):
    return text.split("\\")[-1].split(".")[0]


def main():
    try:
        nodefile = sys.argv[1]
        linkfile = sys.argv[2]
    except IndexError:
        print >>sys.stderr, "usage: csv2json.py nodefile linkfile"
        return 1

    # Initialize a table of nodes within this file.
    nodetable = {}

    # Process the node file, keeping track of the label-to-oid mapping.
    with open(nodefile) as node:
        for row in itertools.islice(csv.reader(node, quoting=csv.QUOTE_NONE, escapechar="^"), 1, None):
            json_starts = find_list_starts(row)

            if len(json_starts) == 1:
                json_starts = [json_starts[0] - 1, json_starts[0]]
            elif len(json_starts) != 2:
                print >>sys.stderr, "JSON detection failed:"
                pprint.pprint(row)
                pprint.pprint(json_starts)
                sys.exit(1)

            attr = ",".join(row[json_starts[1]:])
            card = ",".join(row[json_starts[0]:json_starts[1]])
            semtype = row[json_starts[0] - 1]
            label = ",".join(row[1:json_starts[0] - 1])
            filename = get_filename(row[0])

            try:
                oid = emit_node(make_node_record(filename, label, semtype, card, attr))
                nodetable[label] = oid
            except ValueError:
                print >>sys.stderr, "Could not construct record for data line:"
                pprint.pprint(row, stream=sys.stderr)
                pprint.pprint([label, semtype, card, attr], stream=sys.stderr)
                raise

    # Process the link file, using the oid table to construct link entries.
    with open(linkfile) as link:
        for row in itertools.islice(csv.reader(link, quoting=csv.QUOTE_NONE, escapechar="^"), 1, None):
            json_starts = find_list_starts(row)

            if len(json_starts) == 1:
                json_starts = [json_starts[0] - 1, json_starts[0]]
            elif len(json_starts) != 2:
                print >>sys.stderr, "JSON detection failed:"
                pprint.pprint(row, stream=sys.stderr)
                pprint.pprint(json_starts, stream=sys.stderr)
                sys.exit(1)

            attr = ",".join(row[json_starts[1]:])
            card = ",".join(row[json_starts[0]:json_starts[1]])
            contype = row[json_starts[0] - 1]
            direction = row[json_starts[0] - 2]
            right = row[json_starts[0] - 3]
            left = row[json_starts[0] - 4]
            semtype = row[2]
            label = row[1]
            filename = get_filename(row[0])

            if left not in nodetable:
                nodetable[left] = emit_node(make_node_record(filename, left))

            if right not in nodetable:
                nodetable[right] = emit_node(make_node_record(filename, right))
            
            left = nodetable[left]
            right = nodetable[right]

            # Determine the correct directionality of the link.
            (source, target) = (left, right) if direction == "-->" else (right, left)

            # Set a flag indicating if the link is bidirectional.
            bidir = direction == "---"

            try:
                emit_link(make_link_record(filename, label, semtype, contype, card, attr), source, target, bidir)
            except ValueError:
                print >>sys.stderr, "Could not construct record for data line:"
                pprint.pprint(row, stream=sys.stderr)
                pprint.pprint([label, semtype, card, attr], stream=sys.stderr)
                sys.exit(1)
        

if __name__ == "__main__":
    sys.exit(main())

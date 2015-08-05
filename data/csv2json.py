import csv
import itertools
import json
import sys

import pprint


def make_record(filename=None, label=None, semtype=None, card=None, attr=None):
    return {"filename": filename,
            "label": label,
            "type": semtype,
            "card": json.loads(card) if card else card,
            "attr": json.loads(attr) if attr else attr}


def find_list_starts(row):
    #return [entry.endswith("]") for entry in row[3:]].index(True) + 3
    return map(lambda x: x[0], filter(lambda x: x[1].startswith("["), enumerate(row)))


def get_filename(text):
    return text.split("\\")[-1].split(".")[0]


def main():
    for row in itertools.islice(csv.reader(sys.stdin, quoting=csv.QUOTE_NONE), 1, None):
        json_starts = find_list_starts(row)

        if len(json_starts) == 1:
            json_starts = [json_starts[0] - 1, json_starts[0]]
        elif len(json_starts) != 2:
            pprint.pprint(row)
            pprint.pprint(json_starts)
            raise ValueError

        attr = ",".join(row[json_starts[1]:])
        card = ",".join(row[json_starts[0]:json_starts[1]])
        semtype = row[json_starts[0] - 1]
        label = ",".join(row[1:json_starts[0] - 1])
        filename = get_filename(row[0])

        try:
            pprint.pprint(make_record(filename, label, semtype, card, attr))
        except ValueError:
            print "---"
            pprint.pprint(row)
            pprint.pprint([label, semtype, card, attr])
            print "--"


if __name__ == "__main__":
    sys.exit(main())

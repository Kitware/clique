from pymongo import MongoClient
import sys


def main():
    if len(sys.argv) < 3:
        print >>sys.stderr, "usage: unique-fields.py <hostname> <database> <collection>"
        return 1

    host = sys.argv[1]
    db = sys.argv[2]
    coll = sys.argv[3]

    m = MongoClient(host)[db][coll]

    mapFunction = open("map.js").read()
    reduceFunction = open("reduce.js").read()

    result = m.map_reduce(mapFunction, reduceFunction, "%s.fields" % (coll))


if __name__ == "__main__":
    sys.exit(main())

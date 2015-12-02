import json
import lxml.html
from lxml.cssselect import CSSSelector
import requests
import sys


def main():
    raw = requests.get("http://norvig.com/mayzner.html")
    if not raw:
        print >>sys.stderr, "Request failed with code %d" % (raw.status_code)
        return 1

    tree = lxml.html.fromstring(raw.text)

    sel = CSSSelector("td")

    freq = {key[:-1].lower(): float(value[:-2]) / 100 for key, value, _ in map(lambda x: x.get("title").split(), filter(lambda y: y.get("title") is not None, sel(tree)))}

    print json.dumps(freq)
    return 0

if __name__ == "__main__":
    sys.exit(main())

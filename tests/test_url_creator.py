import sys
sys.path.append("../slave")

import url_creator

creators = [
    url_creator.getUrlCreator("mozilla-inbound"),
    url_creator.getUrlCreator("mozilla-aurora"),
    url_creator.getUrlCreator("mozilla-beta"),
    url_creator.getUrlCreator("mozilla-central"),
    url_creator.getUrlCreator("mozilla-release"),
    url_creator.getUrlCreator("chrome"),
    url_creator.getUrlCreator("webkit")
]

# Test 1
for creator in creators:
    urls = creator.find()
    assert urls
    assert len(urls) > 0

# Test 2
creator = url_creator.getUrlCreator("mozilla-inbound")
urls = creator.find("4a38ccb01816")
assert urls
assert len(urls) > 0


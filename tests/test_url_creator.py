#!/usr/bin/env python2

import sys
sys.path.append("../slave")

import url_creator

repos = [
    "mozilla-inbound",
    "mozilla-central",
    "mozilla-aurora",
    # "mozilla-beta", # TODO no 32 bits
    # "mozilla-release", # TODO no 32 bits
    "chrome",
    "webkit",
]

archs = [
    '32bits',
    '64bits'
]

for repo in repos:
    for arch in archs:
        print "Testing optimized download for {} on {}.".format(repo, arch)

        urls = url_creator.get(arch, repo).find(buildtype='opt')
        assert urls
        assert len(urls) > 0

        print "PASSED"
        print ""

for arch in archs:
    print "Testing PGO download for mozilla-central on {}.".format(arch)
    urls = url_creator.get(arch, "mozilla-central").find(buildtype='pgo')
    assert urls
    assert len(urls) > 0
    print "PASSED"
    print ""

print "Testing downloading a specific revision on mozilla-inbound."
creator = url_creator.get("64-bits", "mozilla-inbound")
urls = creator.find("dc98dc9e0725", buildtype='opt')
assert urls
assert len(urls) > 0
print "PASSED"
print ""

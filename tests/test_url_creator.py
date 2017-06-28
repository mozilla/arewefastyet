#!/usr/bin/env python2

import sys
sys.path.append("../slave")

import url_creator

platforms = [
    "Windows",
    "Linux",
    "Darwin"
]

repos = [
    "mozilla-inbound",
    "mozilla-central",
    "mozilla-beta",
    "mozilla-release",
    "chrome",
    "webkit"
]

archs = [
    '32bits',
    '64bits'
]

KNOWN_FAILURES = [
    ('Darwin', 'mozilla-release', '64bits') # 403 unauthorized
]

def skip(platform, repo, arch):
    """
    Returns true if a configuration (triplet of platform/repo/arch) must be
    skipped, false otherwise.
    """
    if platform == 'Darwin' and arch != '64bits':
        return True

    if repo == 'webkit' and platform != 'Darwin':
        return True

    for fplatform, frepo, farch in KNOWN_FAILURES:
        if platform == fplatform and repo == frepo and arch == farch:
            print "(skipping known failure {} {} {})".format(platform, repo, arch)
            return True

    return False

def main():
    failures = []

    for repo in repos:
        for platform in platforms:
            for arch in archs:
                if skip(platform, repo, arch):
                    continue

                print "Testing opt download for {} on {} {}.".format(repo, platform, arch)
                try:
                    urls = url_creator.get(arch, repo, platform).find(buildtype='opt')
                    assert urls
                    assert len(urls) > 0
                    print "PASSED\n"
                except:
                    print "FAILED\n"
                    failures.append(('opt', platform, repo, arch))

    for arch in archs:
        print "Testing pgo download for mozilla-central on Windows {}.".format(arch)
        try:
            urls = url_creator.get(arch, "mozilla-central", 'Windows').find(buildtype='pgo')
            assert urls
            assert len(urls) > 0
            print "PASSED\n"
        except:
            print "FAILED\n"
            failures.append(('pgo', 'Windows', 'mozilla-central', arch))

    print "Testing downloading a specific revision on mozilla-inbound."
    try:
        creator = url_creator.get("64-bits", "mozilla-inbound")
        urls = creator.find("dc98dc9e0725", buildtype='opt')
        assert urls
        assert len(urls) > 0
        print "PASSED\n"
    except:
        print "FAILED\n"
        failures.append(('specific', creator.platform, 'mozilla-inbound', creator.arch))

    if len(failures) > 0:
        print "FAILURES:"
        for test, platform, repo, arch in failures:
            print "{} {} - {} {}".format(repo, test, platform, arch)
        exit(1)
    else:
        exit(0)

if __name__ == '__main__':
    main()

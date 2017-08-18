#!/usr/bin/env python2

import sys
sys.path.append("../slave")

import url_creator

BUILDTYPES = ('debug', 'nightly', 'opt', 'pgo')

PLATFORMS = [
    "Windows",
    "Linux",
    "Darwin"
]

REPOS = [
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

def skip(platform, repo, arch, buildtype):
    """
    Returns true if a configuration (triplet of platform/repo/arch) must be
    skipped, false otherwise.
    """
    if (platform == 'Darwin' and arch != '64bits') or \
       (platform == 'Darwin' and buildtype == 'pgo') or \
       (platform == 'Windows' and 'release' in repo and buildtype == 'nightly') or \
       (repo != 'mozilla-central' and buildtype == 'nightly'):
        return True

    if repo == 'webkit' and platform != 'Darwin':
        return True

    for fplatform, frepo, farch in KNOWN_FAILURES:
        if platform == fplatform and repo == frepo and arch == farch:
            print "(skipping known failure {} {} {})".format(platform, repo, arch)
            return True

    return False


def test_configuration(repo, platform, arch=None, buildtype=None, cset='latest'):
    if skip(platform, repo, arch, buildtype):
        return []

    print("Testing download for (repo={},platform={},arch={},buildtype={},cset={})".format(
        repo,
        platform,
        arch,
        buildtype,
        cset))
    try:
        assert platform in PLATFORMS
        urls = url_creator.get(arch, repo, platform).find(buildtype=buildtype)
        assert len(urls) > 0
        print "PASSED\n"
        return []
    except:
        print "FAILED\n"
        return [(repo, platform, arch, buildtype, cset)]


def main():
    failures = []

    for repo in REPOS:
        for platform in PLATFORMS:
            for arch in archs:
                for bt in BUILDTYPES:
                    failures += test_configuration(repo, platform, arch, bt)

    # The artifacts of this revision will expire after 2018-08-18
    cset = "952c576fdcd6cc3e0b0b452ac247b0aeaf097646"
    for p in PLATFORMS:
       for arch in archs:
           failures += test_configuration('mozilla-inbound', p, arch, 'pgo', cset)

    if len(failures) > 0:
        print "FAILURES:"
        for f in failures:
            print f
        exit(1)
    else:
        exit(0)

if __name__ == '__main__':
    main()

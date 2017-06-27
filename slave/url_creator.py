import platform
import urllib2
import re

import utils

class UrlCreator(object):
    def __init__(self, config, repo):
        self.repo = repo
        self.config = config

    def find(self, cset = 'latest', **kwargs):
        if cset == 'latest':
            urls = self.latest(**kwargs)[0:5]
        else:
            urls = self.urlForRevision(cset, **kwargs)
        return urls

class ChromeUrlCreator(UrlCreator):

    def _url_base(self):
        platform = self._platform()
        return "http://commondatastorage.googleapis.com/chromium-browser-snapshots/"+platform+"/"

    def _platform(self):
        arch = self.config[0:2]
        if platform.system() == "Linux":
            if arch == '64':
                return "Linux_x64"
            if arch == '32':
                return "Linux"
        if platform.system() == "Darwin":
            return "Mac"
        if platform.system() == "Windows" or platform.system().startswith("CYGWIN"):
            if arch == '32':
                return "Win"
            if arch == '64':
                return "Win_x64"
        raise Exception("Unknown platform: " + platform.system())

    def latest(self, **kwargs):
        response = urllib2.urlopen(self._url_base() + "LAST_CHANGE")
        chromium_rev = response.read()

        response = urllib2.urlopen(self._url_base() + chromium_rev + "/REVISIONS")
        cset = re.findall('"v8_revision_git": "([a-z0-9]*)",', response.read())[0]

        return [self._url_base() + chromium_rev + "/"]

class WebKitUrlCreator(UrlCreator):

    def latest(self, **kwargs):
        response = urllib2.urlopen("https://webkit.org/downloads/")
        html = response.read()

        url = re.findall("https://builds-nightly.webkit.org/files/trunk/mac/WebKit-SVN-r[0-9]*.dmg", html)
        return url

class MozillaUrlCreator(UrlCreator):

    def __init__(self, config, repo):
        if repo == "mozilla-try":
            repo = "try";
        UrlCreator.__init__(self, config, repo)

    def _platform(self):
        arch = self.config[0:2]
        if platform.system() == "Linux":
            if arch == "32":
                return "linux"
            return "linux"+arch
        if platform.system() == "Darwin":
            return "macosx64"
        if platform.system() == "Windows":
            return "win"+arch
        if platform.system().startswith("CYGWIN"):
            return "win"+arch
        raise Exception("Unknown platform: " + platform.system())

    def treeherder_platform(self):
        platform = self._platform()
        if platform == "linux":
            return ["linux32"]
        if platform == "linux64":
            return ["linux64"]
        if platform == "win32":
            return ["windowsxp", "windows2012-32"]
        if platform == "win64":
            return ["windows8-64", "windows2012-64"]  # LATER??
        if platform == "macosx64":
            return ["osx-10-7"]

    def latest(self, buildtype):
        url = "https://treeherder.mozilla.org/api/project/" + self.repo + "/resultset/?count=10"
        data = utils.fetch_json(url)

        revisions = [i["revision"] for i in data["results"]]
        for revision in revisions:
            urls = self._urlForRevision(revision, buildtype)
            if len(urls) == 1:
                return [urls[0]]

        return []

    def urlForRevision(self, cset, buildtype):
        urls = self._urlForRevision(cset, buildtype)
        assert len(urls) == 1
        return urls

    def _urlForRevision(self, cset, buildtype):
        assert buildtype in ('opt', 'debug', 'pgo'), \
            '{} is not a valid buildtype ("opt", "debug", "pgo").'.format(
                buildtype
            )

        # here we use a detour using treeherder to find the build_id,
        # corresponding to a revision.
        url = "https://treeherder.mozilla.org/api/project/" + self.repo + "/resultset/?full=false&revision=" + cset
        data = utils.fetch_json(url)

        # No corresponding build found given revision
        if len(data["results"]) != 1:
            return []

        # The revision is not pushed separately. It is not the top commit
        # of a list of pushes that were done at the same time.
        if not data["results"][0]["revision"].startswith(cset):
            return []

        id = str(data["results"][0]["id"])

        url = "https://treeherder.mozilla.org/api/project/" + self.repo + "/jobs/?count=2000&result_set_id=" + str(id)
        data = utils.fetch_json(url)
        builds = data["results"]

        if self._platform() != "macosx64":
            builds = [i for i in builds if i["build_system_type"] == "taskcluster"]
        else:
            builds = [i for i in builds if i["build_system_type"] == "buildbot"]

        builds = [i for i in builds if i["job_type_symbol"] == "B" or i["job_type_symbol"] == "Bo"] # Builds
        builds = [i for i in builds if i["platform_option"] == buildtype] # opt / debug / pgo
        builds = [i for i in builds if i["platform"] in self.treeherder_platform()] # platform

        if len(builds) == 0:
            print "Found no builds."
            return []

        if len(builds) > 1:
            print "Found multiple builds. Couldn't decide."
            return []

        if self._platform() == "macosx64":
            url = "https://treeherder.mozilla.org/api/project/" + self.repo + "/job-log-url/?job_id=" + str(builds[0]["id"])
            data = utils.fetch_json(url)

            if len(data) == 0:
                return []

            # The URL is the full path to the text log archive. Remove the file
            # name so as to keep the build directory URL.
            build_dir = '/'.join(data[0]["url"].split('/')[:-1])
            return [build_dir]

        url = "https://treeherder.mozilla.org/api/jobdetail/?job_guid=" + str(builds[0]["job_guid"])
        data = utils.fetch_json(url)

        urls = [item["url"] for item in data["results"] if item["url"]]
        urls = [url for url in urls if 'target.zip' in url or 'target.tar.bz2' in url]

        return urls

def getUrlCreator(config, name):
    if "mozilla" in name:
        return MozillaUrlCreator(config, name)
    if "chrome" in name:
        return ChromeUrlCreator(config, name)
    if "webkit" in name:
        return WebKitUrlCreator(config, name)
    raise Exception("Unknown vendor")

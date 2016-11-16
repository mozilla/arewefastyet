import platform
import urllib2
import re
import utils


class UrlCreator(object):
    def __init__(self, repo):
        self.repo = repo

    def find(self, cset = 'latest'):
        if cset == 'latest':
            urls = self.latest()[0:5]
        else:
            urls = self.urlForRevision(cset)
        return urls

class ChromeUrlCreator(UrlCreator):

    def _url_base(self):
        platform = self._platform()
        return "http://commondatastorage.googleapis.com/chromium-browser-continuous/"+platform+"/"

    def _platform(self):
        arch, _ = platform.architecture()
        arch = arch[0:2]
        if platform.system() == "Linux":
            return "Linux"
        if platform.system() == "Darwin":
            return "Mac"
        if platform.system() == "Windows" or platform.system().startswith("CYGWIN"):
            if arch == '32':
                return "Win"
            elif arch == '64':
                return "Win_x64"
        raise Exception("Unknown platform: " + platform.system())

    def latest(self):
        response = urllib2.urlopen(self._url_base() + "LAST_CHANGE")
        chromium_rev = response.read()

        response = urllib2.urlopen(self._url_base() + chromium_rev + "/REVISIONS")
        cset = re.findall('"v8_revision_git": "([a-z0-9]*)",', response.read())[0]

        return [self._url_base() + chromium_rev + "/"]

class WebKitUrlCreator(UrlCreator):

    def latest(self):
        response = urllib2.urlopen("https://webkit.org/downloads/")
        html = response.read()

        url = re.findall("https://builds-nightly.webkit.org/files/trunk/mac/WebKit-SVN-r[0-9]*.dmg", html)
        return url

class MozillaUrlCreator(UrlCreator):

    def __init__(self, repo):
        UrlCreator.__init__(self, repo)
        self.url = self._url()
        if self.url[-1] != "/":
            self.url += "/"

    def _platform(self):
        arch, _ = platform.architecture()
        arch = arch[0:2]
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

    def _subdir(self):
        platform = self._platform()
        if self.repo == "mozilla-inbound":
            return "mozilla-inbound-"+platform
        if self.repo == "mozilla-central":
            return "mozilla-central-"+platform
        if self.repo == "mozilla-aurora":
            return "mozilla-aurora-"+platform
        if self.repo == "mozilla-beta":
            return "mozilla-beta-"+platform
        raise Exception("Unknown repo: " + self.repo)

    def _url(self):
        return "http://archive.mozilla.org/pub/firefox/tinderbox-builds/"+self._subdir()+"/"

    def _archive_url(self):
        return "http://inbound-archive.pub.build.mozilla.org/pub/mozilla.org/firefox/tinderbox-builds/"+self._subdir()+"/"

    def treeherder_platform(self):
        platform = self._platform()
        if platform == "linux":
            return "linux32"
        if platform == "linux64":
            return platform
        if platform == "win32":
            return "windowsxp"
        if platform == "win64":
            return "windows8-64" # LATER??
        if platform == "macosx64":
            return "osx-10-7"

    def latest(self):
        response = urllib2.urlopen(self.url+"?C=N;O=D")
        html = response.read()
        ids = list(set(re.findall("([0-9]{5,})/", html)))
        ids = sorted(ids, reverse=True)
        return [self.url + id for id in ids]

    def _build_id(self, id):
        url = "https://treeherder.mozilla.org/api/project/"+self.repo+"/jobs/?count=2000&result_set_id="+str(id)+""
        data = utils.fetch_json(url)
        builds = [i for i in data["results"] if i["build_system_type"] == "buildbot"] # Builds
        builds = [i for i in builds if i["job_type_symbol"] == "B" or i["job_type_symbol"] == "Bo"] # Builds
        builds = [i for i in builds if i["platform"] == self.treeherder_platform()] # platform
        builds = [i for i in builds if i["platform_option"] == "opt"] # opt / debug / pgo

        assert len(builds) == 1

        url = "https://treeherder.mozilla.org/api/project/mozilla-inbound/job-log-url/?job_id="+str(builds[0]["id"])
        data = utils.fetch_json(url)
        return data[0]["url"].split("/")[-2]

    def urlForRevision(self, cset):
        # here we use a detour using treeherder to find the build_id,
        # corresponding to a revision.
        url = "https://treeherder.mozilla.org/api/project/"+self.repo+"/resultset/?full=false&revision="+cset
        data = utils.fetch_json(url)

        # No corresponding build found given revision
        if len(data["results"]) != 1:
            return None

        # The revision is not pushed seperately. It is not the top commit
        # of a list of pushes that were done at the same time.
        if not data["results"][0]["revision"].startswith(cset):
            return None

        build_id = self._build_id(data["results"][0]["id"])
        return [self._url()+str(build_id)+"/", self._archive_url()+str(build_id)+"/"]

def getUrlCreator(name):
    if "mozilla" in name:
        return MozillaUrlCreator(name)
    if "chrome" in name:
        return ChromeUrlCreator(name)
    if "webkit" in name:
        return WebKitUrlCreator(name)
    raise Exception("Unkown vendor")

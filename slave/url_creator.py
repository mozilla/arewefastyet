import platform
import urllib2
import re

import utils

MAC_BUILDBOT_REPOSITORIES = ('mozilla-beta', 'mozilla-release', 'mozilla-esr52')


class UrlCreator(object):
    def __init__(self, config, repo, other_platform=None):
        self.repo = repo

        self.arch = config[0:2]
        self.platform = other_platform if other_platform is not None else platform.system()

    def find(self, cset = 'latest', **kwargs):
        if cset == 'latest':
            urls = self.latest(**kwargs)[0:5]
        else:
            urls = self.url_for_revision(cset, **kwargs)
        return urls

class ChromeUrlCreator(UrlCreator):

    def _url_base(self):
        platform = self._platform()
        return "http://commondatastorage.googleapis.com/chromium-browser-snapshots/" + platform + "/"

    def _platform(self):
        if self.platform == "Linux":
            if self.arch == '64':
                return "Linux_x64"
            if self.arch == '32':
                return "Linux"
        if self.platform == "Darwin":
            return "Mac"
        if self.platform == "Windows" or self.platform.startswith("CYGWIN"):
            if self.arch == '32':
                return "Win"
            if self.arch == '64':
                return "Win_x64"
        raise Exception("Unknown platform: " + self.platform)

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


class TaskClusterIndexHelper(object):
    _index_url = 'https://index.taskcluster.net/v1/task/gecko.v2'
    _artifacts = 'https://public-artifacts.taskcluster.net'
    _task_inspector = 'https://tools.taskcluster.net/tasks'

    BUILDTYPES = ('debug', 'nightly', 'opt', 'pgo')
    PRODUCTS = ('firefox', 'mobile')
    PLATFORMS = ('linux', 'linux64', 'macosx64', 'win32', 'win64')

    @classmethod
    def build_url(cls, repo_name, product, platform, buildtype, revision=None):
        task_id = cls._task_id(repo_name, product, platform, buildtype, revision)
        print 'TASK: %s/%s' % (cls._task_inspector, task_id)
        return cls._artifact_url(
            task_id,
            artifact_path='public/build/{}'.format(cls._artifact_to_filename(platform)))

    @classmethod
    def _task_id(cls, repo_name, product, platform, buildtype, revision=None):
        '''Return taskId for specific configuration.'''
        assert buildtype in cls.BUILDTYPES
        assert platform in cls.PLATFORMS
        assert product in cls.PRODUCTS

        if revision:
            url = '{}.{}.revision.{}.{}.{}-{}'.format(
                cls._index_url,
                repo_name,
                revision,
                product,
                platform,
                buildtype)
        else:
            if buildtype == 'nightly':
                # Unsigned nightly builds use '-opt' in their name
                platform = platform + '-opt'
                url = '{}.{}.{}.latest.{}.{}'.format(
                    cls._index_url,
                    repo_name,
                    buildtype,
                    product,
                    platform)
            else:
                url = '{}.{}.latest.{}.{}-{}'.format(
                    cls._index_url,
                    repo_name,
                    product,
                    platform,
                    buildtype)

        return utils.fetch_json(url)['taskId']

    @classmethod
    def _artifact_to_filename(cls, platform):
        platform_to_file = {
            'linux': 'target.tar.bz2',
            'linux64': 'target.tar.bz2',
            'macosx64': 'target.dmg',
            'win32': 'target.zip',
            'win64': 'target.zip',
        }
        return platform_to_file[platform]

    @classmethod
    def _artifact_url(cls, task_id, artifact_path, run_id=0):
        '''Return Buildbot properties for a known Buildbot generated task.'''
        url = '{}/{}/{}/{}'.format(
            cls._artifacts,
            task_id,
            run_id,
            artifact_path)
        print 'URL: %s' % url
        return url


class MozillaUrlCreator(UrlCreator):

    def __init__(self, config, repo, platform=None):
        if repo == "mozilla-try":
            repo = "try";
        UrlCreator.__init__(self, config, repo, platform)

    def _platform(self):
        if self.platform == "Linux":
            if self.arch == "32":
                return "linux"
            return "linux" + self.arch
        if self.platform == "Darwin":
            return "macosx64"
        if self.platform == "Windows" or self.platform.startswith("CYGWIN"):
            return "win" + self.arch
        raise Exception("Unknown platform: " + self.platform)

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
            # The first value is valid for Buildbot
            # while the latter is for TaskCluster
            return ["osx-10-7", "osx-10-10"]

    def latest(self, buildtype):
        return [
            TaskClusterIndexHelper().build_url(
                repo_name=self.repo,
                product='firefox',
                platform=self._platform(),
                buildtype=buildtype)
        ]

    def url_for_revision(self, cset, buildtype):
        urls = self._url_for_revision(cset, buildtype)
        assert len(urls) == 1
        return urls

    def _url_for_revision(self, cset, buildtype):
        return [
            TaskClusterIndexHelper().build_url(
                repo_name=self.repo,
                revision=cset,
                product='firefox',
                platform=self._platform(),
                buildtype=buildtype)
        ]

def get(config, repo, platform=None):
    if "mozilla" in repo:
        return MozillaUrlCreator(config, repo, platform)
    if "chrome" in repo:
        return ChromeUrlCreator(config, repo, platform)
    if "webkit" in repo:
        return WebKitUrlCreator(config, repo, platform)
    raise Exception("Unknown vendor")

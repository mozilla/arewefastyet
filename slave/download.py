import json
import urllib2
import urllib
import re
import os
import shutil
import socket
import utils
import platform

import tarfile
import zipfile
socket.setdefaulttimeout(120)

DEBUG = True

class DownloadTools(object):

    @classmethod
    def forSpecificUrl(cls, url):
        if (url.startswith("http://archive.mozilla.org") or
            url.startswith("https://archive.mozilla.org") or
            url.startswith("http://ftp.mozilla.org") or
            url.startswith("https://ftp.mozilla.org") or
            url.startswith("http://inbound-archive.pub.build.mozilla.org") or
            url.startswith("https://inbound-archive.pub.build.mozilla.org")):
            return ArchiveMozillaDownloader(url)
        if url.startswith("http://commondatastorage.googleapis.com"):
            return GoogleAPISDownloader(url)
        if url.startswith("http://builds.nightly.webkit.org"):
            return BuildsWebkitDownloader(url)
        raise Exception("Unknown retriever")

    @classmethod
    def getRevisionFinder(cls, repo):
        if "mozilla" in repo:
            return MozillaRevisionFinder(repo)
        if "chromium" in repo:
            return ChromeRevisionFinder(repo)
        raise Exception("Unknown repo")

    @classmethod
    def forRepo(cls, repo, cset="latest"):
        revisionFinder = cls.getRevisionFinder(repo)
        return revisionFinder.find(cset)

class RevisionFinder(object):
    def __init__(self, repo):
        self.repo = repo

    def find(self, cset):
        if cset == 'latest':
            urls = self.latest()[0:5]
        else:
            urls = self.urlForRevision(cset)

        for url in urls:
            print "trying: " + url
            downloader = DownloadTools.forSpecificUrl(url)
            if downloader.valid():
                return downloader
        raise Exception("couldn't find the revision.")

class ChromeRevisionFinder(RevisionFinder):

    def _url_base(self):
        platform = self._platform()
        return "http://commondatastorage.googleapis.com/chromium-browser-continuous/"+platform+"/"

    def _platform(self):
        if platform.system() == "Linux":
            return "Linux"
        if platform.system() == "Darwin":
            return "Mac"
        if platform.system() == "Windows":
            return "Win"
        raise Exception("Unknown platform: " + platform.system())

    def latest(self):
        response = urllib2.urlopen(self._url_base() + "LAST_CHANGE")
        chromium_rev = response.read()

        response = urllib2.urlopen(self._url_base() + chromium_rev + "/REVISIONS")
        cset = re.findall('"v8_revision_git": "([a-z0-9]*)",', response.read())[0]

        return [self._url_base() + chromium_rev + "/"]

class MozillaRevisionFinder(RevisionFinder):

    def __init__(self, repo):
        RevisionFinder.__init__(self, repo)
        self.url = self._url()
        if self.url[-1] != "/":
            self.url += "/"

    def _platform(self):
        arch, _ = platform.architecture()
        arch = arch[0:2]
        if platform.system() == "Linux":
            return "linux"+arch
        if platform.system() == "Darwin":
            return "macosx64"
        if platform.system() == "Windows":
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
        if platform == "linux32":
            return platform
        if platform == "linux64":
            return platform
        if platform == "win32":
            return "windowsxp"
        if platform == "win64":
            #return "windows8-64" # LATER??
            return "windowsxp"
        if platform == "macosx64":
            return "osx-10-7"

    def latest(self):
        response = urllib2.urlopen(self.url+"?C=N;O=D")
        html = response.read()
        ids = list(set(re.findall("([0-9]{5,})/", html)))
        ids = sorted(ids, reverse=True)
        return [self.url + id for id in ids]

    def _build_id(self, id):
        url = "https://treeherder.mozilla.org/api/project/"+self.repo+"/jobs/?count=2000&result_set_id="+str(id)+"&return_type=list"
        response = urllib2.urlopen(url)
        data = json.loads(response.read())
        builds = [i for i in data["results"] if i[1] == "buildbot"] # Builds
        builds = [i for i in builds if i[25] == "B" or i[25] == "Bo"] # Builds
        builds = [i for i in builds if i[13] == self.treeherder_platform()] # platform
        builds = [i for i in builds if i[5] == "opt"] # opt / debug / pgo

        assert len(builds) == 1

        url = "https://treeherder.mozilla.org/api/project/mozilla-inbound/job-log-url/?job_id="+str(builds[0][10])
        response = urllib2.urlopen(url)
        data = json.loads(response.read())
        return data[0]["url"].split("/")[-2]

    def urlForRevision(self, cset):
        # here we use a detour using treeherder to find the build_id,
        # corresponding to a revision.
        url = "https://treeherder.mozilla.org/api/project/"+self.repo+"/resultset/?full=false&revision="+cset
        response = urllib2.urlopen(url)
        data = json.loads(response.read())

        # No corresponding build found given revision
        if len(data["results"]) != 1:
            return None

        # The revision is not pushed seperately. It is not the top commit
        # of a list of pushes that were done at the same time.
        if data["results"][0]["revision"] != cset:
            return None

        build_id = self._build_id(data["results"][0]["id"])
        return [self._url()+str(build_id)+"/", self._archive_url()+str(build_id)+"/"]

class Downloader(object):

    def __init__(self, url):
        if not url.endswith("/"):
            url += "/"

        self.url = url
        self.folder = "./"

    def valid(self):
        return self.getfilename() != None

    def setOutputFolder(self, folder):
        if not folder.endswith("/"):
            folder += "/"
        self.folder = folder

    def download(self):
        self.createOutputFolder()

        filename = self.getfilename()
        assert filename
        self.retrieve(filename)
        self.extract(filename)

        info = self.retrieveInfo()
        fp = open(self.folder + "info.json", "w")
        json.dump(info, fp)
        fp.close()

    def createOutputFolder(self):
        if os.path.isdir(self.folder):
            shutil.rmtree(self.folder)
        os.makedirs(self.folder)

    def retrieve(self, filename):
        #if DEBUG:
        #    shutil.copy("firefox.tar.bz2", self.folder + filename)
        #    return

        print "Retrieving", self.url + filename
        urllib.urlretrieve(self.url + filename, self.folder + filename)

    def extract(self, filename):
        if "tar.bz2" in filename:
            tar = tarfile.open(self.folder + filename)
            tar.extractall(self.folder)
            tar.close()
        elif "zip" in filename:
            zip = zipfile.ZipFile(self.folder + filename)
            zip.extractall(self.folder)
            zip.close()

class ArchiveMozillaDownloader(Downloader):

    def getfilename(self):
        try:
            response = urllib2.urlopen(self.url)
            html = response.read()
        except:
            return None

        possibles = re.findall(r'<a href=".*(firefox-[a-zA-Z0-9._-]*)">', html)
        possibles = [possible for possible in possibles if "tests" not in possible]
        possibles = [possible for possible in possibles if "checksum" not in possible]
        possibles = [possible for possible in possibles if ".json" not in possible]
        possibles = [possible for possible in possibles if "crashreporter" not in possible]
        possibles = [possible for possible in possibles if "langpack" not in possible]
        possibles = [possible for possible in possibles if ".txt" not in possible]
        possibles = [possible for possible in possibles if ".installer." not in possible]

        assert len(possibles) <= 1
        if len(possibles) == 0:
            return None
        return possibles[0]

    def getinfoname(self):
        response = urllib2.urlopen(self.url)
        html = response.read()

        possibles = re.findall(r'<a href=".*(firefox-[a-zA-Z0-9._-]*)">', html)
        possibles = [possible for possible in possibles if ".json" in possible]
        possibles = [possible for possible in possibles if "mozinfo" not in possible]
        possibles = [possible for possible in possibles if "test_packages" not in possible]

        assert len(possibles) == 1
        return possibles[0]

    def getbinary(self):
        if os.path.exists(self.folder + "firefox/firefox.exe"):
            return self.folder + "firefox/firefox.exe"
        if os.path.exists(self.folder + "firefox/firefox"):
            return self.folder + "firefox/firefox"
        files = os.listdir(self.folder)
        assert len(files) == 1
        if files[0].endswith(".apk"):
            return self.folder + files[0]
        if files[0].endswith(".dmg"):
            return self.folder + files[0]
        assert False

    def retrieveInfo(self):
        infoname = self.getinfoname()

        response = urllib2.urlopen(self.url + infoname)
        raw_info = json.loads(response.read())

        info = {}
        info["revision"] = raw_info["moz_source_stamp"]
        info["engine_type"] = "firefox"
        info["shell"] = False
        info["binary"] = os.path.abspath(self.getbinary())

        return info

class GoogleAPISDownloader(Downloader):

    def getfilename(self):
        platform = self.url.split("/")[-3]
        if platform == "Linux":
            return "chrome-linux.zip"
        elif platform == "Mac":
            return "chrome-mac.zip"
        elif platform == "Win":
            return "chrome-win32.zip"
        elif platform == "Android":
            return "chrome-android.zip"
        raise Exception("Unknown platform: " + platform)

    def getbinary(self):
        if os.path.exists(self.folder + "chrome-linux/chrome"):
            return self.folder + "chrome-linux/chrome"
        if os.path.exists(self.folder + "chrome-win32/chrome.exe"):
            return self.folder + "chrome-win32/chrome.exe"
        if os.path.exists(self.folder + "chrome-mac/Chromium.app/Contents/MacOS/Chromium"):
            return self.folder + "chrome-mac/Chromium.app/Contents/MacOS/Chromium"
        if os.path.exists(self.folder + "chrome-android/apks/ChromeShell.apk"):
            return self.folder + "chrome-android/apks/ChromeShell.apk"
        assert False

    def retrieveInfo(self):
        response = urllib2.urlopen(self.url + "REVISIONS")
        cset = re.findall('"v8_revision_git": "([a-z0-9]*)",', response.read())[0]

        info = {}
        info["revision"] = cset
        info["engine_type"] = "chrome"
        info["shell"] = False
        info["binary"] = os.path.abspath(self.getbinary())

        return info

if __name__ == "__main__":
    from optparse import OptionParser
    parser = OptionParser(usage="usage: %prog [options]")
    parser.add_option("-o", "--output", dest="output",
                      help="download to DIR, default=output/", metavar="DIR", default='output')
    parser.add_option("-u", "--url", dest="url",
                      help="Specify a specific url to download.", default=None)
    parser.add_option("--repo", dest="repo",
                      help="Specify a repo to download. Currently only mozilla-inbound supported.", default=None)
    parser.add_option("-r", dest="cset",
                      help="Specify the revision to download. Default to 'latest'", default='latest')
    (options, args) = parser.parse_args()

    if options.url:
        downloader = DownloadTools.forSpecificUrl(options.url)
    elif options.repo:
        downloader = DownloadTools.forRepo(options.repo, options.cset)
    else:
        raise Exception("You'll need to specify atleast an url or repo")

    downloader.setOutputFolder(options.output)
    downloader.download()

import json
import os
import platform
import re
import shutil
import socket
import tarfile
import urllib
import urllib2
import zipfile

socket.setdefaulttimeout(120)

import url_creator
import utils

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
        if (url.startswith("http://builds.nightly.webkit.org") or
            url.startswith("https://builds.nightly.webkit.org") or
            url.startswith("http://builds-nightly.webkit.org") or
            url.startswith("https://builds-nightly.webkit.org")):
            return BuildsWebkitDownloader(url)
        raise Exception("Unknown retriever")

    @classmethod
    def forRepo(cls, repo, cset="latest"):
        urlCreator = url_creator.getUrlCreator(repo)
        urls = urlCreator.find(cset)
        for url in urls:
            print "trying: " + url
            downloader = DownloadTools.forSpecificUrl(url)
            if downloader.valid():
                return downloader
        raise Exception("couldn't find the revision.")

class Downloader(object):

    def __init__(self, url):
        if not url.endswith("/"):
            url += "/"

        self.url = url
        self.folder = "./"

    def valid(self):
        return self.getfilename() != None

    def set_output_folder(self, folder):
        if not folder.endswith("/"):
            folder += "/"
        self.folder = folder

    def download(self):
        self.create_output_folder()

        filename = self.getfilename()
        assert filename
        self.retrieve(filename)
        self.extract(filename)

        info = self.retrieveInfo()
        fp = open(self.folder + "info.json", "w")
        json.dump(info, fp)
        fp.close()

    def create_output_folder(self):
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

        possibles = re.findall(r'<a href=".*((firefox|fennec)-[a-zA-Z0-9._-]*)">', html)
        possibles = [possible[0] for possible in possibles]

        filename = self.getUniqueFileName(possibles)
        if filename:
            return filename

        filename = self.getPlatformFileName(possibles, platform.system(), platform.architecture()[0])
        if filename:
            return filename

        return None

    def retrieveInfo(self):
        infoname = self.getinfoname()

        response = urllib2.urlopen(self.url + infoname)
        raw_info = json.loads(response.read())

        info = {}
        info["revision"] = raw_info["moz_source_stamp"]
        info["engine_type"] = "firefox"
        info["shell"] = False
        info["binary"] = os.path.abspath(self.getbinary())
        info["folder"] = os.path.abspath(self.folder)

        return info

    def _remove_extra_files(self, possibles):
        possibles = [possible for possible in possibles if "tests" not in possible]
        possibles = [possible for possible in possibles if "checksum" not in possible]
        possibles = [possible for possible in possibles if ".json" not in possible]
        possibles = [possible for possible in possibles if "crashreporter" not in possible]
        possibles = [possible for possible in possibles if "langpack" not in possible]
        possibles = [possible for possible in possibles if ".txt" not in possible]
        possibles = [possible for possible in possibles if ".installer." not in possible]

        extensions = [".exe", ".tar.bz2",".dmg", ".zip", ".apk"]
        possibles2 = []
        for possible in possibles:
            endsWith = False;
            for ext in extensions:
                if possible.endswith(ext):
                    endsWith = True
                    break
            if endsWith:
                possibles2.append(possible)
        return possibles2

    def getUniqueFileName(self, possibles):
        possibles = self._remove_extra_files(possibles)
        if len(possibles) != 1:
            return None
        return possibles[0]

    def getPlatformFileName(self, possibles, platform, arch):
        possibles = self._remove_extra_files(possibles)
        if platform == "Darwin":
            possibles = [possible for possible in possibles if "mac" in possible]
            possibles = [possible for possible in possibles if possible.endswith(".dmg")]
            possibles = [possible for possible in possibles if "sdk" not in possible]
        elif platform == "Linux" and arch == "64bit":
            possibles = [possible for possible in possibles if "linux" in possible]
            possibles = [possible for possible in possibles if "x86_64" in possible]
            possibles = [possible for possible in possibles if "sdk" not in possible]
        elif platform == "Linux" and arch == "32bit":
            possibles = [possible for possible in possibles if "linux" in possible]
            possibles = [possible for possible in possibles if "i686" in possible]
            possibles = [possible for possible in possibles if "sdk" not in possible]
        elif platform == "Windows" and arch == "64bit":
            possibles = [possible for possible in possibles if "win64" in possible]
        elif platform == "Windows" and arch == "32bit":
            possibles = [possible for possible in possibles if "win32" in possible]

        if len(possibles) != 1:
            return None
        return possibles[0]

    def getinfoname(self):
        filename = self.getfilename()
        try:
            filename = os.path.splitext(filename)[0]
            response = urllib2.urlopen(self.url + filename + ".json")
            html = response.read()
        except:
            filename = os.path.splitext(filename)[0]
            response = urllib2.urlopen(self.url + filename + ".json")
            html = response.read()

        return filename + ".json"

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


class GoogleAPISDownloader(Downloader):

    def getfilename(self):
        platform = self.url.split("/")[-3]
        if platform.startswith("Linux"):
            return "chrome-linux.zip"
        elif platform == "Mac":
            return "chrome-mac.zip"
        elif platform.startswith("Win"): # Chrome puts win64 in win32 folder.
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
        info["folder"] = os.path.abspath(self.folder)

        return info

class BuildsWebkitDownloader(Downloader):

    def __init__(self, url):
        self.file = url.split("/")[-1]
        self.url = "/".join(url.split("/")[0:-1])
        if not self.url.endswith("/"):
            self.url += "/"
        self.folder = "./"

    def getfilename(self):
        return self.file

    def retrieveInfo(self):
        print self.file
        cset = re.findall('-r([a-z0-9]*)\.dmg', self.file)[0]

        info = {}
        info["revision"] = cset
        info["engine_type"] = "webkit"
        info["shell"] = False
        info["binary"] = os.path.abspath(self.folder + self.file)
        info["folder"] = os.path.abspath(self.folder)

        return info

if __name__ == "__main__":
    from optparse import OptionParser
    parser = OptionParser(usage="usage: %prog [options]")
    parser.add_option("-o", "--output", dest="output",
                      help="download to DIR, default=output/", metavar="DIR", default='output')
    parser.add_option("-u", "--url", dest="url",
                      help="Specify a specific url to download.", default=None)
    parser.add_option("--repo", dest="repo",
                      help="Specify a repo to download. Currently supports: mozilla-inbound, mozilla-central, mozilla-aurora, mozilla-beta, webkit, chrome", default=None)
    parser.add_option("-r", dest="cset",
                      help="Specify the revision to download. Defaults to 'latest'. (Note: this is currently only supported when using a mozilla repo)", default='latest')
    (options, args) = parser.parse_args()

    if options.url:
        downloader = DownloadTools.forSpecificUrl(options.url)
    elif options.repo:
        downloader = DownloadTools.forRepo(options.repo, options.cset)
    else:
        raise Exception("You'll need to specify at least an url or repo")

    downloader.set_output_folder(options.output)
    downloader.download()

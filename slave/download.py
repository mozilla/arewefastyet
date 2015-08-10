import json
import urllib2
import urllib
import re
import os
import shutil
import socket
import utils

import tarfile
import zipfile
socket.setdefaulttimeout(120)

DEBUG = True

class Retriever(object):
    def __init__(self, url):
        if not url.endswith("/"):
            url += "/"

        self.url = url
        self.folder = "./"

    def setOutputFolder(self, folder):
        if not folder.endswith("/"):
            folder += "/"
        self.folder = folder

    def download(self):
        self.createOutputFolder()

        filename = self.getfilename()
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

class ArchiveMozilla(Retriever):
    
    def getfilename(self):
        response = urllib2.urlopen(self.url)
        html = response.read()

        possibles = re.findall(r'<a href="(firefox-[a-zA-Z0-9._-]*)">', html)
        possibles = [possible for possible in possibles if "tests" not in possible]
        possibles = [possible for possible in possibles if "checksum" not in possible]
        possibles = [possible for possible in possibles if ".json" not in possible]
        possibles = [possible for possible in possibles if "crashreporter" not in possible]
        possibles = [possible for possible in possibles if "langpack" not in possible]
        possibles = [possible for possible in possibles if ".txt" not in possible]
        possibles = [possible for possible in possibles if ".installer." not in possible]

        assert len(possibles) == 1
        return possibles[0]

    def getinfoname(self):
        response = urllib2.urlopen(self.url)
        html = response.read()

        possibles = re.findall(r'<a href="(firefox-[a-zA-Z0-9._-]*)">', html)
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
        files = os.listdirs()
        assert len(files) == 1
        if files[0].endswith(".apk"):
            return files[0]
        if files[0].endswith(".dmg"):
            return files[0]
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

def getRetriever(url):
    if (url.startswith("http://archive.mozilla.org") or
        url.startswith("https://archive.mozilla.org") or
        url.startswith("http://ftp.mozilla.org") or
        url.startswith("https://ftp.mozilla.org")):
        return ArchiveMozilla(url)
    if url.startswith("http://commondatastorage.googleapis.com"):
        return GoogleAPIS(url)
    if url.startswith("http://builds.nightly.webkit.org"):
        return BuildsWebkit(url)

    raise Exception("Unknown retriever")

if __name__ == "__main__":
    from optparse import OptionParser
    parser = OptionParser(usage="usage: %prog url [options]")
    parser.add_option("-o", "--output", dest="output",
                      help="download to DIR, default=output/", metavar="DIR", default='output')
    (options, args) = parser.parse_args()

    retriever = getRetriever(args[0])
    retriever.setOutputFolder(options.output)
    retriever.download()

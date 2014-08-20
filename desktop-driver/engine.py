import json
import sys
import urllib2
import urllib
import re
import tarfile
import subprocess
import os
import shutil
import signal
import time

sys.path.insert(1, '../driver')
import utils
import zipfile

class TimeException(Exception):
    pass
def timeout_handler(signum, frame):
    raise TimeException()

class Engine:
    def __init__(self):
        self.updated = False
        self.tmp_dir = utils.config.get('main', 'tmpDir')

    def unzip(self, name):
        if "tar.bz2" in name:
            tar = tarfile.open(self.tmp_dir + name)
            tar.extractall(self.tmp_dir)
            tar.close()
        else:
            zip = zipfile.ZipFile(self.tmp_dir + name)
            zip.extractall(self.tmp_dir)
            zip.close()

    def kill(self):
        self.subprocess.terminate()

        for i in range(100):
            time.sleep(0.1)
            if self.subprocess.poll():
                return
            time.sleep(0.1)

        os.kill(int(self.pid), signal.SIGTERM)


class Mozilla(Engine):
    def __init__(self):
        Engine.__init__(self)
        self.nightly_dir = utils.config.get('mozilla', 'nightlyDir')
        self.isBrowser = True
        self.modes = [{
            'name': 'jmim'
        }]

    def update(self):
        # Step 1: Get newest nightly folder
        response = urllib2.urlopen(self.nightly_dir+"/?C=N;O=D")
        html = response.read()
        self.folder_id =  re.findall("[0-9]{5,}", html)[0]

        # Step 2: Find the correct file
        response = urllib2.urlopen(self.nightly_dir+"/"+self.folder_id)
        html = response.read()
        exec_file = re.findall("firefox-[a-zA-Z0-9.]*.en-US.win32.zip", html)[0]
        json_file = re.findall("firefox-[a-zA-Z0-9.]*.en-US.win32.json", html)[0]

        # Step 3: Get build information
        response = urllib2.urlopen(self.nightly_dir+"/"+self.folder_id+"/"+json_file)
        html = response.read()
        info = json.loads(html)

        # Step 4: Fetch archive
        print "Retrieving", self.nightly_dir+"/"+self.folder_id+"/"+exec_file
        urllib.urlretrieve(self.nightly_dir+"/"+self.folder_id+"/"+exec_file, self.tmp_dir + "firefox.zip")

        # Step 5: Unzip
        self.unzip("firefox.zip")

        # Step 6: Save info
        self.updated = True
        self.cset = info["moz_source_stamp"]

    def run(self, page):
        # Step 2: Delete profile
        if os.path.exists(self.tmp_dir + "profile"):
            shutil.rmtree(self.tmp_dir + "profile")

        # Step 3: Create new profile
        output = subprocess.check_output([self.tmp_dir + "firefox/firefox.exe", "-CreateProfile", "test "+self.tmp_dir+"profile"], stderr=subprocess.STDOUT)

        # Step 4: Start browser
        env = os.environ.copy()
        env["JSGC_DISABLE_POISONING"] = "1";
        self.subprocess = subprocess.Popen([self.tmp_dir + "firefox/firefox.exe", "-P", "test", page], env=env)
        self.pid = self.subprocess.pid

class MozillaShell(Engine):
    def __init__(self):
        Engine.__init__(self)
        self.nightly_dir = utils.config.get('mozilla', 'nightlyDir')
        self.isShell = True
        self.modes = [{
            'name': 'mozshell',
            'args': []
        }]

    def update(self):
        # Step 1: Get newest nightly folder
        response = urllib2.urlopen(self.nightly_dir+"/?C=N;O=D")
        html = response.read()
        self.folder_id =  re.findall("[0-9]{5,}", html)[0]

        # Step 2: Find the correct file
        response = urllib2.urlopen(self.nightly_dir+"/"+self.folder_id)
        html = response.read()
        exec_file = re.findall("jsshell-win32.zip", html)[0]
        json_file = re.findall("firefox-[a-zA-Z0-9.]*.en-US.win32.json", html)[0]

        # Step 3: Get build information
        response = urllib2.urlopen(self.nightly_dir+"/"+self.folder_id+"/"+json_file)
        html = response.read()
        info = json.loads(html)

        # Step 4: Fetch archive
        print "Retrieving", self.nightly_dir+"/"+self.folder_id+"/"+exec_file
        urllib.urlretrieve(self.nightly_dir+"/"+self.folder_id+"/"+exec_file, self.tmp_dir + "shell.zip")

        # Step 5: Unzip
        self.unzip("shell.zip")

        # Step 6: Save info
        self.updated = True
        self.cset = info["moz_source_stamp"]

    def run(self, page):
        pass

    def shell(self):
        return os.path.join(self.tmp_dir,'shell','js.exe')
        
    def env(self):
        return {"JSGC_DISABLE_POISONING": "1"}

class Chrome(Engine):
    def __init__(self):
        Engine.__init__(self)
        self.build_info_url = utils.config.get('chrome', 'buildInfoUrl')
        self.nightly_dir = utils.config.get('chrome', 'nightlyDir')
        self.isBrowser = True
        self.modes = [{
            'name': 'v8'
        }]

    def update(self):
        # Step 1: Get latest succesfull build revision
        response = urllib2.urlopen(self.nightly_dir+"/Win/LAST_CHANGE")
        chromium_rev = response.read()

        # Step 2: Download the archive
        print "Retrieving", self.nightly_dir+"/Win/"+chromium_rev+"/chrome-win32.zip"
        urllib.urlretrieve(self.nightly_dir+"/Win/"+chromium_rev+"/chrome-win32.zip", self.tmp_dir + "chrome-win32.zip")

        # Step 3: Unzip
        self.unzip("chrome-win32.zip")

        # Step 4: Get v8 revision
        response = urllib2.urlopen(self.nightly_dir + "/Win/"+chromium_rev+"/REVISIONS")
        self.cset = re.findall('"v8_revision": ([a-z0-9]*),', response.read())[0]

        # Step 5: Save info
        self.updated = True

    def run(self, page):
        self.subprocess = subprocess.Popen([self.tmp_dir + "chrome-win32/chrome.exe", page])
        self.pid = self.subprocess.pid


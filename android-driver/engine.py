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
        exec_file = re.findall("fennec-[a-zA-Z0-9.]*.en-US.android-arm.apk", html)[0]
        json_file = re.findall("fennec-[a-zA-Z0-9.]*.en-US.android-arm.json", html)[0]

        # Step 3: Get build information
        response = urllib2.urlopen(self.nightly_dir+"/"+self.folder_id+"/"+json_file)
        html = response.read()
        info = json.loads(html)

        # Step 4: Test if there is a new revision
        old_revision = ""
        if os.path.isfile(self.tmp_dir + "mozilla-revision"):
            fp = open(self.tmp_dir + "mozilla-revision", 'r')
            old_revision = fp.read() 
            fp.close()
        if info["moz_source_stamp"] != old_revision:

            # Step 4.1: Fetch archive
            print "Retrieving", self.nightly_dir+"/"+self.folder_id+"/"+exec_file
            urllib.urlretrieve(self.nightly_dir+"/"+self.folder_id+"/"+exec_file, self.tmp_dir + "fennec.apk")

            # Step 4.2: Write the new revision
            fp = open(self.tmp_dir + "/mozilla-revision", 'w')
            fp.write(info["moz_source_stamp"])
            fp.close()

        # Step 5: Install on device
        print subprocess.check_output(["adb", "install", "-r", self.tmp_dir+"/fennec.apk"])

        self.updated = True
        self.cset = info["moz_source_stamp"]

    def run(self, page):
        # To be sure.
        self.kill()

        #TODO: remove profile
        print subprocess.check_output(["adb", "shell", "am", "start", "-a", "android.intent.action.VIEW",
                                 "-n", "org.mozilla.fennec/.App", "-d", page])

    def kill(self):
        print subprocess.check_output(["adb", "shell", "pm", "clear", "org.mozilla.fennec"]);

class Chrome(Engine):
    def __init__(self):
        Engine.__init__(self)
        self.build_info_url = utils.config.get('chrome', 'buildInfoUrl')
        self.nightly_dir = utils.config.get('chrome', 'nightlyDir')
        self.modes = [{
            'name': 'v8'
        }]

    def update(self):
        # Step 1: Get latest succesfull build revision
        response = urllib2.urlopen(self.build_info_url)
        html = response.read()
        dirname = re.findall('<td class="revision">([0-9]*)</td>\n\s*<td class="success">success</td>', html)[0]
        revision = re.findall('<td class="success">success</td>\s*<td><a href="([0-9a-zA-Z/.]*)">', html)[0]

        # Step 2: Get v8 revision
        response = urllib2.urlopen(self.build_info_url + "/../"+ revision)
        html = response.read()
        self.cset = re.findall('<td class="left">got_v8_revision</td>\n\s*<td class="middle"><abbr title="\n\s*([0-9]*)\n\s*">', html)[0]

        # Step 3: Test if there is a new revision
        old_revision = ""
        if os.path.isfile(self.tmp_dir + "chrome-revision"):
            fp = open(self.tmp_dir + "chrome-revision", 'r')
            old_revision = fp.read() 
            fp.close()
        if self.cset != old_revision:
            # Step 3.1: Download the archive
            print "Retrieving", self.nightly_dir+"/Android/"+dirname+"/chrome-android.zip"
            urllib.urlretrieve(self.nightly_dir+"/Android/"+dirname+"/chrome-android.zip", self.tmp_dir + "chrome-android.zip")

            # Step 3.2: Unzip
            self.unzip("chrome-android.zip")

            # Step 3.3: Write the new revision
            fp = open(self.tmp_dir + "/chrome-revision", 'w')
            fp.write(self.cset)
            fp.close()

        # Step 4: Install on device
        print subprocess.check_output(["adb", "install", "-r", self.tmp_dir+"/chrome-android/apks/ChromeShell.apk"])

        # Step 5: Save info
        self.updated = True
        
    def run(self, page):
        # To be sure.
        self.kill()

        print subprocess.check_output(["adb", "shell", "am", "start", "-a", "android.intent.action.VIEW",
                                       "-n", "org.chromium.chrome.shell/org.chromium.chrome.shell.ChromeShellActivity", "-d", page])

    def kill(self):
        print subprocess.check_output(["adb", "shell", "pm", "clear", "org.chromium.chrome.shell"]);



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

sys.path.insert(1, '../driver')
import utils
import zipfile


class Engine:
    def __init__(self):
        self.updated = False

class Mozilla(Engine):
    def __init__(self):
        Engine.__init__(self)
        self.nightly_dir = utils.config.get('mozilla', 'nightlyDir')
        self.tmp_dir = utils.config.get('main', 'tmpDir')
        self.modes = [{
            'name': 'jmim'            
        }]

    def update(self):
        # Step 1: Get newest nightly folder 
        response = urllib2.urlopen(self.nightly_dir+"/?C=M;O=D")
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
        urllib.urlretrieve(self.nightly_dir+"/"+self.folder_id+"/"+exec_file, self.tmp_dir + "firefox.zip")

        # Step 5: Unzip
        #tar = tarfile.open("firefox.tar.bz2")
        #tar.extractall()
        #tar.close()
        zip = zipfile.ZipFile(self.tmp_dir + "firefox.zip")
        zip.extractall()

        # Step 6: Save info
        self.updated = True
        self.cset = info["moz_source_stamp"]

    def run(self, page):
        # Step 1: Get profile directory
        output = subprocess.check_output([self.tmp_dir + "firefox/firefox", "-CreateProfile", "test"], stderr=subprocess.STDOUT)
        print output
        profile = re.findall("at '(.*)'", output)[0]
        profileDir = os.path.dirname(profile)

        # Step 2: Delete profile
        if os.path.exists(profileDir):
            shutil.rmtree(profileDir)

        # Step 3: Create new profile
        output = subprocess.check_output([self.tmp_dir + "firefox/firefox", "-CreateProfile", "test"], stderr=subprocess.STDOUT)

        # Step 4: Start browser
        self.pid = subprocess.Popen([self.tmp_dir + "firefox/firefox", "-P", "test", page]).pid

    def kill(self):
        os.kill(int(self.pid), signal.SIGTERM)

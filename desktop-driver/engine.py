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
        self.unzip("firefox.zip")

        # Step 6: Save info
        self.updated = True
        self.cset = info["moz_source_stamp"]

    def run(self, page):
        # Step 1: Get profile directory
        output = subprocess.check_output([self.tmp_dir + "firefox/firefox.exe", "-CreateProfile", "test"], stderr=subprocess.STDOUT)
        profile = re.findall("at '(.*)'", output)[0]
        profileDir = os.path.dirname(profile)

        # Step 2: Delete profile
        if os.path.exists(profileDir):
            shutil.rmtree(profileDir)

        # Step 3: Create new profile
        output = subprocess.check_output([self.tmp_dir + "firefox/firefox.exe", "-CreateProfile", "test"], stderr=subprocess.STDOUT)

        # Step 4: Start browser
        self.pid = subprocess.Popen([self.tmp_dir + "firefox/firefox.exe", "-P", "test", page]).pid

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
        self.revision =  re.findall('<td class="revision">([0-9]*)</td>\n    <td class="success">success</td>', html)[0]
        
        # Step 2: Download the archive
        urllib.urlretrieve(self.nightly_dir+"/Win/"+self.revision+"/chrome-win32.zip", self.tmp_dir + "chrome-win32.zip")

        # Step 3: Unzip
        self.unzip("chrome-win32.zip")
        
        # Step 4: Save info
        self.updated = True
        self.cset = self.revision
        
    def run(self, page):
        self.pid = subprocess.Popen([self.tmp_dir + "chrome-win32/chrome.exe", page]).pid


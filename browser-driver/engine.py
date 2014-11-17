import json
import sys
import urllib2
import urllib
import re
import tarfile
import subprocess
import os
import stat
import shutil
import signal
import time
import socket
socket.setdefaulttimeout(120)

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
        self.slaveType = utils.config.get('main', 'slaveType')

    def unzip(self, directory, name):
        if "tar.bz2" in name:
            tar = tarfile.open(self.tmp_dir + directory + "/" + name)
            tar.extractall(self.tmp_dir + directory + "/")
            tar.close()
        else:
            zip = zipfile.ZipFile(self.tmp_dir + directory + "/" + name)
            zip.extractall(self.tmp_dir + directory + "/")
            zip.close()

    def chmodx(self, file):
        st = os.stat(file)
        os.chmod(file, st.st_mode | stat.S_IEXEC)

    def getOrDownload(self, prefix, revision, file, output): 
        rev_file = self.tmp_dir + "/" + prefix + "-revision"
        old_revision = ""
        if os.path.isfile(rev_file):
            fp = open(rev_file, 'r')
            old_revision = fp.read()
            fp.close()

        if revision != old_revision:
            print "Retrieving", file
            urllib.urlretrieve(file, output)

            fp = open(rev_file, 'w')
            fp.write(revision)
            fp.close()

    def kill(self):
        self.subprocess.terminate()

        for i in range(100):
            time.sleep(0.1)
            if self.subprocess.poll():
                return
            time.sleep(0.1)

	try:
            os.kill(int(self.pid), signal.SIGTERM)
        except:
            pass


class Mozilla(Engine):
    def __init__(self):
        Engine.__init__(self)
        self.nightly_dir = utils.config.get('mozilla', 'nightlyDir')
        self.isBrowser = True
        self.modes = [{
            'name': 'jmim'
        }]
        self.folder = "firefox"
        if not os.path.isdir(self.tmp_dir + self.folder):
            os.mkdir(self.tmp_dir + self.folder)

    def update(self):
        # Step 1: Get newest nightly folder
        if "latest" in self.nightly_dir:
            self.folder_id = "."
        else:
            response = urllib2.urlopen(self.nightly_dir+"/?C=N;O=D")
            html = response.read()
            self.folder_id =  re.findall("[0-9]{5,}", html)[0]

        # Step 2: Find the correct file
        response = urllib2.urlopen(self.nightly_dir+"/"+self.folder_id)
        html = response.read()
        if self.slaveType == "android":
            exec_file = re.findall("fennec-[a-zA-Z0-9.]*.en-US.android-arm.apk", html)[0]
            json_file = re.findall("fennec-[a-zA-Z0-9.]*.en-US.android-arm.json", html)[0]
        elif self.slaveType == "mac-desktop":
            exec_file = re.findall("firefox-[a-zA-Z0-9.]*.en-US.mac.dmg", html)[0]
            json_file = re.findall("firefox-[a-zA-Z0-9.]*.en-US.mac.json", html)[0]
        elif self.slaveType == "linux-desktop":
            exec_file = re.findall("firefox-[a-zA-Z0-9.]*.en-US.linux-i686.tar.bz2", html)[0]
            json_file = re.findall("firefox-[a-zA-Z0-9.]*.en-US.linux-i686.json", html)[0]
        else:
            exec_file = re.findall("firefox-[a-zA-Z0-9.]*.en-US.win32.zip", html)[0]
            json_file = re.findall("firefox-[a-zA-Z0-9.]*.en-US.win32.json", html)[0]

        # Step 3: Get build information
        response = urllib2.urlopen(self.nightly_dir+"/"+self.folder_id+"/"+json_file)
        html = response.read()
        info = json.loads(html)

        # Step 4: Test if there is a new revision
        if self.slaveType == "android":
            output = self.tmp_dir + self.folder + "/fennec.apk"
        elif self.slaveType == "mac-desktop":
            output = self.tmp_dir + self.folder + "/firefox.dmg"
        elif self.slaveType == "linux-desktop":
            output = self.tmp_dir + self.folder + "/firefox.tar.bz2"
        else:
            output = self.tmp_dir + self.folder + "/firefox.zip"
	self.getOrDownload("mozilla", info["moz_source_stamp"],
                           self.nightly_dir + "/" + self.folder_id + "/" + exec_file,
                           output)

        # Step 5: Prepare to run
        if self.slaveType == "android":
            print subprocess.check_output(["adb", "install", "-r", self.tmp_dir + self.folder + "/fennec.apk"])
        elif self.slaveType == "mac-desktop":
            if os.path.exists("/Volumes/Nightly"):
                print subprocess.check_output(["hdiutil", "detach", "/Volumes/Nightly"])
            print subprocess.check_output(["hdiutil", "attach", self.tmp_dir + self.folder + "/firefox.dmg"])
        elif self.slaveType == "linux-desktop":
            self.unzip(self.folder, "firefox.tar.bz2")
        else:
            self.unzip(self.folder, "firefox.zip")

        # Step 6: Save info
        self.updated = True
        self.cset = info["moz_source_stamp"]

    def runAndroid(self, page):
        # To be sure.
        self.kill()

        # Remove profile
        print subprocess.check_output(["adb", "shell", "rm -rf /storage/emulated/legacy/awfy"])

        # Create profile and disable slow script dialog
        print subprocess.check_output(["adb", "shell", "mkdir /storage/emulated/legacy/awfy"])
        print subprocess.check_output(["adb", "shell", "echo 'user_pref(\"dom.max_script_run_time\", 0);' > /storage/emulated/legacy/awfy/prefs.js"])

        # Start browser
        print subprocess.check_output(["adb", "shell", "am start -a android.intent.action.VIEW -n org.mozilla.fennec/.App -d "+page+" --es env0 JSGC_DISABLE_POISONING=1 --es args \"--profile /storage/emulated/legacy/awfy\""])

    def runDesktop(self, page):
        if self.slaveType == "mac-desktop":
            executable = "/Volumes/Nightly/Nightly.app/Contents/MacOS/firefox"
        elif self.slaveType == "linux-desktop":
            executable = self.tmp_dir + self.folder + "/firefox/firefox"
        else:
            executable = self.tmp_dir + self.folder + "/firefox/firefox.exe"
        
        # Step 2: Delete profile
        if os.path.exists(self.tmp_dir + "profile"):
            shutil.rmtree(self.tmp_dir + "profile")

        # Step 3: Create new profile
        output = subprocess.check_output([executable, 
                                         "-CreateProfile", "test "+self.tmp_dir+"profile"],
                                         stderr=subprocess.STDOUT)

        # Step 4: Start browser
        env = os.environ.copy()
        env["JSGC_DISABLE_POISONING"] = "1";
        self.subprocess = subprocess.Popen([executable, 
                                           "-P", "test", page], env=env)
        self.pid = self.subprocess.pid

    def run(self, page):
        if self.slaveType == "android":
            self.runAndroid(page)
        else:
            self.runDesktop(page)

    def kill(self):
        if self.slaveType == "android":
            print subprocess.check_output(["adb", "shell", "pm", "clear", "org.mozilla.fennec"]);
        else:
            Engine.kill(self)

class MozillaPGO(Mozilla):
    def __init__(self):
        Mozilla.__init__(self)
        self.nightly_dir = utils.config.get('mozilla', 'pgoDir')
        self.modes = [{
            'name': 'pgo'
        }]
        self.folder = "firefox-pgo"

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
        self.unzip(".","shell.zip")

        # Step 6: Save info
        self.updated = True
        self.cset = info["moz_source_stamp"]

    def run(self, page):
        pass

    def shell(self):
        return os.path.join(self.tmp_dir,'js.exe')

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
        if self.slaveType == "android":
            self.filename = "chrome-android.zip"
        if self.slaveType == "mac-desktop":
            self.filename = "chrome-mac.zip"
        elif self.slaveType == "linux-desktop":
            self.filename = "chrome-linux.zip"
        else:
            self.filename = "chrome-win32.zip"

    def update(self):
        # Step 1: Get latest succesfull build revision
        response = urllib2.urlopen(self.nightly_dir+"LAST_CHANGE")
        chromium_rev = response.read()

        # Step 3: Get v8 revision
        response = urllib2.urlopen(self.nightly_dir + chromium_rev + "/REVISIONS")
        self.cset = re.findall('"v8_revision_git": "([a-z0-9]*)",', response.read())[0]

        # Step 3: Test if there is a new revision
        self.getOrDownload("chrome", self.cset,
                           self.nightly_dir + chromium_rev + "/" + self.filename,
                           self.tmp_dir + self.filename)
        # Step 4: Unzip
        try:
            self.unzip(".", self.filename)
        except zipfile.BadZipfile:
            return

        # Step 5: Install on device
        if self.slaveType == "android":
            print subprocess.check_output(["adb", "install", "-r", self.tmp_dir+"/chrome-android/apks/ChromeShell.apk"])

        # Step 6: Save info
        self.updated = True

    def run(self, page):
	print page
        if self.slaveType == "android":
            self.kill()
            print subprocess.check_output(["adb", "shell", "am start -a android.intent.action.VIEW -n org.chromium.chrome.shell/org.chromium.chrome.shell.ChromeShellActivity -d", page])
        elif self.slaveType == "mac-desktop":
            execs = subprocess.check_output(["find", self.tmp_dir + "chrome-mac", "-type", "f"])
            for i in execs.split("\n"):
		if "/Contents/MacOS/" in i:
                    self.chmodx(i)
            self.subprocess = subprocess.Popen([self.tmp_dir + "chrome-mac/Chromium.app/Contents/MacOS/Chromium", page])
            self.pid = self.subprocess.pid
        elif self.slaveType == "linux-desktop":
            self.chmodx(self.tmp_dir + "chrome-linux/chrome")
            self.subprocess = subprocess.Popen([self.tmp_dir + "chrome-linux/chrome", page])
            self.pid = self.subprocess.pid
        else:
            self.subprocess = subprocess.Popen([self.tmp_dir + "chrome-win32/chrome.exe", page])
            self.pid = self.subprocess.pid

    def kill(self):
        if self.slaveType == "android":
            print subprocess.check_output(["adb", "shell", "pm clear org.chromium.chrome.shell"]);
        else:
            Engine.kill(self)

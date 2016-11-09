import subprocess
import shutil
import time
import os
import stat
import utils

"""
Runner functions:
- start
- kill:
    Kill a given subprocess
- killall:
    Kill all processes given a specific name
- killAllInstances:
    Kill all instances of the default

- getdir:
    Returns the directory where the files are installed.
    On most runners this will just return the path again.
    On android this will give back the directory on the device.
- write:
    Write the content to a file on the device
- rm:
    Remove a file or directory on the device
- mkdir:
    Create a directory on the device
- find:
    find specific file inside a directory and return the path
- install:
    Install an executable on the system.
- put:
    Move a file or directory to the device if needed.
- set_exec_bit:
    Sets the executable bit on a file.

"""
class Runner(object):
    def __init__(self, info):
        self.info = info

    def rm(self, path):
        if not os.path.exists(path):
            print "rm", path, "(non-existing)"
            return

        print "rm", path
        shutil.rmtree(path)

    def kill(self, process):
        print "kill", process.pid
        process.terminate()

        for i in range(100):
            time.sleep(0.1)
            if process.poll():
                return
            time.sleep(0.1)

        try:
            os.kill(int(process.pid), signal.SIGTERM)
        except:
            pass

    def write(self, path, content):
        print "write", path, content
        fp = open(path, 'w')
        fp.write(content);
        fp.close()

    def mkdir(self, path):
        print "mkdir", path
        os.mkdir(path)

    def getdir(self, path):
        return path

    def set_exec_bit(self, path):
        print "chmod u+x", path
        st = os.stat(path)
        os.chmod(path, st.st_mode | stat.S_IEXEC)

    def find(self, path, file):
        paths = subprocess.check_output(["find", path])
        paths = [path.rstrip() for path in paths.splitlines()]
        return [path for path in paths if path.endswith(file)]

    def put(self, path):
        return path

    def execute(self, command, env, path="."):
        print " ".join(command)
        print os.getcwd()
        print path
        with utils.chdir(path):
            return subprocess.check_output(command, env=env)

class LinuxRunner(Runner):
    def killall(self, name):
        print "killall", name
        process = subprocess.Popen(["killall", name])
        # Wait for killall to finish
        while process.poll() is None:
            time.sleep(0.5)

    def killAllInstances(self):
        print "killallinstances"
        self.killall(self.info["linux_processname"])

    def start(self, exe, args = [], env = {}):
        print "start", exe, args, env
        return subprocess.Popen([exe] + args, env=env)

    def install(self, exe):
        path = os.path.dirname(exe)
        paths = subprocess.check_output(["find", path])
        paths = [path.rstrip() for path in paths.splitlines()]
        for path in paths:
            self.set_exec_bit(path)

        return exe

class WindowsRunner(LinuxRunner):
    """ we assume cygwin, e.g. similar to the linux runner """

    def killAllInstances(self):
        print "killallinstances"
        self.killall(self.info["windows_processname"])

    def killall(self, name):
        print "killall", name
        try:
            subprocess.check_output("kill $(ps aux | grep '"+name+"$' | awk '{print $2}')", shell=True)
        except:
            pass

    def install(self, exe):
        path = os.path.dirname(exe)
        paths = subprocess.check_output(["find", path])
        paths = [path.rstrip() for path in paths.splitlines()]
        for path in paths:
            self.set_exec_bit(path)

        return exe

class OSXRunner(Runner):
    def killall(self, name):
        print "killall", name
        process = subprocess.Popen(["killall", name])
        # Wait for killall to finish
        while process.poll() is None:
            time.sleep(0.5)

    def killAllInstances(self):

        if "osx_mount_point" not in self.info or not os.path.exists(self.info["osx_mount_point"]):
            return

        print "killallinstances"
        try:
            subprocess.check_output("kill $(ps aux | grep '"+self.info["osx_mount_point"]+"[^[]' | awk '{print $2}')", shell=True)
        except:
            pass
        try:
            subprocess.check_output(["hdiutil", "detach", "-force", self.info["osx_mount_point"]])
        except:
            pass

    def start(self, exe, args = [], env = {}):
        print "start", exe, args, env
        return subprocess.Popen([exe] + args, env=env)

    def install(self, exe):
        if exe.endswith(".dmg"):
            print "install", exe
            subprocess.check_output(["hdiutil", "attach", exe])
            return self.info["osx_binary"]
        else:
            path = os.path.dirname(exe)
            paths = subprocess.check_output(["find", path])
            paths = [path.rstrip() for path in paths.splitlines()]
            for path in paths:
                self.set_exec_bit(path)

            return exe

class AndroidRunner(Runner):
    def __init__(self, info):
        self.info = info

    def killall(self, name):
        pass

    def killAllInstances(self):
        subprocess.check_output(["adb", "shell", "pm", "clear", self.info["android_processname"]]);
        pass

    def start(self, path, args, env):
        pass

    def rm(self, path):
        subprocess.check_output(["adb", "shell", "rm -rf " + self.getdir(path)])

    def install(self, exe):
        subprocess.check_output(["adb", "install", "-r", exe])

    def kill(self):
        self.killAllInstances()

    def write(self, path, content):
        assert "'" not in content

        subprocess.check_output(["adb", "shell", "echo '" + content + "' > " + self.getdir(path)])

    def mkdir(self, path):
        print "adb", "shell", "mkdir", self.getdir(path)
        subprocess.check_output(["adb", "shell", "mkdir " + self.getdir(path)])

    def getdir(self, path):
        return "/data/local/tmp/" + path

    def put(self, path):
        print "put", path, "on device"
        name = os.path.basename(path)
        if os.path.isdir(path):
            hash1 = subprocess.check_output(["adb", "shell", "cat /data/local/tmp/"+name+"/123hash"]).splitlines()[0]
            hash2 = subprocess.check_output("tar -cf - "+os.path.normpath(path)+" | md5sum", shell=True).splitlines()[0]

            if hash1 != hash2:
                syncDir = os.path.dirname(os.path.realpath(__file__))
                adbSync = os.path.join(syncDir, "adb-sync")
                assert os.path.isfile(adbSync)
                print adbSync, path, self.getdir("")
                subprocess.check_output([adbSync, path, self.getdir("")])

                self.write(os.path.join(name, "123hash"), hash2)
        else:
            print "adb", "push", path, self.getdir(name)
            subprocess.check_output(["adb", "push", path, self.getdir(name)])
        return self.getdir(name)

    def set_exec_bit(self, path):
        print "set_exec_bit not yet supported on AndroidRunner"
        assert False

    def find(self, path):
        print "find not yet supported on AndroidRunner"
        assert False

    def execute(self, command, env, path="."):
        env_flags = ""

        shebang = subprocess.check_output(["adb", "shell", "head "+os.path.join(path, command[0])])
        if shebang.startswith("#!/bin/bash"):
            command = ["sh"] + command
        if shebang.startswith("#!/usr/bin/perl"):
            # Make sure we have perl. Copied from corion.net/perl-android
            perlDir = os.path.dirname(os.path.realpath(__file__))
            perlDir = os.path.join(perlDir, "perl-android")
            self.put(perlDir)

            command = ["perl"] + command

            env_flags += 'PATH="$PATH:/data/local/tmp/perl-android/bin/" '
            env_flags += 'PERL5LIB=/data/local/tmp/perl-android/lib:/data/local/tmp/perl-android/lib/site_perl '
        for i in env:
            env_flags += i+"="+env[i]+" "

        print env_flags
        print "adb shell ... " + " ".join(command) + " ..."
        return subprocess.check_output(["adb", "shell", "cd "+path+";"+env_flags+" " + " ".join(command) + "; exit"])

def getRunner(platform, info = {}):
    if platform == "linux":
        return LinuxRunner(info)
    if platform == "osx":
        return OSXRunner(info)
    if platform == "android":
        return AndroidRunner(info)
    if platform == "windows":
        return WindowsRunner(info)

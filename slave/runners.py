import logging
import os
import shutil
import signal
import stat
import subprocess
import time

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
        self.logger = logging.getLogger(self.__class__.__name__)
        self.info = info

    def rm(self, path):
        if not os.path.exists(path):
            utils.log_info(self.logger, "rm {} (non-existing)".format(path))
            return

        utils.log_info(self.logger, "rm {}".format(path))
        shutil.rmtree(path)

    def kill(self, process):
        utils.log_info(self.logger, "kill {}".format(process.pid))
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
        utils.log_info(self.logger, "write {} {}".format(path, content))
        fp = open(path, 'w')
        fp.write(content);
        fp.close()

    def mkdir(self, path):
        utils.log_info(self.logger, "mkdir {}".format(path))
        os.mkdir(path)

    def getdir(self, path):
        return path

    def set_exec_bit(self, path):
        st = os.stat(path)
        os.chmod(path, st.st_mode | stat.S_IEXEC)

    def find(self, path, file):
        paths = subprocess.check_output(["find", path])
        paths = [p.rstrip() for p in paths.splitlines()]
        return [p for p in paths if p.endswith(file)]

    def put(self, path, recursive=True):
        return path

    def execute(self, command, env, path="."):
        utils.log_info(self.logger, " ".join(command))
        utils.log_info(self.logger, os.getcwd())
        utils.log_info(self.logger, path)
        with utils.chdir(path):
            return utils.run_realtime(command, env=env)

class LinuxRunner(Runner):
    def killall(self, name):
        utils.log_info(self.logger, "killall {}".format(name))
        process = subprocess.Popen(["pkill", name])
        # Wait for killall to finish
        while process.poll() is None:
            time.sleep(0.5)
        time.sleep(1)

    def killAllInstances(self):
        utils.log_info(self.logger, "killallinstances")
        self.killall(self.info["linux_processname"])

    def start(self, exe, args = [], env = {}):
        utils.log_info(self.logger, "start {} {} {}".format(exe, args, utils.diff_env(env)))
        return subprocess.Popen([exe] + args, env=env)

    def install(self, exe):
        path = os.path.dirname(exe)
        paths = subprocess.check_output(["find", path])
        paths = [p.rstrip() for p in paths.splitlines()]

        utils.log_info(self.logger, "Setting executable bit for {} and children.".format(path))
        for path in paths:
            self.set_exec_bit(path)

        return exe

class WindowsRunner(LinuxRunner):
    """ we assume cygwin, e.g. similar to the linux runner """

    def killAllInstances(self):
        utils.log_info(self.logger, "killallinstances")
        self.killall(self.info["windows_processname"])

    def killall(self, name):
        utils.log_info(self.logger, "killall {}".format(name))
        try:
            subprocess.check_output("kill $(ps aux | grep '"+name+"$' | awk '{print $2}')", shell=True)
        except:
            pass

    def install(self, exe):
        path = os.path.dirname(exe)
        paths = subprocess.check_output(["find", path])
        paths = [p.rstrip() for p in paths.splitlines()]

        utils.log_info(self.logger, "Setting executable bit for {} and children.".format(path))
        for path in paths:
            self.set_exec_bit(path)

        return exe

class OSXRunner(Runner):
    def killall(self, name):
        utils.log_info(self.logger, "killall {}".format(name))
        process = subprocess.Popen(["killall", name])
        # Wait for killall to finish
        while process.poll() is None:
            time.sleep(0.5)

    def killAllInstances(self):

        if "osx_mount_point" not in self.info or not os.path.exists(self.info["osx_mount_point"]):
            if "osx_processname" in self.info:
                self.killall(self.info["osx_processname"])
            return

        utils.log_info(self.logger, "killallinstances")
        try:
            subprocess.check_output("kill $(ps aux | grep '"+self.info["osx_mount_point"]+"[^[]' | awk '{print $2}')", shell=True)
        except:
            pass
        try:
            subprocess.check_output(["hdiutil", "unmount", "-force", self.info["osx_mount_point"]])
        except:
            pass
        try:
            subprocess.check_output(["hdiutil", "detach", "-force", self.info["osx_mount_point"]])
        except:
            pass

    def start(self, exe, args = [], env = {}):
        utils.log_info(self.logger, "start {} {} {}".format(exe, args, utils.diff_env(env)))
        return subprocess.Popen([exe] + args, env=env)

    def install(self, exe):
        if exe.endswith(".dmg"):
            utils.log_info(self.logger, "install {}".format(exe))
            subprocess.check_output(["hdiutil", "attach", exe, "-mountpoint", self.info["osx_mount_point"]])
            self.info["osx_binary"] = subprocess.check_output(["find", self.info["osx_mount_point"],  "-name", "firefox"]).rstrip()
            return self.info["osx_binary"]
        path = os.path.dirname(exe)
        paths = subprocess.check_output(["find", path])
        paths = [p.rstrip() for p in paths.splitlines()]

        utils.log_info(self.logger, "Setting executable bit for {} and children.".format(path))
        for path in paths:
            self.set_exec_bit(path)

        return exe

class AndroidRunner(Runner):
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
        utils.log_info(self.logger, "adb shell mkdir {}".format(self.getdir(path)))
        subprocess.check_output(["adb", "shell", "mkdir " + self.getdir(path)])

    def getdir(self, path):
        return "/data/local/tmp/" + path

    def put(self, path, recursive=True):
        utils.log_info(self.logger, "put {} on device".format(path))
        name = os.path.basename(path)
        if os.path.isdir(path):
            hash1 = subprocess.check_output(["adb", "shell", "cat /data/local/tmp/"+name+"/123hash"]).splitlines()[0]
            hash2 = subprocess.check_output("tar -cf - "+os.path.normpath(path)+" | md5sum", shell=True).splitlines()[0]

            if hash1 != hash2:
                syncDir = os.path.dirname(os.path.realpath(__file__))
                if recursive:
                    adbSync = os.path.join(syncDir, "adb-sync-r")
                else:
                    adbSync = os.path.join(syncDir, "adb-sync")
                assert os.path.isfile(adbSync)
                utils.log_info(self.logger, "{} {} {}".format(adbSync, path, self.getdir("")))
                subprocess.check_output([adbSync, path, self.getdir("")])

                self.write(os.path.join(name, "123hash"), hash2)
        else:
            utils.log_info(self.logger, "adb push {} {}".format(path, self.getdir(name)))
            subprocess.check_output(["adb", "push", path, self.getdir(name)])
        return self.getdir(name)

    def set_exec_bit(self, path):
        utils.log_error(self.logger, "set_exec_bit not yet supported on AndroidRunner")
        assert False

    def find(self, path):
        utils.log_error(self.logger, "find not yet supported on AndroidRunner")
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

        utils.log_info(self.logger, "ENV: " + utils.diff_env(env))
        utils.log_info(self.logger, "adb shell ... " + " ".join(command) + " ...")
        return utils.run_realtime(["adb", "shell", "cd "+path+";"+env_flags+" " + " ".join(command) + "; exit"])

def getRunner(platform, info = {}):
    if platform == "linux":
        return LinuxRunner(info)
    if platform == "osx":
        return OSXRunner(info)
    if platform == "android":
        return AndroidRunner(info)
    if platform == "windows":
        return WindowsRunner(info)

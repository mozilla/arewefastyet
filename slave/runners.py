import subprocess
import shutil
import time
import os

class Runner(object):
    def __init__(self, info):
        self.info = info

    def rm(self, path):
        print "rm", path
        if not os.path.exists(path):
            return 

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

class LinuxRunner(Runner):
    def killall(self, name):
        print "killall", name
        subprocess.Popen(["killall", name])

    def killAllInstances(self):
        print "killallinstances"
        self.killall("firefox")

    def start(self, exe, args = [], env = {}):
        print "start", exe, args, env
        return subprocess.Popen([exe] + args, env=env)

    def install(self, exe):
        pass

class OSXRunner(Runner):
    def killall(self, name):
        subprocess.Popen(["killall", name])

    def killAllInstances(self):
        if not os.path.exists(self.info["osx_mount_point"]):
            return

        subprocess.check_output(["hdiutil", "detach", "-force", self.info["osx_mount_point"]])

    def start(self, path, args, env):
        pass

    def install(self, exe):
        subprocess.check_output(["hdiutil", "attach", exe])

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
        subprocess.check_output(["adb", "shell", "mkdir " + self.getdir(path)])

    def getdir(self, path):
        return "/storage/emulated/legacy/" + path


def getRunner(platform, info):
    if platform == "linux":
        return LinuxRunner(info)
    if platform == "osx":
        return OSXRunner(info)
    if platform == "android":
        return AndroidRunner(info)
    if platform == "windows":
        return WindowsRunner(info)

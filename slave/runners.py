import subprocess
import shutil
import time
import os
import stat

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
        print [(path, path.endswith(file), file) for path in paths]
        return [path for path in paths if path.endswith(file)]

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
        if not os.path.exists(self.info["osx_mount_point"]):
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

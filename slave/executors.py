import runners
import time
import os
import sys
import json

import utils

class ShellExecutor(object):
    def __init__(self, engineInfo):
        self.engineInfo = engineInfo

    def run(self, benchmark, config):
        env = os.environ.copy()
        env.clear()
        env.update(config.env())
        env.update(self.engineInfo["env"])

        args = config.args() + self.engineInfo["args"]
        benchmarkDir = os.path.join(utils.config.BenchmarkPath, benchmark.folder())

        return self.execute(benchmarkDir, benchmark, args, env, config)

    def execute(self, benchmarkDir, benchmark, args, env, config):
        runner = runners.getRunner(self.engineInfo["platform"])

        # 1. Move all files to the device if needed
        benchmarkDir = runner.put(benchmarkDir)

        # 2. Put the executables.
        path = os.path.dirname(self.engineInfo["binary"])
        path = runner.put(path)
        binary = os.path.join(path, os.path.basename(self.engineInfo["binary"]))

        # 3. Execute
        env["LD_LIBRARY_PATH"] = path
        command = benchmark.getCommand(binary, args)
        output = runner.execute(command, env, benchmarkDir)

        return benchmark.processResults(output)

class BrowserExecutor(object):

    def __init__(self, engineInfo):
        self.engineInfo = engineInfo

    def run(self, benchmark, config):
        env = os.environ.copy()
        env.update(config.env())
        env.update(self.engineInfo["env"])
        args = [benchmark.url] + config.args() + self.engineInfo["args"]

        self.execute(benchmark, env, args, config.profile())

        if not os.path.exists("results"):
            return None

        fp = open("results", "r")
        results = json.loads(fp.read())
        fp.close()

        return benchmark.processResults(results)

    def resetResults(self):
        if not os.path.exists("results"):
            return

        os.unlink("results")

    def waitForResults(self, timeout):
        timeout = timeout * 60
        while not os.path.exists("results") and timeout > 0:
            time.sleep(10)
            timeout -= 10

class EdgeExecutor(BrowserExecutor):
    def execute(self, benchmark, env, args, profile):
        runner = runners.getRunner(self.engineInfo["platform"], {
            "windows_processname": "cmd.exe"
        })

        # kill browser
        process = runner.start("cmd.exe", ["/C", "taskkill", "/IM", "MicrosoftEdge.exe", "/F"], env)
        process.wait()

        # reset tabs
        process = runner.start("cmd.exe", ["/C", "del", "/Q", "C:\Users\%username%\AppData\Local\Packages\Microsoft.MicrosoftEdge_8wekyb3d8bbwe\AC\MicrosoftEdge\User\Default\Recovery\Active"], env)
        process.wait()

        # reset the result
        self.resetResults()

        # run edge.
        process = runner.start("cmd.exe", ["/C", "start", "microsoft-edge:" + args[0]] + args[1:], env)

        # wait for results
        self.waitForResults(benchmark.timeout)

        # kill browser
        runner.start("cmd.exe", ["/C", "taskkill", "/IM", "MicrosoftEdge.exe", "/F"], env)

class FirefoxExecutor(BrowserExecutor):

    def execute(self, benchmark, env, args, profile):
        runner = runners.getRunner(self.engineInfo["platform"], {
            "osx_mount_point": "/Volumes/Nightly",
            "osx_binary": "/Volumes/Nightly/Nightly.app/Contents/MacOS/firefox",
            "android_processname": "org.mozilla.fennec",
            "linux_processname": "firefox",
            "windows_processname": "firefox.exe"
        })

        # kill all possible running instances.
        runner.killAllInstances()
        runner.killall("plugin-container")

        # if needed install the executable
        binary = runner.install(self.engineInfo["binary"])

        # delete profile
        runner.rm("profile/")

        # create new profile
        runner.mkdir("profile/")

        # Update profile to disable slow script dialog
        runner.write("profile/prefs.js", profile)

        # reset the result
        self.resetResults()

        # start browser
        process = runner.start(binary, args + ["--profile", runner.getdir("profile")], env)

        # wait for results
        self.waitForResults(benchmark.timeout)

        # kill browser
        runner.kill(process)
        runner.killAllInstances()
        runner.killall("plugin-container")

class ChromeExecutor(BrowserExecutor):

    def execute(self, benchmark, env, args, profile):
        runner = runners.getRunner(self.engineInfo["platform"], {
            #"osx_mount_point": "/Volumes/Nightly",
            #"osx_binary": "/Volumes/Nightly/Nightly.app/Contents/MacOS/firefox",
            #"android_processname": "org.mozilla.fennec"
            "linux_processname": "chrome",
            "windows_processname": "chrome.exe"
        })

        # kill all possible running instances.
        runner.killAllInstances()

        # if needed install the executable
        binary = runner.install(self.engineInfo["binary"])

        # Chromium Helper needs to be executable too
        helpers = runner.find(self.engineInfo["folder"], "Chromium Helper")
        for helper in helpers:
            runner.set_exec_bit(helper)

        # reset the result
        self.resetResults()

        # start browser
        process = runner.start(binary, ["--disable-setuid-sandbox"] + args, env)

        # wait for results
        self.waitForResults(benchmark.timeout)

        # kill browser
        runner.kill(process)
        runner.killAllInstances()

class WebKitExecutor(BrowserExecutor):

    def execute(self, benchmark, env, args, profile):
        runner = runners.getRunner(self.engineInfo["platform"], {
            "osx_mount_point": "/Volumes/WebKit",
            "osx_binary": "/Volumes/WebKit/WebKit.app/Contents/MacOS/WebKit"
            #"android_processname": "org.mozilla.fennec",
            #"linux_processname": "firefox"
        })

        # kill all possible running instances.
        runner.killAllInstances()

        # remove the saved tabs.
        runner.rm(os.path.join(os.environ.get("HOME"), "Library","Saved Application State","com.apple.Safari.savedState"))

        # if needed install the executable
        binary = runner.install(self.engineInfo["binary"])

        # reset the result
        self.resetResults()

        # start browser
        process = runner.start("open", ["-F", "-a", binary] + args, env)

        # wait for results
        self.waitForResults(benchmark.timeout)

        # kill browser
        runner.kill(process)
        runner.killAllInstances()

class ServoExecutor(BrowserExecutor):
    def execute(self, benchmark, env, args, profile):
        runner = runners.getRunner(self.engineInfo["platform"], {})

        # kill all possible running instances.
        runner.killall("servo")

        # reset the result
        self.resetResults()

        # start browser
        process = runner.start(self.engineInfo["binary"], args, env)

        # wait for results
        self.waitForResults(benchmark.timeout)

        # kill browser
        runner.kill(process)


#class NativeExecutor(Executor):
#
#    def execute(self, env, args):
#        pass

def getExecutor(engineInfo):
    if engineInfo["shell"]:
        return ShellExecutor(engineInfo)
    if engineInfo["engine_type"] == "firefox" and not engineInfo["shell"]:
        return FirefoxExecutor(engineInfo)
    if engineInfo["engine_type"] == "chrome" and not engineInfo["shell"]:
        return ChromeExecutor(engineInfo)
    if engineInfo["engine_type"] == "webkit" and not engineInfo["shell"]:
        return WebKitExecutor(engineInfo)
    if engineInfo["engine_type"] == "edge" and not engineInfo["shell"]:
        return EdgeExecutor(engineInfo)
    if engineInfo["engine_type"] == "servo":
        return ServoExecutor(engineInfo)


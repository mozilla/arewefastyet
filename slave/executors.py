import json
import multiprocessing
import os
import sys
import time

import utils
import runners

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
        path = runner.put(path, recursive = False)
        binary = os.path.join(path, os.path.basename(self.engineInfo["binary"]))

        # 3. Execute
        env["LD_LIBRARY_PATH"] = path
        command = benchmark.getCommand(binary, args)
        output = runner.execute(command, env, benchmarkDir)

        return benchmark.process_results(output)

class BrowserExecutor(object):
    def __init__(self, engineInfo, queue):
        self.engineInfo = engineInfo
        self.benchmark = None
        self.queue = queue

    def run(self, benchmark, config):
        self.benchmark = benchmark

        env = os.environ.copy()
        env.update(config.env())
        env.update(self.engineInfo["env"])
        args = config.args() + self.engineInfo["args"] + [benchmark.url]

        self.execute(benchmark, env, args, config.profile())

        return benchmark.process_results(self.results)

    def wait_for_results(self):
        timeout_seconds = self.benchmark.timeout * 60
        try:
            self.results = self.queue.get(timeout=timeout_seconds)
        except multiprocessing.queues.Empty:
            print "Queue timeout!"
            self.results = None
        except Exception as e:
            raise e

    def execute(self):
        raise Exception('BrowserExecutor.execute NYI')

class EdgeExecutor(BrowserExecutor):
    def execute(self, benchmark, env, args, profile):
        runner = runners.getRunner(self.engineInfo["platform"], {
            "windows_processname": "cmd.exe"
        })

        # kill browser
        print "Killing Edge (before)..."
        process = runner.start("cmd.exe", ["/C", "taskkill", "/IM", "MicrosoftEdge.exe", "/F"], env)
        process.wait()

        # reset tabs
        process = runner.start("cmd.exe", ["/C", "del", "/Q", "C:\Users\%username%\AppData\Local\Packages\Microsoft.MicrosoftEdge_8wekyb3d8bbwe\AC\MicrosoftEdge\User\Default\Recovery\Active"], env)
        process.wait()

        # run edge.
        process = runner.start("cmd.exe", ["/C", "start", "microsoft-edge:" + args[0]] + args[1:], env)

        # wait for results
        self.wait_for_results()

        # kill browser
        print "Killing Edge (after)..."
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
        print "Killing Firefox (before)..."
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

        # start browser
        process = runner.start(binary, args + ["--no-remote", "--profile", runner.getdir("profile")], env)

        # wait for results
        self.wait_for_results()

        # kill browser
        print "Killing Firefox (after)..."
        runner.kill(process)
        runner.killAllInstances()
        runner.killall("plugin-container")

class ChromeExecutor(BrowserExecutor):
    def execute(self, benchmark, env, args, profile):
        runner = runners.getRunner(self.engineInfo["platform"], {
            #"osx_mount_point": "/Volumes/Nightly",
            #"osx_binary": "/Volumes/Nightly/Nightly.app/Contents/MacOS/firefox",
            #"android_processname": "org.mozilla.fennec"
            "osx_processname": "Chromium",
            "linux_processname": "chrome",
            "windows_processname": "chrome.exe"
        })

        # kill all possible running instances.
        print "Killing Chrome (before)..."
        runner.killAllInstances()

        # if needed install the executable
        binary = runner.install(self.engineInfo["binary"])

        # Chromium Helper needs to be executable too
        helpers = runner.find(self.engineInfo["folder"], "Chromium Helper")
        for helper in helpers:
            runner.set_exec_bit(helper)
        helpers = runner.find(self.engineInfo["folder"], "Chromium Framework")
        for helper in helpers:
            runner.set_exec_bit(helper)

        # enforce an empty user data directory to clear caches and previous
        # settings
        runner.rm("profile/")
        runner.mkdir("profile/")
        runner.write("profile/First Run", "")

        effective_args = ["--disable-setuid-sandbox"] + \
                         ["--user-data-dir=profile"] + \
                         args

        # start browser
        process = runner.start(binary, effective_args, env)

        # wait for results
        self.wait_for_results()

        # kill browser
        print "Killing Chrome (after)..."
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
        print "Killing Webkit (before)..."
        runner.killAllInstances()

        # remove the saved tabs.
        runner.rm(os.path.join(os.environ.get("HOME"), "Library","Saved Application State","com.apple.Safari.savedState"))

        # if needed install the executable
        binary = runner.install(self.engineInfo["binary"])

        # start browser
        process = runner.start("open", ["-F", "-a", binary] + args, env)

        # wait for results
        self.wait_for_results()

        # kill browser
        print "Killing Webkit (after)..."
        runner.kill(process)
        runner.killAllInstances()

class ServoExecutor(BrowserExecutor):
    def execute(self, benchmark, env, args, profile):
        runner = runners.getRunner(self.engineInfo["platform"], {})

        # kill all possible running instances.
        print "Killing Servo (before)..."
        runner.killall("servo")

        # start browser
        process = runner.start(self.engineInfo["binary"], args, env)

        # wait for results
        self.wait_for_results()

        # kill browser
        print "Killing Servo (after)..."
        runner.kill(process)

def make_executor(engineInfo, *args):
    if engineInfo["shell"]:
        return ShellExecutor(engineInfo)
    if engineInfo["engine_type"] == "firefox":
        return FirefoxExecutor(engineInfo, *args)
    if engineInfo["engine_type"] == "chrome":
        return ChromeExecutor(engineInfo)
    if engineInfo["engine_type"] == "webkit":
        return WebKitExecutor(engineInfo)
    if engineInfo["engine_type"] == "edge":
        return EdgeExecutor(engineInfo)
    if engineInfo["engine_type"] == "servo":
        return ServoExecutor(engineInfo)
    raise Exception("Executor not found!")

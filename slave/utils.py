# vim: set ts=4 sw=4 tw=99 et:
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

import os
import sys
import commands
import subprocess
import signal
import ConfigParser
import json
import urllib
import urllib2
import tarfile
import zipfile
import stat

class ConfigState:
    def __init__(self):
        self.inited = False
        self.rawConfig = None
        self.RepoPath = None
        self.BenchmarkPath = None
        self.DriverPath = None
        self.Timeout = 15*60
        self.PythonName = None

    def init(self, name):
        self.rawConfig = ConfigParser.RawConfigParser()
        if not os.path.isfile(name):
            raise Exception('could not find file: ' + name)
        self.rawConfig.read(name)
        self.inited = True

        self.RepoPath = self.get('main', 'repos')
        self.BenchmarkPath = self.getDefault('benchmarks', 'dir', os.path.join(os.getcwd(), "..", "benchmarks"))
        self.DriverPath = self.getDefault('main', 'driver', os.getcwd())
        self.Timeout = self.getDefault('main', 'timeout', str(15*60))
        self.Timeout = eval(self.Timeout, {}, {}) # silly hack to allow 30*60 in the config file.
        self.PythonName = self.getDefault(name, 'python', sys.executable)

    @staticmethod
    def parseBenchmarkTranslates(li):
        urls = {}
        for url in li.split(","):
            url = url.strip()
            before_url, after_url = url.split(":")
            urls[before_url] = after_url
        return urls

    def benchmarkTranslates(self):
        assert self.inited

        li = self.getDefault("benchmarks", "translate", None)
        if not li:
            return []
        return ConfigState.parseBenchmarkTranslates(li)


    def get(self, section, name):
        assert self.inited
        return self.rawConfig.get(section, name)

    def getDefault(self, section, name, default):
        assert self.inited
        if self.rawConfig.has_option(section, name):
            return self.rawConfig.get(section, name)
        return default

config = ConfigState()

class FolderChanger:
    def __init__(self, folder):
        self.old = os.getcwd()
        self.new = folder

    def __enter__(self):
        os.chdir(self.new)

    def __exit__(self, type, value, traceback):
        os.chdir(self.old)

def chdir(folder):
    return FolderChanger(folder)

def Run(vec, env = os.environ.copy()):
    print(">> Executing in " + os.getcwd())
    print(' '.join(vec))
    print("with: " + str(env))
    try:
        o = subprocess.check_output(vec, stderr=subprocess.STDOUT, env=env)
    except subprocess.CalledProcessError as e:
        print 'output was: ' + e.output
        print e
        raise e
    o = o.decode("utf-8")
    print(o)
    return o

def Shell(string):
    print(string)
    status, output = commands.getstatusoutput(string)
    print(output)
    return output

class TimeException(Exception):
    pass
def timeout_handler(signum, frame):
    raise TimeException()
class Handler():
    def __init__(self, signum, lam):
        self.signum = signum
        self.lam = lam
        self.old = None
    def __enter__(self):
        self.old = signal.signal(self.signum, self.lam)
    def __exit__(self, type, value, traceback):
        signal.signal(self.signum, self.old)


def RunTimedCheckOutput(args, env = os.environ.copy(), timeout = None, **popenargs):
    if timeout is None:
        timeout = config.Timeout
    print('Running: "'+ '" "'.join(args) + '" with timeout: ' + str(timeout)+'s')
    print("with: " + str(env))
    p = subprocess.Popen(args, env = env, stdout=subprocess.PIPE, **popenargs)
    with Handler(signal.SIGALRM, timeout_handler):
        try:
            signal.alarm(timeout)
            output = p.communicate()[0]
            # if we get an alarm right here, nothing too bad should happen
            signal.alarm(0)
            if p.returncode:
                print "ERROR: returned" + str(p.returncode)
        except TimeException:
            # make sure it is no longer running
            p.kill()
            # in case someone looks at the logs...
            print ("WARNING: Timed Out")
            # try to get any partial output
            output = p.communicate()[0]
    print (output)
    return output

def run_realtime(cmd, shell=False, env=None):
    """from http://blog.kagesenshi.org/2008/02/teeing-python-subprocesspopen-output.html
    """
    print cmd
    p = subprocess.Popen(cmd, shell=shell, env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    stdout = []
    while True:
        with Handler(signal.SIGALRM, timeout_handler):
            try:
                signal.alarm(60)
                line = p.stdout.readline()
                signal.alarm(0)
                stdout.append(line)
                print line,
            except TimeException:
                line = ''
        if line == '' and p.poll() != None:
            p.stdout.close()
            return_code = p.wait()
            if return_code:
                raise subprocess.CalledProcessError(return_code, cmd)
            break
    return ''.join(stdout)

def unzip(directory, name):
    if "tar.bz2" in name:
        tar = tarfile.open(directory + "/" + name)
        tar.extractall(directory + "/")
        tar.close()
    else:
        zip = zipfile.ZipFile(directory + "/" + name)
        zip.extractall(directory + "/")
        zip.close()

def chmodx(file):
    st = os.stat(file)
    os.chmod(file, st.st_mode | stat.S_IEXEC)

def fetch_json(url):
    # TODO: Replace urllib2 with requests.
    headers = {
        'Accept': 'application/json',
        'User-Agent': 'arewefastyet',
    }
    request = urllib2.Request(url, headers=headers)
    response = urllib2.urlopen(request)
    return json.load(response)

def getOrDownload(directory, prefix, revision, file, output):
    rev_file = directory + "/" + prefix + "-revision"
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


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

config = None
RepoPath = None
BenchmarkPath = None
DriverPath = None
Timeout = 15*60

def InitConfig(name):
    global config, RepoPath, BenchmarkPath, DriverPath, Timeout
    config = ConfigParser.RawConfigParser()
    if not os.path.isfile(name):
        raise Exception('could not find file: ' + name)
    config.read(name)
    RepoPath = config.get('main', 'repos')
    BenchmarkPath = config.get('main', 'benchmarks')
    DriverPath = config_get_default('main', 'driver', os.getcwd())
    Timeout = config_get_default('main', 'timeout', str(Timeout))
    # silly hack to allow 30*60 in the config file.
    Timeout = eval(Timeout, {}, {})

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

def config_get_default(section, name, default=None):
    if config.has_option(section, name):
        return config.get(section, name)
    return default

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
        timeout = Timeout
    print('Running: "'+ '" "'.join(args) + '" with timeout: ' + str(timeout)+'s')
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

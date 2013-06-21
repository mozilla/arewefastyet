# vim: set ts=4 sw=4 tw=99 et:
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

import os
import sys
import commands
import subprocess
import ConfigParser

config = None
RepoPath = None
BenchmarkPath = None

def InitConfig(name):
    global config, RepoPath, BenchmarkPath
    config = ConfigParser.RawConfigParser()
    if not os.path.isfile(name):
        raise Exception('could not find file: ' + name)
    config.read(name)
    RepoPath = config.get('main', 'repos')
    BenchmarkPath = config.get('main', 'benchmarks')

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

def Run(vec):
    print(">> Executing in " + os.getcwd())
    print(' '.join(vec))
    o = subprocess.check_output(vec, stderr=subprocess.STDOUT)
    o = o.decode("utf-8")
    print(o)
    return o

def Shell(string):
    print(string)
    status, output = commands.getstatusoutput(string)
    print(output)
    return output


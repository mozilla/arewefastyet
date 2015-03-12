# vim: set ts=4 sw=4 tw=99 et:
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

import re
import os
import sys
import subprocess
from utils import Run
from utils import FolderChanger

class HG:
    @staticmethod
    def Update(rev = None):
        output = Run(['hg', 'pull', '-u'])
        succeeded = re.search("no changes found", output) == None
        if not rev:
            return succeeded
        output = Run(['hg', 'update', '-r', rev])
        if re.search("unknown revision", output) != None:
            raise Exception('unknown revision: ' + output)
        return True

    @staticmethod
    def Identify():
        output = Run(['hg', 'id', '-i'])
        m = re.match("([0-9a-z]+)\s*", output)
        if m == None:
            raise Exception('unknown output from hg: ' + output)
        return m.group(1)

class SVN:
    @staticmethod
    def Update(rev = None):
        output = Run(['svn', 'update'])
        succeeded = re.search("At revision", output) == None
        if not rev:
            return succeeded
        output = Run(['svn', 'update', '-r', rev])
        if re.search("No such revision", output) != None:
            raise Exception('unknown revision: ' + output)
        return True

    @staticmethod
    def Identify():
        output = Run(['svn', 'info'])
        m = re.search("Revision: ([0-9]+)", output)
        if m == None:
            raise Exception('unknown output from svn: ' + output)
        return m.group(1)

class GIT:
    @staticmethod
    def Update(rev = None):
        assert rev == None
        output = Run(['git', 'pull'])
        return re.search("Already up-to-date", output) == None

    @staticmethod
    def Identify():
        output = Run(['git', 'log', '-1'])
        m = re.match("commit ([0-9a-z]+)\s*", output)
        if m == None:
            raise Exception('unknown output from git: ' + output)
        return m.group(1)

class V8GIT(GIT):
    @staticmethod
    def Update(rev = None):
        assert rev == None
        env = os.environ.copy()
        with FolderChanger('..'):
            Run(['gclient', 'sync'], {"PATH": "depot_tools/:"+env["PATH"]})
        output = Run(['git', 'pull', 'origin', 'master'])
        return re.search("Already up-to-date", output) == None

def get(name):
    if name == 'svn':
        return SVN
    elif name == 'hg':
        return HG
    elif name == 'git':
        return GIT
    elif name == 'v8git':
        return V8GIT
    assert False

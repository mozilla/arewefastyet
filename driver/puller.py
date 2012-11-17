# vim: set ts=4 sw=4 tw=99 et:
import re
import os
import sys
import subprocess
from utils import Run

class HG:
    @staticmethod
    def Update():
        output = Run(['hg', 'pull', '-u'])
        return re.search("no changes found", output) == None

    @staticmethod
    def Identify():
        output = Run(['hg', 'id', '-i'])
        m = re.match("([0-9a-z]+)\s*", output)
        if m == None:
            raise Exception('unknown output from hg: ' + output)
        return m.group(1)

class SVN:
    @staticmethod
    def Update():
        output = Run(['svn', 'update'])
        return re.search("At revision", output) == None

    @staticmethod
    def Identify():
        output = Run(['svn', 'info'])
        m = re.search("Revision: ([0-9]+)", output)
        if m == None:
            raise Exception('unknown output from svn: ' + output)
        return m.group(1)


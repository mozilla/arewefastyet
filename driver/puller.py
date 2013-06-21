# vim: set ts=4 sw=4 tw=99 et:
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

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


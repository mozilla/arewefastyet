# vim: set ts=4 sw=4 tw=99 et:
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

import re
import urllib
import urllib2
import json

import utils
from remotecontroller import RemoteController

class RemoteSubmitter(RemoteController):
    def __init__(self, slave):
        super(RemoteSubmitter, self).__init__(slave)

    def Start(self, timestamp=None):
        for i in range(len(self.urls)):
            try:
                url = self.urls[i]
                url += '?run=yes'
                url += '&MACHINE=' + str(self.machine)
                if timestamp:
                    url += "&stamp=" + str(timestamp)
                url = urllib2.urlopen(url)
                contents = url.read()
                m = re.search('id=(\d+)', contents)
                if m == None:
                    self.runIds[i] = None
                else:
                    self.runIds[i] = int(m.group(1))
            except urllib2.URLError:
                self.runIds[i] = None

    def AddEngine(self, name, cset):
        for i in range(len(self.urls)):
            if not self.runIds[i]:
                continue

            args = { 'run': 'addEngine',
                     'runid': str(self.runIds[i]),
                     'name': name,
                     'cset': cset
                   }
            url = self.urls[i] + '?' + urllib.urlencode(args)
            urllib2.urlopen(url)

    def AddTests(self, tests, suite, suiteversion, mode):
        for test in tests:
            self.SubmitTest(test['name'], suite, suiteversion, mode, test['time'])

    def SubmitTest(self, name, suite, suiteversion, mode, time):
        for i in range(len(self.urls)):
            if not self.runIds[i]:
                continue

            args = { 'name': name,
                     'run': str(self.runIds[i]),
                     'suite': suite,
                     'version': suiteversion,
                     'mode': mode,
                     'time': str(time)
                   }
            url = self.urls[i] + '?' + urllib.urlencode(args)
            urllib2.urlopen(url)

    def Finish(self, status):
        for i in range(len(self.urls)):
            if not self.runIds[i]:
                continue

            url = self.urls[i]
            url += '?run=finish'
            url += '&status=' + str(status)
            url += '&runid=' + str(self.runIds[i])
            urllib2.urlopen(url)

class PrintSubmitter(object):
    def __init__(self, slave):
        self.slave = slave
        self.msg = ''

    def log(self, msg):
        self.msg += msg + '\n'
        print msg

    def Start(self, timestamp=None):
        msg = "Starting benchmark"
        if timestamp:
            msg += " at timestamp" + str(timestamp)
        self.log(msg)

    def AddEngine(self, name, cset):
        self.log("Added engine %s (changeset: %s)" % (name, cset))

    def AddTests(self, tests, suite, suiteversion, mode):
        for test in tests:
            self.SubmitTest(test['name'], suite, suiteversion, mode, test['time'])

    def SubmitTest(self, name, suite, suiteversion, mode, time):
        self.log("%s (%s -- %s): %s" % (name, suiteversion, mode, str(time)))

    def Finish(self, status):
        print "\n*******************************************\nSummary: "
        print self.msg
        self.msg = ''

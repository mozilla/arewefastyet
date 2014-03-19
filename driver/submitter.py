# vim: set ts=4 sw=4 tw=99 et:
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

import re
import utils
import urllib
import urllib2

class Submitter:
    def __init__(self, slave):
        self.machine = slave.machine
        self.urls = utils.config.get('main', 'updateURL').split(",")
        self.runIds = []
        for i in range(len(self.urls)):
            self.urls[i] = self.urls[i].strip()
            self.runIds.append(0)

    def Awake(self):
        for i in range(len(self.urls)):
            url = self.urls[i]
            url += '?awake=yes'
            url += '&MACHINE=' + str(self.machine)
            urllib2.urlopen(url)

    def Start(self):
        for i in range(len(self.urls)):
            url = self.urls[i]
            url += '?run=yes'
            url += '&MACHINE=' + str(self.machine)
            url = urllib2.urlopen(url)
            contents = url.read()
            m = re.search('id=(\d+)', contents)
            if m == None:
                raise Exception('Remote error: ' + contents)
            self.runIds[i] = int(m.group(1))

    def AddEngine(self, name, cset):
        for i in range(len(self.urls)):
            args = { 'run': 'addEngine',
                     'runid': str(self.runIds[i]),
                     'name': name,
                     'cset': cset
                   }
            url = self.urls[i] + '?' + urllib.urlencode(args)
            urllib2.urlopen(url)

    def AddTests(self, tests, suite, mode):
        for test in tests:
            self.SubmitTest(test['name'], suite, mode, test['time'])

    def SubmitTest(self, name, suite, mode, time):
        for i in range(len(self.urls)):
            url = self.urls[i]
            url += '?name=' + name
            url += '&run=' + str(self.runIds[i])
            url += '&suite=' + suite
            url += '&mode=' + mode
            url += '&time=' + str(time)
            urllib2.urlopen(url)

    def Finish(self, status):
        for i in range(len(self.urls)):
            url = self.urls[i]
            url += '?run=finish'
            url += '&status=' + str(status)
            url += '&runid=' + str(self.runIds[i])
            urllib2.urlopen(url)


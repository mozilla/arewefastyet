# vim: set ts=4 sw=4 tw=99 et:
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

import re
import utils
import urllib
import urllib2

class Submitter:
    def __init__(self):
        self.url = utils.config.get('main', 'updateURL')
        self.cpu = utils.config.get('main', 'cpu')
        self.os = utils.config.get('main', 'os')
        self.machine = utils.config.get('main', 'machine')

    def Start(self):
        url = self.url
        url += '?run=yes'
        url += '&CPU=' + self.cpu
        url += '&OS=' + self.os
        url += '&MACHINE=' + str(self.machine)
        url = urllib2.urlopen(url)
        contents = url.read()
        m = re.search('id=(\d+)', contents)
        if m == None:
            raise Exception('Remote error: ' + contents)
        self.runID = int(m.group(1))

    def AddEngine(self, name, cset):
        args = { 'run': 'addEngine',
                 'runid': str(self.runID),
                 'name': name,
                 'cset': cset
               }
        url = self.url + '?' + urllib.urlencode(args)
        urllib2.urlopen(url)

    def AddTests(self, tests, suite, mode):
        for test in tests:
            self.SubmitTest(test['name'], suite, mode, test['time'])

    def SubmitTest(self, name, suite, mode, time):
        url = self.url
        url += '?name=' + name
        url += '&run=' + str(self.runID)
        url += '&suite=' + suite
        url += '&mode=' + mode
        url += '&time=' + str(time)
        urllib2.urlopen(url)

    def Finish(self, status):
        url = self.url
        url += '?run=finish'
        url += '&status=' + str(status)
        url += '&runid=' + str(self.runID)
        urllib2.urlopen(url)


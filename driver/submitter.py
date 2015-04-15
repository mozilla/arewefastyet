# vim: set ts=4 sw=4 tw=99 et:
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

import re
import utils
import urllib
import urllib2
import json

class Submitter:
    def __init__(self, slave):
        self.machine = slave.machine
        self.urls = utils.config.get('main', 'updateURL').split(",")
        self.runIds = []
        for i in range(len(self.urls)):
            self.urls[i] = self.urls[i].strip()
            self.runIds.append(0)

    def RequestedRevs(self):
        data = []
        for i in range(len(self.urls)):
            try:
                url = self.urls[i]
                url += '?requests=1'
                url += '&MACHINE=' + str(self.machine)
                url = urllib2.urlopen(url)
                data += json.loads(url.read())
            except urllib2.URLError:
                pass
        return data

    def Awake(self):
        for i in range(len(self.urls)):
            try:
                url = self.urls[i]
                url += '?awake=yes'
                url += '&MACHINE=' + str(self.machine)
                urllib2.urlopen(url)
            except urllib2.URLError:
                pass

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
        for i in range(len(self.urls)):
            if not self.runIds[i]:
                continue

            score = None
            submiturl = self.urls[i]
            run = self.runIds[i]
            for test in tests:
                if test['name'] == "__total__":
                    score = self.SubmitTest(submiturl, run, suite, suiteversion, mode, test['time'])
                    break

            assert score != None
            if score is None:
                return
        for test in tests:
            if test['name'] != "__total__":
                self.SubmitBreakdown(submiturl, run, score, test['name'], suite, suiteversion, mode, test['time'])

    def SubmitTest(self, submiturl, run, suite, suiteversion, mode, time):
        try:
            args = { 'name': '__total__',
                     'run': str(run),
                     'suite': suite,
                     'version': suiteversion,
                     'mode': mode,
                     'time': str(time)
                   }
            url = submiturl + '?' + urllib.urlencode(args)
            url = urllib2.urlopen(url)
            contents = url.read()
            m = re.search('id=(\d+)', contents)
            if m == None:
                return None
            else:
                return int(m.group(1))
        except urllib2.URLError:
            return None

    def SubmitBreakdown(self, submiturl, run, score, name, suite, suiteversion, mode, time):
        # TODO: remove mode. Breakdown doesn't need it
        args = { 'name': name,
                 'run': str(run),
                 'score': str(score),
                 'suite': suite,
                 'version': suiteversion,
                 'mode': mode,
                 'time': str(time)
               }
        url = submiturl + '?' + urllib.urlencode(args)
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

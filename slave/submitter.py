# vim: set ts=4 sw=4 tw=99 et:
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

import re
import urllib
import urllib2
import json

import utils

class Submitter(object):

    def __init__(self):
        self.urls = utils.config.get('main', 'updateURL').split(",")
        self.runIds = []
        for i in range(len(self.urls)):
            self.urls[i] = self.urls[i].strip()
            self.runIds.append(0)

    def setModeRules(self, rules):
        self.rules = {}
        for rule in rules:
            rule = rule.split(":")
            self.rules[rule[0]] = rule[1]

    def mode(self, engine_type, config):
        return self.rules[engine_type + "," + config]

    def assertMachine(self):
        if not hasattr(self, "machine"):
            print "please provide the machine number for submitting (--submitter-machine)"
            exit()

    def setMachine(self, machine):
        self.machine = machine

class RemoteSubmitter(Submitter):

    def start(self, timestamp=None):
        self.assertMachine()
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

    def createBuild(self, engine_type, config, cset):
        mode = self.mode(engine_type, config)
        for i in range(len(self.urls)):
            if not self.runIds[i]:
                continue

            args = { 'run': 'addEngine',
                     'runid': str(self.runIds[i]),
                     'name': mode,
                     'cset': cset
                   }
            url = self.urls[i] + '?' + urllib.urlencode(args)
            urllib2.urlopen(url)
        return mode

    def addTests(self, tests, suite, suiteversion, mode, extra_info = ""):
        for i in range(len(self.urls)):
            if not self.runIds[i]:
                continue

            score = None
            submiturl = self.urls[i]
            run = self.runIds[i]
            for test in tests:
                if test['name'] == "__total__":
                    score = self.submitTest(submiturl, run, suite, suiteversion, mode, test['time'], extra_info)
                    break

            if score is None:
                score = self.submitTest(submiturl, run, suite, suiteversion, mode, 0, extra_info)
            for test in tests:
                if test['name'] != "__total__":
                    self.submitBreakdown(submiturl, run, score, test['name'], suite, suiteversion, mode, test['time'])

    def submitTest(self, submiturl, run, suite, suiteversion, mode, time, extra_info = ""):
        try:
            args = { 'name': '__total__',
                     'run': str(run),
                     'suite': suite,
                     'version': suiteversion,
                     'mode': mode,
                     'time': str(time),
                     'extra_info': extra_info
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

    def submitBreakdown(self, submiturl, run, score, name, suite, suiteversion, mode, time):
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

    def finish(self, status = 1):
        for i in range(len(self.urls)):
            if not self.runIds[i]:
                continue

            url = self.urls[i]
            url += '?run=finish'
            url += '&status=' + str(status)
            url += '&runid=' + str(self.runIds[i])
            urllib2.urlopen(url)

class PrintSubmitter(Submitter):
    def __init__(self):
        self.msg = ''

    def log(self, msg):
        self.msg += msg + '\n'
        print msg

    def start(self, timestamp=None):
        msg = "Starting benchmark"
        if timestamp:
            msg += " at timestamp" + str(timestamp)
        self.log(msg)

    def createBuild(self, engine_type, config, cset):
        mode = self.mode(engine_type, config)
        self.log("Added mode %s (engine: %s, config: %s, changeset: %s)" % (mode, engine_type, config, cset))
        return mode

    def addTests(self, tests, suite, suiteversion, mode, extra_info = ""):
        for test in tests:
            self.submitTest(test['name'], suite, suiteversion, mode, test['time'], extra_info)

    def submitTest(self, name, suite, suiteversion, mode, time, extra_info = ""):
        self.log("%s (%s -- %s): %s" % (name, suiteversion, mode, str(time)))

    def finish(self, status = 1):
        print "\n*******************************************\nSummary: "
        print self.msg
        self.msg = ''

def getSubmitter(name):
    if name == 'remote':
        return RemoteSubmitter()
    elif name == 'print':
        return PrintSubmitter()
    else:
        raise Exception('unknown submitter!')

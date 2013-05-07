# vim: set ts=4 sw=4 tw=99 et:
import re
import urllib
import urllib2

class Submitter:
    def __init__(self, conf):
        self.url = conf.get('main', 'updateURL')
        self.cpu = conf.get('main', 'cpu')
        self.os = conf.get('main', 'os')
        self.machine = conf.get('main', 'machine')

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


# vim: set ts=4 sw=4 tw=99 et:
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

import urllib2

import utils

class RemoteController(object):
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


# vim: set ts=4 sw=4 tw=99 et:
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

import contextlib
import json
import logging
import os
import re
import urllib
import urllib2

import utils

class Submitter(object):

    def __init__(self):
        self.logger = logging.getLogger(self.__class__.__name__)
        self.urls = utils.config.get('main', 'updateURL').split(",")
        self.runIds = []
        for i in range(len(self.urls)):
            self.urls[i] = self.urls[i].strip()
            self.runIds.append(0)

    def set_mode_rules(self, rules):
        self.rules = {}
        for rule in rules:
            rule = rule.split(":")
            self.rules[rule[0]] = rule[1]

    def set_session(self, session):
        self.runIds = session

    def mode(self, engine_type, config):
        name = engine_type + "," + config
        if name in self.rules:
            return self.rules[name]
        return name

    def assert_machine(self):
        if not hasattr(self, "machine"):
            utils.log_error(self.logger, "please provide the machine number for submitting (--submitter-machine)")
            exit()

    def set_machine(self, machine):
        self.machine = machine

class RemoteSubmitter(Submitter):

    def mode(self, engine_type, config):
        return self.rules[engine_type + "," + config]

    def start(self, timestamp=None):
        self.assert_machine()
        for i in range(len(self.urls)):
            try:
                url = self.urls[i]
                url += '?run=yes'
                url += '&MACHINE=' + str(self.machine)
                if timestamp:
                    url += "&stamp=" + str(timestamp)
                with contextlib.closing(urllib2.urlopen(url)) as url:
                    contents = url.read()
                    m = re.search('id=(\d+)', contents)
                    if m == None:
                        self.runIds[i] = None
                    else:
                        self.runIds[i] = int(m.group(1))
            except urllib2.URLError:
                self.runIds[i] = None

    def start_out_of_order(self, mode, revision, run_before, run_after):
        self.assert_machine()
        for i in range(len(self.urls)):
            try:
                url = self.urls[i]
                url += '?run=ooo'
                url += '&MACHINE=' + str(self.machine)
                url += '&mode=' + str(mode)
                url += '&revision=' + str(revision)
                url += '&run_before_id=' + str(run_before)
                url += '&run_after_id=' + str(run_after)
                with contextlib.closing(urllib2.urlopen(url)) as url:
                    contents = url.read()
                    m = re.search('id=(\d+)', contents)
                    if m == None:
                        self.runIds[i] = None
                    else:
                        self.runIds[i] = int(m.group(1))
            except urllib2.URLError:
                self.runIds[i] = None

    def create_build(self, engine_type, config, cset):
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
            with contextlib.closing(urllib2.urlopen(url)) as url:
                pass
        return mode

    def add_tests(self, tests, suite, suiteversion, mode, extra_info = ""):
        for i in range(len(self.urls)):
            if not self.runIds[i]:
                continue

            score = None
            submiturl = self.urls[i]
            run = self.runIds[i]
            for test in tests:
                if test['name'] == "__total__":
                    score = self.submit_test(submiturl, run, suite, suiteversion, mode, test['time'], extra_info)
                    break

            if score is None:
                score = self.submit_test(submiturl, run, suite, suiteversion, mode, 0, extra_info)
            for test in tests:
                if test['name'] != "__total__":
                    self.submitBreakdown(submiturl, run, score, test['name'], suite, suiteversion, mode, test['time'])

    def submit_test(self, submiturl, run, suite, suiteversion, mode, time, extra_info = ""):
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
            with contextlib.closing(urllib2.urlopen(url)) as url:
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
        with contextlib.closing(urllib2.urlopen(url)) as url:
            pass

    def finish(self, status = 1):
        for i in range(len(self.urls)):
            if not self.runIds[i]:
                continue

            url = self.urls[i]
            url += '?run=finish'
            url += '&status=' + str(status)
            url += '&runid=' + str(self.runIds[i])
            with contextlib.closing(urllib2.urlopen(url)) as url:
                pass

class PrintSubmitter(Submitter):
    def __init__(self):
        super(PrintSubmitter, self).__init__()
        self.msg = ''

    def log(self, msg):
        utils.log_info(self.logger, msg)
        self.msg += msg + '\n'
        print msg

    def start(self, timestamp=None):
        msg = "Starting benchmark"
        if timestamp:
            msg += " at timestamp" + str(timestamp)
        self.log(msg)

    def create_build(self, engine_type, config, cset):
        mode = self.mode(engine_type, config)
        self.log("Added mode %s (engine: %s, config: %s, changeset: %s)" % (mode, engine_type, config, cset))
        return mode

    def add_tests(self, tests, suite, suiteversion, mode, extra_info = ""):
        for test in tests:
            self.submit_test(test['name'], suite, suiteversion, mode, test['time'], extra_info)

    def submit_test(self, name, suite, suiteversion, mode, time, extra_info = ""):
        self.log("%s (%s -- %s): %s" % (name, suiteversion, mode, str(time)))

    def finish(self, status = 1):
        utils.log_info(self.logger, "\n*******************************************\nSummary: ")
        utils.log_info(self.logger, self.msg)
        self.msg = ''

def get_submitter(name):
    if name == 'remote':
        return RemoteSubmitter()
    elif name == 'print':
        return PrintSubmitter()
    else:
        raise Exception('unknown submitter!')

if __name__ == "__main__":
    logger = utils.create_logger('submitter')

    from optparse import OptionParser
    parser = OptionParser(usage="usage: %prog [options]")

    # create a session arguments
    parser.add_option("-c", "--create", action="store_true", dest="create", default=False)
    parser.add_option("-o", "--output", dest="output", type="string",
                      help="The place to write the session too.")
    parser.add_option("-m", "--machine", dest="machine", type="int",
                      help="Give the machine number to submit to.")
    parser.add_option("--mode", dest="mode", type="string",
                      help="OutOfOrder: Give the mode")
    parser.add_option("--revision", dest="rev", type="string",
                      help="OutOfOrder: Give the revision")
    parser.add_option("--run_before", dest="run_before", type="int",
                      help="OutOfOrder: Give the run id whereafter this new run needs to come")
    parser.add_option("--run_after", dest="run_after", type="int",
                      help="OutOfOrder: Give the run id before which this new run needs to come")

    # all other cases need session info
    parser.add_option("-s", "--session", dest="session", type="string")

    parser.add_option("-f", "--finish", action="store_true", dest="finish", default=False)
    (options, args) = parser.parse_args()

    utils.config.init("awfy.config")

    if options.create:
        submitter = RemoteSubmitter()
        submitter.set_machine(options.machine)
        if options.mode:
            submitter.start_out_of_order(options.mode, options.rev, options.run_before, options.run_after)
        else:
            submitter.start()

        fp = open(options.output, "w")
        json.dump(submitter.runIds, fp)
    elif options.finish:
        fp = open(options.session, "r")
        session = json.load(fp)
        submitter = RemoteSubmitter()
        submitter.set_session(session)
        submitter.finish()

        os.remove(options.session)

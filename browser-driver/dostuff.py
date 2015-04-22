import urllib2
import re
import urllib
import tarfile
import subprocess
import engine
import sys
import time
import traceback
from optparse import OptionParser

sys.path.insert(1, '../driver')
import submitter
import utils

parser = OptionParser(usage="usage: %prog [options]")
parser.add_option("-f", "--force", dest="force", action="store_true", default=False,
                  help="Force runs even without source changes")
parser.add_option("-n", "--no-update", dest="noupdate", action="store_true", default=False,
                  help="Skip updating source repositories")
parser.add_option("-c", "--config", dest="config_name", type="string", default="awfy.config",
                  help="Config file (default: awfy.config)")
parser.add_option("-s", "--submitter", dest="submitter", type="string", default="remote",
                  help="Submitter class ('remote' or 'print')")

(options, args) = parser.parse_args()

utils.config.init(options.config_name)

slaveType = utils.config.SlaveType
BrowserBenchmarks = utils.config.browserbenchmarks()
ShellBenchmarks = utils.config.shellbenchmarks()
KnownEngines = utils.config.engines()

# Update All engines
NumUpdated = 0
RunningEngines = []
for engine in KnownEngines:
    try:
        engine.update()
        if engine.updated:
            NumUpdated += 1
        RunningEngines.append(engine)
    except Exception, e:
        import logging
        logging.exception(e) # or pass an error message, see comment

class Slave:
    def __init__(self, machine):
        self.machine = machine
submitter = submitter.getSubmitter(options.submitter)
submit = submitter(Slave(utils.config.get('main', 'machine')))

# No updates. Report to server and wait 60 seconds, before moving on
if NumUpdated == 0 and not options.force:
    submit.Awake();
    time.sleep(60)
    sys.exit(0)

# Report all engines
submit.Start()
for e in RunningEngines:
    for modeInfo in e.modes:
        submit.AddEngine(modeInfo["name"], e.cset)

ranBenchmark = False

# Run all browser benchmarks
for benchmark in BrowserBenchmarks:
    for e in RunningEngines:
        if hasattr(e, "isBrowser") and e.isBrowser:
            if benchmark.run(e, submit):
                ranBenchmark = True

# Run all shell benchmarks
for benchmark in ShellBenchmarks:
    for e in RunningEngines:
        if hasattr(e, "isShell") and e.isShell:
            if benchmark.run(e, submit):
                ranBenchmark = True

if ranBenchmark:
    submit.Finish(1)

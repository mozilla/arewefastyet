import urllib2
import re
import urllib
import tarfile
import subprocess
import engine
import sys
import time
from optparse import OptionParser
from shell-benchmark import Benchmarks as ShellBenchmarks
from browser-benchmark import Benchmarks as BrowserBenchmarks

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

(options, args) = parser.parse_args()

utils.InitConfig(options.config_name)

KnownEngines = [engine.Mozilla(), engine.Chrome()]
NumUpdated = 0

# Update All engines
for e in KnownEngines:
    e.update()
    if e.updated:
        NumUpdated += 1

class Slave:
    def __init__(self, machine):
        self.machine = machine
submit = submitter.Submitter(Slave(utils.config.get('main', 'machine')))

# No updates. Report to server and wait 60 seconds, before moving on
if NumUpdated == 0 and not options.force:
    submit.Awake();
    time.sleep(60)
    sys.exit(0)

# Report all engines
submit.Start()
for e in KnownEngines:
    for modeInfo in e.modes:
        submit.AddEngine(modeInfo["name"], e.cset)

# Run all browser benchmarks
for benchmark in BrowserBenchmarks:
    for e in KnownEngines:
        if hasattr(e, "browser") and e.browser:
            benchmark.run(e, submit)

# Run all shell benchmarks
for benchmark in ShellBenchmarks:
    for e in KnownEngines:
        if hasattr(e, "shell") and e.shell:
            benchmark.run(e, submit)

submit.Finish(1)

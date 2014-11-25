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
import shellbenchmarks
import browserbenchmarks
import fullbrowserbenchmarks

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

slaveType = utils.config.get('main', 'slaveType')
if slaveType == "android":
    KnownEngines = [engine.Mozilla(), engine.Chrome()]
    BrowserBenchmarks = [browserbenchmarks.Octane(),
                         browserbenchmarks.SunSpider(),
                         browserbenchmarks.Kraken(),
                         browserbenchmarks.WebGLSamples()]
    ShellBenchmarks = [shellbenchmarks.SunSpider(),
                       shellbenchmarks.Kraken(),
                       shellbenchmarks.Octane()]
elif slaveType == "mac-desktop":
    KnownEngines = [engine.Mozilla(), engine.Chrome(), engine.WebKit()]
    BrowserBenchmarks = [fullbrowserbenchmarks.Octane(),
                         fullbrowserbenchmarks.Massive(),
                         fullbrowserbenchmarks.JetStream(),
                         fullbrowserbenchmarks.Speedometer(),
                         fullbrowserbenchmarks.Kraken(),
                         fullbrowserbenchmarks.SunSpider(),
                         fullbrowserbenchmarks.Browsermark()]
    ShellBenchmarks = []
elif slaveType == "linux-desktop":
    KnownEngines = [engine.Mozilla()]
    BrowserBenchmarks = [fullbrowserbenchmarks.Octane(),
                         fullbrowserbenchmarks.Massive(),
                         fullbrowserbenchmarks.JetStream(),
                         fullbrowserbenchmarks.Speedometer(),
                         fullbrowserbenchmarks.Kraken(),
                         fullbrowserbenchmarks.SunSpider(),
                         fullbrowserbenchmarks.Browsermark()]
    ShellBenchmarks = []
else:
    KnownEngines = [engine.Mozilla(), engine.MozillaPGO(), engine.MozillaShell(), engine.Chrome()]
    BrowserBenchmarks = [browserbenchmarks.Octane(),
                         browserbenchmarks.SunSpider(),
                         browserbenchmarks.Kraken(),
                         browserbenchmarks.Dromaeo(),
                         browserbenchmarks.WebGLSamples()]
    ShellBenchmarks = [shellbenchmarks.SunSpider(),
                       shellbenchmarks.Kraken(),
                       shellbenchmarks.Octane()]

# Update All engines
NumUpdated = 0
RunningEngines = []
for e in KnownEngines:
    try:
        e.update()
        if e.updated:
            NumUpdated += 1
        RunningEngines.append(e)
    except:
        print "Exception in user code:"
        print '-'*60
        traceback.print_exc(file=sys.stdout)
        print '-'*60

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

# vim: set ts=4 sw=4 tw=99 et:
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

import os
import submitter
import builders
import sys
import signal
import resource
import utils
import time
from optparse import OptionParser
from benchmark import Benchmarks
from collections import namedtuple

parser = OptionParser(usage="usage: %prog [options]")
parser.add_option("-f", "--force", dest="force", action="store_true", default=False,
                  help="Force runs even without source changes")
parser.add_option("-n", "--no-update", dest="noupdate", action="store_true", default=False,
                  help="Skip updating source repositories")
parser.add_option("-c", "--config", dest="config_name", type="string", default="awfy.config",
                  help="Config file (default: awfy.config)")

(options, args) = parser.parse_args()

utils.InitConfig(options.config_name)

# Set resource limits for child processes
resource.setrlimit(resource.RLIMIT_AS, (-1, -1))
resource.setrlimit(resource.RLIMIT_RSS, (-1, -1))
resource.setrlimit(resource.RLIMIT_DATA, (-1, -1))

# Set of builders we'll use.
KnownEngines = [
                builders.MozillaInboundGGC(),
                builders.MozillaInbound(),
                builders.V8(),
                builders.Nitro()
               ]
Engines = []
NumUpdated = 0
for e in KnownEngines:
    try:
        cset, updated = e.updateAndBuild(not options.noupdate, options.force)
    except Exception as err:
        print('Build failed!')
        print(err)
        continue
    if cset == None:
        continue
    if updated and e.important:
        NumUpdated += 1
    Engines.append([e, cset, updated])

submit = submitter.Submitter()

# No updates. Report to server and wait 60 seconds, before moving on
if NumUpdated == 0 and not options.force:
    submit.Awake();
    time.sleep(60)
    sys.exit(0)

# The native compiler is a special thing, for now.
native = builders.NativeCompiler()

# A mode is a configuration of an engine we just built.
Mode = namedtuple('Mode', ['shell', 'args', 'env', 'name', 'cset'])

# Make a list of all modes.
modes = []
for entry in Engines:
    e = entry[0]
    cset = entry[1]
    shell = os.path.join(utils.RepoPath, e.source, e.shell())
    env = None
    with utils.chdir(os.path.join(utils.RepoPath, e.source)):
        env = e.env()
    for m in e.modes:
        if e.args:
            args = list(e.args)
            if m['args']:
                args.append(*m['args'])
        elif m['args']:
            args = list(m['args'])
        else:
            args = []
        mode = Mode(shell, args, env, m['mode'], cset)
        modes.append(mode)

# Inform AWFY of each mode we found.
submit.Start()
for mode in modes:
    submit.AddEngine(mode.name, mode.cset)
submit.AddEngine(native.mode, native.signature)

# Run through each benchmark.
class TimeException(Exception):
    pass

def timeout_handler(signum, frame):
    raise TimeException()

for benchmark in Benchmarks:
    try:
        signal.signal(signal.SIGALRM, timeout_handler)
        signal.alarm(15*60) # trigger alarm in 15 minutes

        benchmark.run(submit, native, modes)

        signal.alarm(0)
    except TimeException:
        pass

submit.Finish(1)

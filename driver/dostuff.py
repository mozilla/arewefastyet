# vim: set ts=4 sw=4 tw=99 et:
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

import os
import sys
import resource
import utils
import time
from optparse import OptionParser
from collections import namedtuple

import benchmarks
import builders
import puller
import slaves
import submitter

parser = OptionParser(usage="usage: %prog [options]")
parser.add_option("-f", "--force", dest="force", action="store_true", default=False,
                  help="Force runs even without source changes")
parser.add_option("-n", "--no-update", dest="noupdate", action="store_true", default=False,
                  help="Skip updating source repositories")
parser.add_option("-c", "--config", dest="config_name", type="string", default="awfy.config",
                  help="Config file (default: awfy.config)")
(options, args) = parser.parse_args()

utils.config.init(options.config_name)

# Set resource limits for child processes
resource.setrlimit(resource.RLIMIT_AS, (-1, -1))
resource.setrlimit(resource.RLIMIT_RSS, (-1, -1))
resource.setrlimit(resource.RLIMIT_DATA, (-1, -1))

# Set of engines that get build.
KnownEngines = [builders.MozillaInbound(),
                builders.V8(),
                builders.Nitro()
               ]
Engines, NumUpdated = builders.build(KnownEngines, not options.noupdate, options.force)

# No updates. Report to server and wait 60 seconds, before moving on
if NumUpdated == 0 and not options.force:
    for slave in slaves.init():
        submit = submitter.Submitter(slave)
        submit.Awake();
    time.sleep(60)
    sys.exit(0)

# The native compiler is a special thing, for now.
native = builders.NativeCompiler()

# A mode is a configuration of an engine we just built.
Mode = namedtuple('Mode', ['shell', 'args', 'env', 'name', 'cset'])

# Make a list of all modes.
modes = []
for engine in Engines:
    shell = os.path.join(utils.RepoPath, engine.source, engine.shell())
    env = None
    with utils.chdir(os.path.join(utils.RepoPath, engine.source)):
        env = engine.env()
    for m in engine.modes:
        engineArgs = engine.args if engine.args else []
        modeArgs = m['args'] if m['args'] else []
        args = engineArgs + modeArgs
        mode = Mode(shell, args, env, m['mode'], engine.cset)
        modes.append(mode)

# Set of slaves that run the builds. 
KnownSlaves = slaves.init()

for slave in KnownSlaves:
    slave.prepare(Engines)

    # Inform AWFY of each mode we found.
    submit = submitter.Submitter(slave)
    submit.Start()
    for mode in modes:
        submit.AddEngine(mode.name, mode.cset)
    submit.AddEngine(native.mode, native.signature)

    slave.benchmark(submit, native, modes)

# Wait for all of the slaves to finish running before exiting.
for slave in KnownSlaves:
    slave.synchronize()

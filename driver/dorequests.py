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
from remotecontroller import RemoteController

parser = OptionParser(usage="usage: %prog [options]")
parser.add_option("-c", "--config", dest="config_name", type="string", default="awfy.config",
                  help="Config file (default: awfy.config)")
(options, args) = parser.parse_args()

utils.InitConfig(options.config_name)

# Set resource limits for child processes
resource.setrlimit(resource.RLIMIT_AS, (-1, -1))
resource.setrlimit(resource.RLIMIT_RSS, (-1, -1))
resource.setrlimit(resource.RLIMIT_DATA, (-1, -1))

# A mode is a configuration of an engine we just built.
Mode = namedtuple('Mode', ['shell', 'args', 'env', 'name', 'cset'])

# Set of engines that get build.
KnownEngines = [builders.MozillaInbound()]

# The native compiler is a special thing, for now.
native = builders.NativeCompiler()

# No updates. Report to server and wait 60 seconds, before moving on
for slave in slaves.init():
    remotecontroller = RemoteController(slave)
    revs = remotecontroller.RequestedRevs();

    for rev in revs:
        Engines, NumUpdated = builders.build(KnownEngines, rev = rev["cset"])

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

        slave.prepare(Engines)

        # Inform AWFY of each mode we found.
        submit = submitter.RemoteSubmitter(slave)
        submit.Start(rev["stamp"])
        for mode in modes:
            submit.AddEngine(mode.name, mode.cset)
        submit.AddEngine(native.mode, native.signature)

        slave.benchmark(submit, native, modes)

        # Wait to finish before going on.
        slave.synchronize()

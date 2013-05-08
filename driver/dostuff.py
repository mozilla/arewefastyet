# vim: set ts=4 sw=4 tw=99 et:
import os
import ConfigParser
import submitter
import builders
import sys
import resource
from benchmark import Benchmarks
import utils
from collections import namedtuple

config = ConfigParser.RawConfigParser()
config.read('awfy.config')
resource.setrlimit(resource.RLIMIT_AS, (-1, -1))
resource.setrlimit(resource.RLIMIT_RSS, (-1, -1))
resource.setrlimit(resource.RLIMIT_DATA, (-1, -1))

# JSC is ilooping...
KnownEngines = [
                builders.MozillaInbound(config),
                builders.V8(config),
                builders.Nitro(config)
               ]
Engines = []
MozillaUpdated = False
NumUpdated = 0
for e in KnownEngines:
    try:
        cset, updated = e.updateAndBuild(True, False)
    except Exception as err:
        print('Build failed!')
        print(err)
        continue
    if cset == None:
        continue
    if updated and e.important:
        NumUpdated += 1
    Engines.append([e, cset, updated])

if NumUpdated == 0:
    sys.exit(0)

# The native compiler is a special thing, for now.
native = builders.NativeCompiler(config)

# A mode is a configuration of an engine we just built.
Mode = namedtuple('Mode', ['shell', 'args', 'env', 'name', 'cset'])

# Make a list of all modes.
modes = []
for entry in Engines:
    e = entry[0]
    cset = entry[1]
    shell = os.path.join(config.get('main', 'testroot'), e.source, e.shell())
    env = None
    with utils.chdir(os.path.join(config.get('main', 'testroot'), e.source)):
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
submit = submitter.Submitter(config)
submit.Start()
for mode in modes:
    submit.AddEngine(mode.name, mode.cset)
submit.AddEngine(native.mode, native.signature)

# Run through each benchmark.
for benchmark in Benchmarks:
    benchmark.run(submit, native, modes)

submit.Finish(1)


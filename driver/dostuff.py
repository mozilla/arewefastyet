# vim: set ts=4 sw=4 tw=99 et:
import os
import ConfigParser
import submitter
import builders
import sys
import resource
import benchmark
import utils

config = ConfigParser.RawConfigParser()
config.read('awfy.config')
resource.setrlimit(resource.RLIMIT_AS, (-1, -1))
resource.setrlimit(resource.RLIMIT_RSS, (-1, -1))
resource.setrlimit(resource.RLIMIT_DATA, (-1, -1))

# JSC is ilooping...
KnownEngines = [
                builders.V8(config),
                builders.MozillaInbound(config),
                builders.MozillaBaselineCompiler(config),
                builders.Nitro(config)
               ]
Engines = []
MozillaUpdated = False
NumUpdated = 0
for e in KnownEngines:
    try:
        cset, updated = e.updateAndBuild(True, False)
    except:
        print('Build failed!')
        continue
    if cset == None:
        continue
    if updated and e.important:
        NumUpdated += 1
    Engines.append([e, cset, updated])

if NumUpdated == 0:
    sys.exit(0)

submit = submitter.Submitter(config)
submit.Start()
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
            args = None
        submit.AddEngine(m['mode'], cset)
        benchmark.RunAndSubmitAll(shell, env, args, submit, m['mode'])

submit.Finish(1)


#!/usr/bin/env python2

import json
import sys
import traceback

from optparse import OptionParser

import benchmarks
import configs
import engineInfo
import executors
import submitter
import utils

parser = OptionParser(usage="usage: %prog url [options]")

parser.add_option("-b", "--benchmark", action="append", dest="benchmarks",
                  help="Benchmark to run (the local ones are deprecated): remote.octane, remote.dromaeo, remote.massive, remote.jetstream, remote.speedometer, remote.kraken, remote.sunspider, remote.browsermark, remote.wasm, shell.octane, shell.sunspider, shell.kraken, shell.assorted, shell.asmjsapps, shell.asmjsmicro, shell.shumway, shell.dart, shell.sixspeed, local.octane, local.sunspider, local.kraken, local.weglsamples, local.assorteddom")

parser.add_option("-s", "--submitter", dest="submitter", type="string", default="print",
                  help="Submitter class ('remote' or 'print')")

parser.add_option("--submitter-mode", action="append", dest="mode_rules",
                  help="When using the remote submitter, give rules to the mode name that needs to get submitted. Format: engine,config_name:mode_name. E.g. firefox,default:jmim")

parser.add_option("--submitter-machine", dest="machine", type="int",
                  help="When using the remote submitter, give the machine number to submit to.")

parser.add_option("--submitter-session", dest="session", type="string",
                  help="When using the remote submitter, it is possible to run execute.py multiple times and still report to the same report.")

parser.add_option("-e", "--engine", action="append", dest="engines",
                  help="Path to the engines that need to get benchmarked")

parser.add_option("-c", "--config", action="append", dest="configs",
                  help="The runtime configs that need to get executed: default, unboxedobjects, turbofan, noasmjs")

(options, args) = parser.parse_args()

if options.engines is None:
    options.engines = ["output"]

if options.configs is None:
    options.configs = ["default"]

if options.benchmarks is None:
    print "Please provide a benchmark to run."
    exit()

if options.mode_rules is None:
    options.mode_rules = [
        "firefox,default:jmim",
        "firefox,noasmjs:noasmjs",
        "firefox,unboxedobjects:unboxedobjects",
        "firefox,testbedregalloc:testbed",
        "firefox,nonwritablejitcode:nonwritablejitcode",
        "firefox,flowaa:flowaa",
        "firefox,branchpruning:branchpruning",
        "firefox,e10s:e10s",
        "firefox,noe10s:noe10s",
        "chrome,default:v8",
        "chrome,turbofan:v8-turbofan",
        "chrome,ignition:v8-ignition",
        "chrome,turboignition:v8-turbo-ignition",
        "webkit,default:jsc",
        "native,default:clang",
        "servo,default:servo"
    ]

#TODO:remove
utils.config.init("awfy.config")

submitter = submitter.getSubmitter(options.submitter)
submitter.setModeRules(options.mode_rules)

if options.session:
    assert not options.machine
    fp = open(options.session, "r")
    session = json.load(fp)
    submitter.setSession(session)
else:
    if options.machine:
        submitter.setMachine(options.machine)
    submitter.start()


# Submit the revisions for every build.
engines = []
for engine_path in options.engines:
    try:
        info = engineInfo.getInfo(engine_path)
        for config_name in options.configs:
            config = configs.getConfig(config_name, info)
            if config.omit():
                continue
            submitter.createBuild(info["engine_type"], config_name, info["revision"])
        engines.append(engine_path)
    except Exception as e:
        print('Failed to get info about ' + engine_path + '!')
        print('Exception: ' +  repr(e))
        traceback.print_exc(file=sys.stdout)

# Run every benchmark for every build and config
benchmarks = [benchmarks.getBenchmark(i) for i in options.benchmarks]
for benchmark in benchmarks:
    for engine_path in engines:
        info = engineInfo.getInfo(engine_path)
        executor = executors.getExecutor(info)

        for config_name in options.configs:
            config = configs.getConfig(config_name, info)
            if config.omit():
                continue

            try:
                results = executor.run(benchmark, config)
                if not results:
                    continue
            except Exception as e:
                print('Failed to run ' + engine_path + ' - ' + benchmark.version + ' - ' + config_name + '!')
                print('Exception: ' +  repr(e))
                import traceback
                traceback.print_exc()
                continue

            mode = submitter.mode(info["engine_type"], config_name)
            submitter.addTests(results, benchmark.suite, benchmark.version, mode)

if not options.session:
    submitter.finish()

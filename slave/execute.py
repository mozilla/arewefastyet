import benchmarks
import configs
import executors
import engineInfo
import submitter

import sys
sys.path.insert(1, '../driver')
import utils

from optparse import OptionParser
parser = OptionParser(usage="usage: %prog url [options]")

parser.add_option("-b", "--benchmark", action="append", dest="benchmarks",
                  help="Benchmark to run (the local ones are deprecated): remote.octane, remote.dromaeo, remote.massive, remote.jetstream, remote.speedometer, remote.kraken, remote.sunspider, remote.browsermark, shell.octane, shell.sunspider, shell.kraken, shell.assorted, shell.asmjsapps, shell.asmjsmicro, shell.shumway, shell.dart, local.octane, local.sunspider, local.kraken, local.weglsamples, local.assorteddom")

parser.add_option("-s", "--submitter", dest="submitter", type="string", default="print",
                  help="Submitter class ('remote' or 'print')")

parser.add_option("--submitter_mode", action="append", dest="mode_rules",
                  help="When using the remote submitter, give rules to the mode name that needs to get submitted. Format: engine,config_name:mode_name. E.g. firefox,default:jmim")

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
        "firefox,unboxedobjects:unboxedobjects",
        "chrome,default:v8",
        "chrome,turbofan:v8-turbofan",
        "webkit,default:jsc",
        "native,default:clang"
    ]

#TODO:remove
utils.config.init("awfy.config")

submitter = submitter.getSubmitter(options.submitter)
submitter.start()
submitter.setModeRules(options.mode_rules)


# Submit the revisions for every build.
for engine_path in options.engines:
    info = engineInfo.getInfo(engine_path)
    for config_name in options.configs:
        config = configs.getConfig(config_name, info)
        if config.omit():
            continue
        submitter.createBuild(info["engine_type"], config_name, info["revision"])

# Run every benchmark for every build and config
benchmarks = [benchmarks.getBenchmark(i) for i in options.benchmarks]
for benchmark in benchmarks:
    for engine_path in options.engines:
        info = engineInfo.getInfo(engine_path)
        executor = executors.getExecutor(info)  

        for config_name in options.configs:
            config = configs.getConfig(config_name, info)
            if config.omit():
                continue

            results = executor.run(benchmark, config)

            mode = submitter.mode(info["engine_type"], config_name)
            submitter.addTests(results, benchmark.suite, benchmark.version, mode)

submitter.finish()

#!/usr/bin/env python2

import json
import multiprocessing
import sys
import traceback

from optparse import OptionParser

import benchmarks
import configs
import engineInfo
import executors
import submitter
import utils
import server

parser = OptionParser(usage="usage: %prog url [options]")

benchmark_help = "Benchmark to run (the local ones are deprecated): " \
                 + ', '.join(benchmarks.all_names())

parser.add_option("-b", "--benchmark", action="append", dest="benchmarks",
                  help=benchmark_help)

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
    print "Please provide a benchmark to run"
    print ""
    parser.print_help()
    exit()

if options.mode_rules is None:
    options.mode_rules = [
        "edge,default:edge",
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

submitter = submitter.get_submitter(options.submitter)
submitter.set_mode_rules(options.mode_rules)

if options.session:
    assert not options.machine
    fp = open(options.session, "r")
    session = json.load(fp)
    submitter.set_session(session)
else:
    if options.machine:
        submitter.set_machine(options.machine)
    submitter.start()

# Submit the revisions for every build.
engines = []
for engine_path in options.engines:
    try:
        info = engineInfo.read_info_file(engine_path)
        for config_name in options.configs:
            config = configs.getConfig(config_name, info)
            if config.omit():
                continue
            submitter.create_build(info["engine_type"], config_name, info["revision"])
        engines.append(engine_path)
    except Exception as e:
        print('Failed to get info about ' + engine_path + '!')
        print('Exception: ' +  repr(e))
        traceback.print_exc(file=sys.stdout)

class Proxy:
    def __init__(self, log):
        self.server = None
        self.log = log

    def __enter__(self):
        self.log("Starting proxy server.")
        self.queue = multiprocessing.Queue()
        self.server = multiprocessing.Process(target=server.main, args=(self.queue,))
        self.server.start()
        self.wait_ack()
        return self

    def __exit__(self, type, value, traceback):
        self.log("Terminating proxy server.")
        if self.server:
            self.server.terminate()
            self.server = None

    def _command(self, query):
        response = utils.fetch_json('http://localhost:8000/admin/' + query)
        self.log('Proxy: {} -> {} (message: {})'.format(query,
                                                        response['status'],
                                                        response.get('message', 'n/a')))

    def flush(self):
        self._command('flush')

    def prime_benchmark(self, benchmark):
        self._command('prime?benchmark=' + benchmark)

    def wait_ack(self):
        received = self.queue.get()
        if received != 'ACK':
            self.log('Proxy - Unexpected queue message: {}'.format(received))

if __name__ == '__main__':
    utils.log_banner("EXECUTE")
    log = utils.make_log('EXECUTE')

    with Proxy(log) as proxy:
        log("Running each benchmark for each config...")

        benchmarks = [benchmarks.get(name) for name in options.benchmarks]
        for benchmark in benchmarks:
            try:
                log("now trying to run benchmark %s..." % benchmark.suite)
            except:
                pass

            proxy.prime_benchmark(benchmark.name())

            for engine_path in engines:
                info = engineInfo.read_info_file(engine_path)
                executor = executors.make_executor(info, proxy.queue)

                for config_name in options.configs:
                    config = configs.getConfig(config_name, info)
                    if config.omit():
                        continue

                    try:
                        results = executor.run(benchmark, config)
                        if not results:
                            continue
                    except Exception as e:
                        log('Failed to run ' + engine_path + ' - ' + benchmark.version + ' - ' + config_name + '!')
                        log('Exception: ' +  repr(e))
                        traceback.print_exc()
                        continue

                    mode = submitter.mode(info["engine_type"], config_name)
                    submitter.add_tests(results, benchmark.suite, benchmark.version, mode)

                    # Try to preserve order of logs.
                    utils.flush()
                    proxy.flush()

        if not options.session:
            submitter.finish()

        log("my work is done here!")
        utils.flush()

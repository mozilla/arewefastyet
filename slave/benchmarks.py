import benchmarks_local
import benchmarks_remote
import benchmarks_shell

def getBenchmark(benchmark):
    section, name = benchmark.split(".")
    if section == "local":
        return benchmarks_local.getBenchmark(name)
    elif section == "remote":
        return benchmarks_remote.getBenchmark(name)
    elif section == "shell":
        return benchmarks_shell.getBenchmark(name)
    else:
        raise Exception("Unknown benchmark type")

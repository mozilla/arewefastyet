
def getBenchmark(benchmark):
    section, name = benchmark.split(".")
    if section == "local":
        import benchmarks_local
        return benchmarks_local.getBenchmark(name);
    elif section == "remote":
        import benchmarks_remote
        return benchmarks_remote.getBenchmark(name);
    elif section == "shell":
        import benchmarks_shell
        return benchmarks_shell.getBenchmark(name);
    else:
        raise Exception("Unknown benchmark type")

import benchmarks_local
import benchmarks_remote
import benchmarks_shell

def all_names():
    ret =  ["remote.{}".format(b.name()) for b in benchmarks_remote.Known]
    ret += ["shell.{}".format(b.name()) for b in benchmarks_shell.Known]
    ret += ["local.{}".format(b.name()) for b in benchmarks_local.Known]
    return ret

def get(target):
    section, name = target.split(".")
    if section == "local":
        known = benchmarks_local.Known
    elif section == "remote":
        known = benchmarks_remote.Known
    elif section == "shell":
        known = benchmarks_shell.Known
    else:
        raise Exception("Unknown benchmark type")

    for B in known:
        if name == B.name():
            return B()
    raise Exception("Unknown benchmark", name)

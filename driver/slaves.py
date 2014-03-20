import sys
import utils
import re
import pickle
import os
import subprocess
import __main__

import benchmarks

class Slave:
    def __init__(self, name):
        self.name = name
        self.machine = utils.config.get(name,'machine')

    def prepare(self):
        pass

    def benchmark(submit, native, modes):
        benchmarks.run(submit, native, modes)

class RemoteSlave(Slave):
    def __init__(self, name):
        self.HostName = utils.config_get_default(name, 'hostname', name)
        self.RepoPath = utils.config_get_default(name, 'repos', utils.RepoPath)
        self.BenchmarkPath = utils.config_get_default(name, 'benchmarks', utils.BenchmarkPath)
        self.DriverPath = utils.config_get_default(name, 'repos', utils.DriverPath)
        self.Timeout = utils.config_get_default(name, 'timeout', str(utils.Timeout))
        # calculate timeoutmake multiplication work!
        self.Timeout = eval(self.Timeout, {}, {})
        # assume that the remote python shell is the currently running shell.
        self.PythonName = utils.config_get_default(name, 'python', sys.executable)
        self.delayed = None
        self.delayedCommand = None

    def prepare(self, engines):
        slave.pushRemote(utils.DriverPath + os.path.sep, slave.DriverPath)
        slave.pushRemote(utils.BenchmarkPath + os.path.sep, slave.BenchmarkPath)

        shell = os.path.join(utils.RepoPath, engine.source, engine.shell())
        for engine in engines:
            rshell = os.path.join(slave.RepoPath, engine.source, engine.shell())
            slave.pushRemote(shell, rshell, follow=True)

    def benchmark(submit, native, modes):
        async = False
        if 'async' in opt:
            async = opt['async']
        fd = open("state.p", "wb")
        # dump the global state gathered from the config file
        pickle.dump(utils.config, fd)
        # dump out the per-slave path *as* the global path for the rpc
        pickle.dump(self.RepoPath, fd)
        pickle.dump(self.BenchmarkPath, fd)
        pickle.dump(self.DriverPath, fd)
        pickle.dump(self.Timeout, fd)

        # dump out all the arguments
        pickle.dump(args, fd)
        fd.close()

        # send the pickled data over the wire so we can make a call
        self.pushRemote(os.path.join(utils.DriverPath, "state.p"), os.path.join(self.DriverPath, "state.p"))
        # cd into the driver's directory, then start running the module.
        self.runRemote(["cd", self.DriverPath, ";", self.PythonName, module.__name__ + '.py', os.path.join(self.DriverPath, "state.p")], async=async)

    def runRemote(self, cmds, async = False):
        # no matter what, we don't want to start running a new command until the old one is gone.
        self.synchronize()

        fullcmd = ["ssh", self.HostName, "--"] + cmds
        if async:
            print ("ASYNC: " + " ".join(fullcmd))
            self.delayed = subprocess.Popen(fullcmd, stderr = subprocess.STDOUT, stdout = subprocess.PIPE)
            subprocess.Popen(['sed', '-e', 's/^/' + self.name + ': /'], stdin = self.delayed.stdout)
            self.delayedCommand = str(fullcmd)
        else:
            utils.Run(fullcmd)
        
    def pushRemote(self, file_loc, file_remote, follow = False):
        rsync_flags = "-aP"
        # if they asked us to follow symlinks, then add '-L' into the arguments.
        if follow:
            rsync_flags += "L"
        utils.Run(["rsync", rsync_flags, file_loc, self.HostName + ":" + file_remote])
        
    def synchronize(self):
        if self.delayed:
            print("Waiting for: "+self.delayedCommand)
            retval = self.delayed.wait()
            if retval != 0:
                raise Exception(self.delayedCommand + ": failed with exit code" + str(retval))
            self.delayed = None
            self.delayedCommand = None

def takerpc(func=None, name=sys.argv[1]):
    if not func:
        func = __main__.default_function
    fd = open("state.p", "rb")
    # pull out the global configuration
    utils.config = pickle.load(fd)
    utils.RepoPath = pickle.load(fd)
    utils.BenchmarkPath = pickle.load(fd)
    utils.DriverPath = pickle.load(fd)
    utils.Timeout = pickle.load(fd)

    # pull out the pickled arguments
    args = pickle.load(fd)
    fd.close()

    # call the one true function
    func(*args)

def init(): 
    slaves = []
    slaveNames = utils.config.get('main', 'slaves')
    for name in slaveNames:
        remote = utils.config.get(slaveNames, 'remote', 1)
        if remote == 1:
            slaves.append(RemoteSlave(name))
        else
            slaves.append(Slave(name))

    if not slaves:
        slaves = [Slave("main")]
    return slaves

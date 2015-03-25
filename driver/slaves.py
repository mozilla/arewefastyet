import sys
import utils
import re
import pickle
import os
import subprocess
import __main__
from collections import namedtuple

import benchmarks

class Slave(object):
    def __init__(self, name):
        self.name = name
        self.machine = utils.config.get(name, 'machine')

    def prepare(self, engines):
        pass

    def synchronize(self):
        pass

    def benchmark(self, submit, native, modes):
        benchmarks.run(submit, native, modes)

class RemoteSlave(Slave):
    def __init__(self, name):
        super(RemoteSlave, self).__init__(name)
        self.HostName = utils.config_get_default(name, 'hostname', name)
        self.delayed = None
        self.delayedCommand = None

    def prepare(self, engines):
        self.pushRemote(utils.DriverPath + os.path.sep, self.DriverPath)
        self.pushRemote(utils.BenchmarkPath + os.path.sep, self.BenchmarkPath)

        for engine in engines:
            shell = os.path.join(utils.RepoPath, engine.source, engine.shell())
            rshell = os.path.join(self.RepoPath, engine.source, engine.shell())
            self.runRemote(["mkdir", "-p", os.path.dirname(rshell)])
            self.pushRemote(shell, rshell, follow=True)

    def benchmark(self, submit, native, modes):
        fd = open("state.p", "wb")
        # dump the global state gathered from the config file
        pickle.dump(utils.config, fd)

        # dump out all the arguments
        pickle.dump(submit, fd)
        pickle.dump(native, fd)
        pickle.dump(modes, fd)
        fd.close()

        # send the pickled data over the wire so we can make a call
        self.pushRemote(os.path.join(utils.DriverPath, "state.p"), os.path.join(self.DriverPath, "state.p"))
        # cd into the driver's directory, then start running the module.
        self.runRemote(["cd", self.DriverPath, ";", self.PythonName, 'slaves.py', os.path.join(self.DriverPath, "state.p")], async=True)

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

def init(): 
    slaves = []
    slaveNames = utils.config.getDefault('main', 'slaves', None)
    if slaveNames:
        slaveNames = slaveNames.split(",")
        for name in slaveNames:
            remote = utils.config.getDefault(name, 'remote', 1)
            if remote == 1:
                slaves.append(RemoteSlave(name))
            else:
                slaves.append(Slave(name))

    if not slaves:
        slaves = [Slave("main")]
    return slaves

if __name__ == "__main__":
    Mode = namedtuple('Mode', ['shell', 'args', 'env', 'name', 'cset'])
    state = sys.argv[1]

    fd = open(state, "rb")
    # pull out the global configuration
    utils.config = pickle.load(fd)

    # pull out the pickled arguments
    submit = pickle.load(fd)
    native = pickle.load(fd)
    modes = pickle.load(fd)
    fd.close()

    # call the one true function
    benchmarks.run(submit, native, modes)

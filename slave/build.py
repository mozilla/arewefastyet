import sys
import json
import urllib2
import urllib
import re
import os
import shutil
import socket
import utils
import puller
import platform
from utils import Run

import tarfile
import zipfile
socket.setdefaulttimeout(120)

class Environment(object):
    def __init__(self):
        self.env_ = os.environ.copy()
        self.add("CC", "gcc")
        self.add("CXX", "g++")
        self.add("LINK", "g++")
        self.ccoption = []

    def add(self, name, data):
        self.env_[name] = data

    def addCCOption(self, option):
        self.ccoption.append(option)

    def get(self):
        env = self.env_.copy()
        if len(self.ccoption) > 0:
            env["CC"] += " " + " ".join(self.ccoption)
            env["CXX"] += " " + " ".join(self.ccoption)
        return env

class Builder(object):

    def __init__(self, config, folder):
        self.env = Environment()
        self.config = config
        self.folder = folder

        #if platform.system() == "Darwin":
        #    self.installClang()
        #    self.env.add("CC", os.path.abspath("clang-3.3/bin/clang"))
        #    self.env.add("CXX", os.path.abspath("clang-3.3/bin/clang++"))
        #    self.env.add("LINK", os.path.abspath("clang-3.3/bin/clang++"))

    def installClang(self):
        # The standard clang version on mac is outdated.
        # Retrieve a better one.

        if os.path.exists("clang-3.3"):
            return

        urllib.urlretrieve("http://llvm.org/releases/3.3/clang+llvm-3.3-x86_64-apple-darwin12.tar.gz",                           "./clang-3.3.tar.gz")
        tar = tarfile.open("clang-3.3.tar.gz")
        tar.extractall(".")
        tar.close()

        shutil.move("clang+llvm-3.3-x86_64-apple-darwin12", "clang-3.3")

        os.unlink("clang-3.3.tar.gz")

    def unlinkBinary(self):
        try:
            os.unlink(self.binary())
        except:
            pass

    def unlinkObjdir(self):
        try:
            shutil.rmtree(self.objdir())
        except:
            pass

    def successfullyBuild(self):
        return os.path.isfile(self.binary())

    def reconf(self):
        return

    def build(self, puller):
        self.unlinkBinary()

        self.make()

        if not self.successfullyBuild():
            self.reconf()
            self.make()

        assert self.successfullyBuild()

        info = self.retrieveInfo()
        info["revision"] = puller.identify()
        # Deafult 'shell' to True only if it isn't set yet!
        if 'shell' not in info:
            info["shell"] = True
        info["binary"] = os.path.abspath(self.binary())

        fp = open(os.path.join(self.folder, "info.json"), "w")
        json.dump(info, fp)
        fp.close()

class MozillaBuilder(Builder):
    def __init__(self, config, folder):
        super(MozillaBuilder, self).__init__(config, folder);

        if platform.architecture()[0] == "64bit" and self.config == "32bit":
            self.env.add("AR",'ar')
            self.env.add("CROSS_COMPILE", '1')
            self.env.addCCOption("-m32")

    def retrieveInfo(self):
        info = {}
        info["engine_type"] = "firefox"
        return info

    def objdir(self):
        return os.path.join(self.folder, 'js', 'src', 'Opt')

    def binary(self):
        return os.path.join(self.objdir(), 'dist', 'bin', 'js')

    def reconf(self):
        # Step 1. autoconf.
        with utils.FolderChanger(os.path.join(self.folder, 'js', 'src')):
            if platform.system() == "Darwin":
                utils.Shell("autoconf213")
            elif platform.system() == "Linux":
                utils.Shell("autoconf2.13")
            elif platform.system() == "Windows":
                utils.Shell("autoconf-2.13")

        # Step 2. configure
        if os.path.exists(os.path.join(self.folder, 'js', 'src', 'Opt')):
            shutil.rmtree(os.path.join(self.folder, 'js', 'src', 'Opt'))
        os.mkdir(os.path.join(self.folder, 'js', 'src', 'Opt'))
        with utils.FolderChanger(os.path.join(self.folder, 'js', 'src', 'Opt')):
            args = ['--enable-optimize', '--disable-debug']
            if platform.architecture()[0] == "64bit" and self.config == "32bit":
                if platform.system() == "Darwin":
                    args.append("--target=i686-apple-darwin10.0.0")
                elif platform.system() == "Linux":
                    args.append("--target=i686-pc-linux-gnu")
                else:
                    assert False

            Run(['../configure'] + args, self.env.get())
        return True

    def make(self):
        if not os.path.exists(os.path.join(self.folder, 'js', 'src', 'Opt')):
            return
        utils.Shell("make -j6 -C " + os.path.join(self.folder, 'js', 'src', 'Opt'))

class WebkitBuilder(Builder):
    def retrieveInfo(self):
        with utils.chdir(os.path.join(self.folder)):
            objdir = os.path.abspath(os.path.join('WebKitBuild', 'Release'))

        info = {}
        info["engine_type"] = "webkit"
        info["env"] = {'DYLD_FRAMEWORK_PATH': objdir}
        return info

    def patch(self):
        patch = os.path.join(os.path.dirname(os.path.realpath(__file__)), "jsc.patch")

        with utils.FolderChanger(self.folder):
            # Hack 1: Remove reporting errors for warnings that currently are present.
            Run(["sed","-i.bac","s/GCC_TREAT_WARNINGS_AS_ERRORS = YES;/GCC_TREAT_WARNINGS_AS_ERRORS=NO;/","Source/JavaScriptCore/Configurations/Base.xcconfig"])
            Run(["sed","-i.bac","s/GCC_TREAT_WARNINGS_AS_ERRORS = YES;/GCC_TREAT_WARNINGS_AS_ERRORS=NO;/","Source/bmalloc/Configurations/Base.xcconfig"])
            Run(["sed","-i.bac","s/GCC_TREAT_WARNINGS_AS_ERRORS = YES;/GCC_TREAT_WARNINGS_AS_ERRORS=NO;/","Source/WTF/Configurations/Base.xcconfig"])
            Run(["sed","-i.bac","s/std::numeric_limits<unsigned char>::max()/255/","Source/bmalloc/bmalloc/SmallLine.h"])
            Run(["sed","-i.bac","s/std::numeric_limits<unsigned char>::max()/255/","Source/bmalloc/bmalloc/SmallRun.h"])
            Run(["patch","Source/JavaScriptCore/jsc.cpp", patch])

            # Hack 2: This check fails currently. Disable checking to still have a build.
            os.remove("Tools/Scripts/check-for-weak-vtables-and-externals")

    def clean(self):
        with utils.FolderChanger(self.folder):
            Run(["svn","revert","Tools/Scripts/check-for-weak-vtables-and-externals"])

            Run(["svn","revert","Source/JavaScriptCore/Configurations/Base.xcconfig"])
            Run(["svn","revert","Source/bmalloc/Configurations/Base.xcconfig"])
            Run(["svn","revert","Source/WTF/Configurations/Base.xcconfig"])
            Run(["svn","revert","Source/bmalloc/bmalloc/SmallLine.h"])
            Run(["svn","revert","Source/bmalloc/bmalloc/SmallPage.h"])
            Run(["svn","revert","Source/JavaScriptCore/jsc.cpp"])

    def make(self):
        try:
            self.patch()
            with utils.FolderChanger(os.path.join(self.folder, 'Tools', 'Scripts')):
                args = ['/usr/bin/perl', 'build-jsc']
                if self.config == '32bit':
                    args += ['--32-bit']
                Run(args, self.env.get())
        finally:
            self.clean()

    def objdir(self):
        return os.path.join(self.folder, 'WebKitBuild', 'Release')

    def binary(self):
        return os.path.join(self.objdir(), 'jsc')

class V8Builder(Builder):
    def __init__(self, config, folder):
        super(V8Builder, self).__init__(config, folder)

        self.env.add("GYP_DEFINES", "clang=1")

    def retrieveInfo(self):
        info = {}
        info["engine_type"] = "chrome"
        info["args"] = ['--expose-gc']
        return info

    def make(self):
        args = ['make', '-j6', '-C', os.path.join(self.folder, 'v8')]
        if self.config == '32bit':
            args += ['ia32.release']
        elif self.config == '64bit':
            args += ['x64.release']
        else:
            assert True

        Run(args, self.env.get())

    def objdir(self):
        if self.config == '64bit':
            return os.path.join(self.folder, 'v8', 'out', 'x64.release')
        elif self.config == '32bit':
            return os.path.join(self.folder, 'v8', 'out', 'ia32.release')
        else:
            assert False

    def binary(self):
        return os.path.join(self.objdir(), 'd8')

class ServoBuilder(Builder):
    def __init__(self, config, folder):
        super(ServoBuilder, self).__init__(config, folder);
        # Some other config here
    
    def retrieveInfo(self):
        info = {}
        info["engine_type"] = "servo"
        info['shell'] = False
        return info

    def objdir(self):
        return os.path.join(self.folder, 'target')

    def binary(self):
        return os.path.join(self.objdir(), 'release', 'servo')

    def make(self):
        with utils.FolderChanger(self.folder):
            args = [os.path.join('.', 'mach'), 'build' ,'--release']
            Run(args, self.env.get())

def getBuilder(config, path):
    # fingerprint the known builders
    if os.path.exists(os.path.join(path, "js", "src")):
        return MozillaBuilder(config, path)
    if os.path.exists(os.path.join(path, "Source", "JavaScriptCore")):
        return WebkitBuilder(config, path)
    if os.path.exists(os.path.join(path, "v8", "LICENSE.v8")):
        return V8Builder(config, path)
    if os.path.exists(os.path.join(path, "components", "servo")):
        return ServoBuilder(config, path)

    raise Exception("Unknown builder")

if __name__ == "__main__":
    from optparse import OptionParser
    parser = OptionParser(usage="usage: %prog [options]")

    parser.add_option("-s", "--source", dest="repo",
                      help="The url of the repo to fetch or one of the known repos name. (mozilla, v8 and webkit are supported.)", default='mozilla')

    parser.add_option("-r", "--rev", dest="revision",
                      help="Force this revision to get build")

    parser.add_option("-o", "--output", dest="output",
                      help="download to DIR, default=output/", metavar="DIR", default='output')

    parser.add_option("-c", "--config", dest="config",
                      help="default, 32bit, 64bit", default='default')

    parser.add_option("-f", "--force", dest="force", action="store_true", default=False,
                      help="Force runs even without source changes")

    (options, args) = parser.parse_args()

    if options.repo is None:
        print "Please provide the source repository to pull"
        exit()

    if not options.output.endswith("/"):
        options.output += "/"

    if options.config not in ["default", "32bit", "64bit"]:
        print "Please provide a valid config"
        exit()

    if options.config == "default":
        options.config, _ = platform.architecture()

    if options.config == "64bit" and platform.architecture()[0] == "32bit":
        print "Cannot compile a 64bit binary on 32bit architecture"
        exit()

    puller = puller.getPuller(options.repo, options.output)
    puller.update(options.revision)

    builder = getBuilder(options.config, options.output)
    if options.force:
        builder.unlinkObjdir()
    builder.build(puller)

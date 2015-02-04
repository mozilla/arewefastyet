# vim: set ts=4 sw=4 tw=99 et:
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

import os
import sys
import utils
import puller
import platform
import subprocess
from utils import Run

class Engine(object):
    def __init__(self):
        self.cpu = utils.config.get('main', 'cpu')

    def updateAndBuild(self, update=True, forceRebuild=False, rev=None):
        with utils.FolderChanger(os.path.join(utils.RepoPath, self.source)):
            self._updateAndBuild(update, forceRebuild, rev=rev)

    def _updateAndBuild(self, update, forceRebuild, rev=None):
        if self.puller == 'svn':
            scm = puller.SVN
        elif self.puller == 'hg':
            scm = puller.HG
        elif self.puller == 'git':
            scm = puller.GIT
        shell = self.shell()
    
        if not os.path.isfile(shell):
            forceRebuild = True
    
        if update:
            self.updated = scm.Update(rev)
        else:
            self.updated = False
    
        if forceRebuild or self.updated:
            try:
                os.unlink(shell)
            except:
                pass

            self.build()
            if not os.path.isfile(shell):
                if self.reconf():
                    self.build()

            self.updated = True
    
        self.cset = scm.Identify()
    
        if not os.path.isfile(shell):
            print(shell)
            raise Exception('could not find shell')

    def reconf(self):
        return False

    def env(self):
        return None

class Nitro(Engine):
    def __init__(self):
        super(Nitro, self).__init__()
        self.puller = 'svn'
        self.source = utils.config.get('jsc', 'source')
        if utils.config.has_option('jsc', 'conf'):
            self.extra = utils.config.get('jsc', 'conf').split(' ')
        else:
            self.extra = []
        self.args = None
        self.important = False # WebKit changes too frequently, we'd need to detect JSC changes.
        self.modes = [
                {
                    'mode': 'jsc',
                    'args': None
                }
            ]

    def env(self):
        env = os.environ.copy()
        env['DYLD_FRAMEWORK_PATH'] = os.path.abspath(os.path.join('WebKitBuild', 'Release'))
        return env

    def build(self):
        # Hack 1: Remove reporting errors for warnings that currently are present.
        Run(["sed","-i.bac","s/GCC_TREAT_WARNINGS_AS_ERRORS = YES;/GCC_TREAT_WARNINGS_AS_ERRORS=NO;/","Source/JavaScriptCore/Configurations/Base.xcconfig"])
        Run(["sed","-i.bac","s/GCC_TREAT_WARNINGS_AS_ERRORS = YES;/GCC_TREAT_WARNINGS_AS_ERRORS=NO;/","Source/bmalloc/Configurations/Base.xcconfig"])
        Run(["sed","-i.bac","s/GCC_TREAT_WARNINGS_AS_ERRORS = YES;/GCC_TREAT_WARNINGS_AS_ERRORS=NO;/","Source/WTF/Configurations/Base.xcconfig"])
        Run(["sed","-i.bac","s/std::numeric_limits<unsigned char>::max()/255/","Source/bmalloc/bmalloc/Line.h"])
        Run(["sed","-i.bac","s/std::numeric_limits<unsigned char>::max()/255/","Source/bmalloc/bmalloc/Page.h"])
        Run(["patch","Source/JavaScriptCore/jsc.cpp","../../driver/jsc.patch"])

        with utils.FolderChanger(os.path.join('Tools', 'Scripts')):
            # Hack 2: This check fails currently. Disable checking to still have a build.
            os.rename("check-for-weak-vtables-and-externals", "check-for-weak-vtables-and-externals2");

            if self.cpu == 'x86':
                args = ['/usr/bin/perl', 'build-jsc', '--32-bit']
            else:
                args = ['/usr/bin/perl', 'build-jsc']
            args.extend(self.extra)
            Run(args)

            os.rename("check-for-weak-vtables-and-externals2", "check-for-weak-vtables-and-externals");

        Run(["svn","revert","Source/JavaScriptCore/Configurations/Base.xcconfig"])
        Run(["svn","revert","Source/bmalloc/Configurations/Base.xcconfig"])
        Run(["svn","revert","Source/WTF/Configurations/Base.xcconfig"])
        Run(["svn","revert","Source/bmalloc/bmalloc/Line.h"])
        Run(["svn","revert","Source/bmalloc/bmalloc/Page.h"])
        Run(["svn","revert","Source/JavaScriptCore/jsc.cpp"])

    def shell(self):
        return os.path.join('WebKitBuild', 'Release', 'jsc')

class V8(Engine):
    def __init__(self):
        super(V8, self).__init__()
        self.puller = 'git'
        self.source = utils.config.get('v8', 'source')
        self.cxx = utils.config.getDefault('v8', 'cxx', None)
        self.cc = utils.config.getDefault('v8', 'cc', None)
        self.cpp = utils.config.getDefault('v8', 'cpp', None)
        self.link = utils.config.getDefault('v8', 'link', None)
        self.cxx_host = utils.config.getDefault('v8', 'cxx_host', None)
        self.cc_host = utils.config.getDefault('v8', 'cc_host', None)
        self.cpp_host = utils.config.getDefault('v8', 'cpp_host', None)
        self.link_host = utils.config.getDefault('v8', 'link_host', None)
        self.args = ['--expose-gc']
        self.important = True
        self.hardfp = (utils.config.has_option('main', 'flags')) and \
                       ("hardfp" in utils.config.get('main', 'flags'))
        self.modes = [{
                        'mode': 'v8',
                        'args': None
                      }, {
                        'mode': 'v8-turbofan',
                        'args': ['--turbo-filter=*', '--turbo-asm'] 
                      }]

    def build(self):
        env = os.environ.copy()
        if self.cxx is not None:
            env['CXX'] = self.cxx
        if self.cc is not None:
            env['CC'] = self.cc
        if self.cpp is not None:
            env['CPP'] = self.cpp
        if self.link is not None:
            env['LINK'] = self.link
        if self.cxx_host is not None:
            env['CXX_host'] = self.cxx_host
        if self.cc_host is not None:
            env['CC_host'] = self.cc_host
        if self.cpp_host is not None:
            env['CPP_host'] = self.cpp_host
        if self.link_host is not None:
            env['LINK_host'] = self.link_host
        env["GYP_DEFINES"] = "clang=1"

        with utils.FolderChanger('..'):
            Run(['gclient', 'sync'], {"PATH": "depot_tools/:"+env["PATH"]})
        if self.cpu == 'x64':
            Run(['make', 'x64.release', '-j3'], env)
        elif self.cpu == 'arm':
            if self.hardfp:
                Run(['make', 'arm.release', 'hardfp=on', 'i18nsupport=off', '-j3'], env)
            else:
                Run(['make', 'arm.release', 'i18nsupport=off', '-j3'], env)
        elif self.cpu == 'x86':
            Run(['make', 'ia32.release', '-j3'], env)
  
    def shell(self):
        if self.cpu == 'x64':
            return os.path.join('out', 'x64.release', 'd8')
        elif self.cpu == 'arm':
            return os.path.join('out', 'arm.release', 'd8')
        elif self.cpu == 'x86':
            return os.path.join('out', 'ia32.release', 'd8')

class Mozilla(Engine):
    def __init__(self, source):
        super(Mozilla, self).__init__()
        self.puller = 'hg'
        self.source = utils.config.get(source, 'source')
        self.config_line = utils.config.get(source, 'conf')
        self.args = None
        self.important = True
        self.objdir = 'Opt'

    def reconf(self):
        # Step 1. autoconf.
        with utils.FolderChanger(os.path.join('js', 'src')):
            if platform.system() == "Darwin":
                utils.Shell("autoconf213")
            elif platform.system() == "Linux":
                utils.Shell("autoconf2.13")
            elif platform.system() == "Windows":
                utils.Shell("autoconf-2.13")

        # Step 2. configure
        if not os.path.exists(os.path.join('js', 'src', self.objdir)):
            os.mkdir(os.path.join('js', 'src', self.objdir)) 
        with utils.FolderChanger(os.path.join('js', 'src', self.objdir)):
            utils.Shell(self.config_line)

        return True

    def build(self):
        utils.Shell("make -j 3 -C " + os.path.join('js', 'src', self.objdir))

    def shell(self):
        return os.path.join('js', 'src', self.objdir, 'dist', 'bin', 'js')

class MozillaInbound(Mozilla):
    def __init__(self):
        super(MozillaInbound, self).__init__('mi')
        self.modes = [
                {
                    'mode': 'jmim',
                    'args': ['--ion-offthread-compile=on', '-W']
                },
                {
                    'mode': 'noasmjs',
                    'args': ['--ion-offthread-compile=on', '-W', '--no-asmjs']
                },
                {
                    'mode': 'backtracking',
                    'args': ['--ion-offthread-compile=on', '-W', '--ion-regalloc=backtracking']
                }
            ]

class MozillaInboundGGC(Mozilla):
    def __init__(self):
        super(MozillaInboundGGC, self).__init__('mi')
        self.config_line += ' --enable-exact-rooting --enable-gcgenerational'
        self.objdir = 'OptGGC'
        self.modes = [
                {
                    'mode': 'ggc',
                    'args': ['--ion-offthread-compile=on', '-W']
                }
            ]
        
class NativeCompiler(Engine):
    def __init__(self):
        super(NativeCompiler, self).__init__()
        self.cc = utils.config.get('native', 'cc')
        self.cxx = utils.config.get('native', 'cxx')
        self.args = utils.config.get('native', 'options').split(' ')
        self.mode = utils.config.get('native', 'mode')

        output = Run([self.cxx, '--version'])
        self.signature = output.splitlines()[0].strip()

def build(engines, updateRepo=True, forceBuild=False, rev=None):
    Engines = []
    NumUpdated = 0
    for engine in engines:
        try:
            engine.updateAndBuild(updateRepo, forceBuild, rev)
        except Exception as err:
            print('Build failed!')
            print(err)
            continue
        if engine.cset == None:
            continue
        if engine.updated and engine.important:
            NumUpdated += 1
        Engines.append(engine)
    return Engines, NumUpdated

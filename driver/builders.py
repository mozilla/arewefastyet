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
    def __init__(self, conf):
        self.testroot = conf.get('main', 'testroot')
        self.cpu = conf.get('main', 'cpu')
        
    def updateAndBuild(self, update, forceRebuild):
        pop = os.getcwd()
        os.chdir(os.path.join(self.testroot, self.source))
    
        if self.puller == 'svn':
            scm = puller.SVN
        elif self.puller == 'hg':
            scm = puller.HG
        shell = self.shell()
    
        if not os.path.isfile(shell):
            forceRebuild = True
    
        updated = False
        if update:
            updated = scm.Update()
    
        if forceRebuild or updated:
            try:
                os.unlink(shell)
            except:
                pass

            self.build()
            if not os.path.isfile(shell):
                if self.reconf():
                    self.build()

            updated = True
    
        version = scm.Identify()
    
        if not os.path.isfile(shell):
            print(shell)
            os.chdir(pop)
            raise Exception('could not find shell')
    
        os.chdir(pop)
        return [version, updated]

    def reconf(self):
        return False

    def env(self):
        return None

class Nitro(Engine):
    def __init__(self, conf):
        super(Nitro, self).__init__(conf)
        self.puller = 'svn'
        self.source = conf.get('jsc', 'source')
        if conf.has_option('jsc', 'conf'):
            self.extra = conf.get('jsc', 'conf').split(' ')
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
        with utils.FolderChanger(os.path.join('Tools', 'Scripts')):
            if self.cpu == 'x86':
                args = ['/usr/bin/perl', 'build-jsc', '--32-bit']
            else:
                args = ['/usr/bin/perl', 'build-jsc']
            args.extend(self.extra)
            Run(args)

    def shell(self):
        return os.path.join('WebKitBuild', 'Release', 'jsc')

class V8(Engine):
    def __init__(self, conf):
        super(V8, self).__init__(conf)
        self.puller = 'svn'
        self.source = conf.get('v8', 'source')
        self.args = ['--expose-gc']
        self.important = True
        self.hardfp = (conf.has_option('main', 'flags')) and ("hardfp" in conf.get('main', 'flags'))
        self.modes = [
                {
                    'mode': 'v8',
                    'args': None
                }
            ]

    def build(self):
        Run(['make', 'dependencies'])
        if self.cpu == 'x64':
            Run(['make', 'x64.release'])
        elif self.cpu == 'arm':
            if self.hardfp:
                Run(['make', 'arm.release', 'hardfp=on'])
            else:
                Run(['make', 'arm.release'])
        elif self.cpu == 'x86':
            Run(['make', 'ia32.release'])
  
    def shell(self):
        if self.cpu == 'x64':
            return os.path.join('out', 'x64.release', 'd8')
        elif self.cpu == 'arm':
            return os.path.join('out', 'arm.release', 'd8')
        elif self.cpu == 'x86':
            return os.path.join('out', 'ia32.release', 'd8')

class Mozilla(Engine):
    def __init__(self, conf, source):
        super(Mozilla, self).__init__(conf)
        self.puller = 'hg'
        self.source = conf.get(source, 'source')
        self.config_line = conf.get(source, 'conf')
        self.args = None
        self.important = True
        self.objdir = 'Opt'

    def env(self):
        env = os.environ.copy()
        if self.cpu == 'x64':
            env['DYLD_LIBRARY_PATH'] = "/usr/local/nspr64/lib"
        elif self.cpu == 'x86':
            env['DYLD_LIBRARY_PATH'] = "/usr/local/nspr32/lib"
        return env

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
        return os.path.join('js', 'src', self.objdir, 'js')

class MozillaInbound(Mozilla):
    def __init__(self, conf):
        super(MozillaInbound, self).__init__(conf, 'mi')
        self.modes = [
                {
                    'mode': 'jmim',
                    'args': ['--ion-parallel-compile=on', '--no-jm', '-W']
                },
                {
                    'mode': 'noasmjs',
                    'args': ['--ion-parallel-compile=on', '--no-jm', '-W', '--no-asmjs']
                }
            ]

class MozillaInboundGGC(Mozilla):
    def __init__(self, conf):
        super(MozillaInboundGGC, self).__init__(conf, 'mi')
        self.config_line += ' --enable-exact-rooting --enable-gcgenerational'
        self.objdir = 'OptGGC'
        self.modes = [
                {
                    'mode': 'ggc',
                    'args': ['--ion-parallel-compile=on', '--no-jm', '-W', '--no-asmjs']
                }
            ]
        
class NativeCompiler(Engine):
    def __init__(self, conf):
        super(NativeCompiler, self).__init__(conf)
        self.cc = conf.get('native', 'cc')
        self.cxx = conf.get('native', 'cxx')
        self.args = conf.get('native', 'options').split(' ')
        self.mode = conf.get('native', 'mode')

        output = Run([self.cxx, '--version'])
        self.signature = output.splitlines()[0].strip()


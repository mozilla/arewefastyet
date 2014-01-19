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

UpdateCache = { }

class Engine(object):
    def __init__(self):
        self.cpu = utils.config.get('main', 'cpu')

    def updateAndBuild(self, update, forceRebuild):
        with utils.FolderChanger(os.path.join(utils.RepoPath, self.source)):
            return self._updateAndBuild(update, forceRebuild)

    def _updateAndBuild(self, update, forceRebuild):
        if self.puller == 'svn':
            scm = puller.SVN
        elif self.puller == 'hg':
            scm = puller.HG
        elif self.puller == 'git':
            scm = puller.GIT
        shell = self.shell()
    
        if not os.path.isfile(shell):
            forceRebuild = True
    
        if self.source in UpdateCache:
            updated = UpdateCache[self.source]
        else:
            if update:
                updated = scm.Update()
            else:
                updated = False
            UpdateCache[self.source] = updated
    
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
            raise Exception('could not find shell')
    
        return [version, updated]

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
    def __init__(self):
        super(V8, self).__init__()
        self.puller = 'svn'
        self.source = utils.config.get('v8', 'source')
        self.args = ['--expose-gc']
        self.important = True
        self.hardfp = (utils.config.has_option('main', 'flags')) and \
                       ("hardfp" in utils.config.get('main', 'flags'))
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
    def __init__(self, source):
        super(Mozilla, self).__init__()
        self.puller = 'hg'
        self.source = utils.config.get(source, 'source')
        self.config_line = utils.config.get(source, 'conf')
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
        return os.path.join('js', 'src', self.objdir, 'dist', 'bin', 'js')

class MozillaInbound(Mozilla):
    def __init__(self):
        super(MozillaInbound, self).__init__('mi')
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
    def __init__(self):
        super(MozillaInboundGGC, self).__init__('mi')
        self.config_line += ' --enable-exact-rooting --enable-gcgenerational'
        self.objdir = 'OptGGC'
        self.modes = [
                {
                    'mode': 'ggc',
                    'args': ['--ion-parallel-compile=on', '--no-jm', '-W']
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


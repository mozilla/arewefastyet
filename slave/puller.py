import re
import os
import sys
import subprocess
from utils import Run
from utils import FolderChanger
import shutil

class Puller(object):
    def __init__(self, repo, folder):
        self.repo = repo
        self.folder = folder

        if self.sameRepo():
            return

        try:
            shutil.rmtree(self.folder)
        except:
            pass
        self.clone()
        assert self.sameRepo()

    def path(self):
        return self.folder

class HG(Puller):
    def sameRepo(self):
        if not os.path.exists(self.folder + ".hg/hgrc"):
            return False
        fp = open(self.folder + ".hg/hgrc")
        for line in fp.readlines():
            if "default = "+self.repo in line:
                return True
        return False

    def clone(self):
        Run(['hg', 'clone', self.repo, self.folder])

    def update(self, rev = None):
        output = Run(['hg', 'pull', '--cwd', self.folder])
        if not rev:
            output = Run(['hg', 'update', '--cwd', self.folder])
            return
        else:
            output = Run(['hg', 'update', '-r', rev, '--cwd', self.folder])
            if re.search("unknown revision", output) != None:
                raise Exception('unknown revision: ' + output)
            return

    def identify(self):
        output = Run(['hg', 'id', '-i', '--cwd', self.folder])
        m = re.match("([0-9a-z]+)\s*", output)
        if m == None:
            raise Exception('unknown output from hg: ' + output)
        return m.group(1)

class SVN(Puller):

    def clone(self):
        Run(['svn', 'co', self.repo, self.folder])

    def sameRepo(self):
        with FolderChanger(self.path()):
            try:
                output = Run(['svn', 'info'])
            except:
                return False
            print self.repo
            print output
            if "URL: "+self.repo in output:
                return True
            exit()
            return False

    def update(self, rev = None):
        with FolderChanger(self.path()):
            if not rev:
                output = Run(['svn', 'update'])
                return

            output = Run(['svn', 'update', '-r', rev])
            if re.search("No such revision", output) != None:
                raise Exception('unknown revision: ' + output)
            return

    def identify(self):
        with FolderChanger(self.path()):
            output = Run(['svn', 'info'])
            m = re.search("Revision: ([0-9]+)", output)
            if m == None:
                raise Exception('unknown output from svn: ' + output)
            return m.group(1)

class GIT(Puller):
    def clone(self):
        Run(['git', 'clone', self.repo, self.folder])

    def sameRepo(self):
        if not os.path.exists(self.path() + ".git/config"):
            return False
        fp = open(self.path() + ".git/config")
        for line in fp.readlines():
            if "url = "+self.repo in line:
                return True
        return False

    def update(self, rev = None):
        assert rev == None

        with FolderChanger(self.path()):
            output = Run(['git', 'pull'])

    def identify(self):
        with FolderChanger(self.path()):
            output = Run(['git', 'log', '-1'])
            m = re.match("commit ([0-9a-z]+)\s*", output)
            if m == None:
                raise Exception('unknown output from git: ' + output)
            return m.group(1)

class V8GIT(GIT):
    def clone(self):
        os.mkdir(self.folder)
        with FolderChanger(self.folder):
            # get depot_tools
            Run(['git', 'clone', 'https://chromium.googlesource.com/chromium/tools/depot_tools.git'])

            # get actual v8 source
            env = os.environ.copy()
            Run(['fetch', 'v8'], {"PATH": "depot_tools/:"+env["PATH"]})

        #TODO: not needed?
        #with FolderChanger(self.path()):
        #    Run(['git', 'checkout', 'master'])

    def path(self):
        return os.path.join(self.folder, "v8")

    def sameRepo(self):
        # Currently only V8 uses this puller
        return os.path.exists(os.path.join(self.path(), "LICENSE.v8"))

    def update(self, rev = None):
        assert rev == None

        with FolderChanger(self.path()):
            Run(['git', 'pull', 'origin', 'master'])

        env = os.environ.copy()
        with FolderChanger(self.path()):
            Run(['gclient', 'sync'], {"PATH": os.path.abspath("../depot_tools/")+":"+env["PATH"]})

class MozillaTry(HG):
    """
    Special-case try, since we don't want to fetch the whole repo.
    """
    def __init__(self, folder):
        super(MozillaTry, self).__init__("https://hg.mozilla.org/mozilla-unified", folder);

    def update(self, rev = None):
        assert rev != None
        output = Run(['hg', 'up', '--check', '--cwd', self.folder])
        output = Run(['hg', 'pull', '--cwd', self.folder])
        output = Run(['hg', 'pull', '-r', rev, '--cwd', self.folder, "https://hg.mozilla.org/try"])
        output = Run(['hg', 'update', '-r', rev, '--cwd', self.folder])
        if re.search("unknown revision", output) != None:
            raise Exception('unknown revision: ' + output)
        return

    def identify(self):
        output = Run(['hg', 'id', '-i', '--cwd', self.folder])
        m = re.match("([0-9a-z]+)\s*", output)
        if m == None:
            raise Exception('unknown output from hg: ' + output)
        return m.group(1)

def getPuller(repo, path):
    if repo == "mozilla":
        repo = "http://hg.mozilla.org/integration/mozilla-inbound"
    elif repo == "webkit":
        repo = "https://svn.webkit.org/repository/webkit/trunk"
    elif repo == "servo":
        repo = "https://github.com/servo/servo.git"

    if "mozilla-try" == repo:
        return MozillaTry(path)
    if "hg." in repo:
        return HG(repo, path)
    if "svn." in repo:
        return SVN(repo, path)
    if repo.endswith(".git"):
        return GIT(repo, path)
    if repo == "v8":
        return V8GIT(repo, path)

    raise Exception("Unknown puller")

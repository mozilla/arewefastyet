# vim: set ts=4 sw=4 tw=99 et:
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

import ConfigParser
import commands
import json
import logging
import os
import signal
import stat
import subprocess
import sys
import tarfile
import urllib
import urllib2
import zipfile
import zlib


class ConfigState:
    def __init__(self):
        self.inited = False
        self.rawConfig = None
        self.RepoPath = None
        self.BenchmarkPath = None
        self.DriverPath = None
        self.Timeout = 15*60
        self.PythonName = None

    def init(self, name):
        if not os.path.isfile(name):
            raise Exception('could not find file: ' + name)

        self.rawConfig = ConfigParser.RawConfigParser()
        self.rawConfig.read(name)
        self.inited = True

        self.RepoPath = self.get('main', 'repos')
        self.BenchmarkPath = self.getDefault('benchmarks', 'dir', os.path.join(os.getcwd(), "..", "benchmarks"))
        self.DriverPath = self.getDefault('main', 'driver', os.getcwd())
        self.Timeout = self.getDefault('main', 'timeout', str(15*60))
        self.Timeout = eval(self.Timeout, {}, {}) # silly hack to allow 30*60 in the config file.
        self.PythonName = self.getDefault(name, 'python', sys.executable)

    @staticmethod
    def parseBenchmarkTranslates(li):
        urls = {}
        for url in li.split(","):
            url = url.strip()
            before_url, after_url = url.split(":")
            urls[before_url] = after_url
        return urls

    def benchmarkTranslates(self):
        assert self.inited
        li = self.getDefault("benchmarks", "translate", None)
        if not li:
            return []
        return ConfigState.parseBenchmarkTranslates(li)

    def get(self, section, name):
        assert self.inited
        return self.rawConfig.get(section, name)

    def getDefault(self, section, name, default):
        assert self.inited
        if self.rawConfig.has_option(section, name):
            return self.rawConfig.get(section, name)
        return default

config = ConfigState()

class FolderChanger:
    def __init__(self, folder):
        self.old = os.getcwd()
        self.new = folder

    def __enter__(self):
        os.chdir(self.new)

    def __exit__(self, type, value, traceback):
        os.chdir(self.old)

def chdir(folder):
    return FolderChanger(folder)

def diff_env(env):
    """
    Returns only the keys in env that are not in the default environment.
    """
    env_copy = os.environ.copy()
    return { k: env[k] for k in env if k not in env_copy or env_copy[k] != env[k] }

def Run(vec, env = os.environ.copy(), shell=False, silent=False):
    logger = logging.getLogger('Run')
    print_cmd = vec if shell else ' '.join(vec)
    log_info(logger, ">> Executing in " + os.getcwd() + ': ' + print_cmd)

    print_env = diff_env(env)
    if len(print_env):
        log_info(logger, "with: " + str(print_env))

    log_flush()
    try:
        o = subprocess.check_output(vec, stderr=subprocess.STDOUT, env=env, shell=shell)
    except subprocess.CalledProcessError as e:
        log_exception(logger, 'output was: ' + e.output)
        raise e
    o = o.decode("utf-8")

    if not silent:
        log_info(logger, o)

    return o

def Shell(string):
    logger = logging.getLogger('Shell')
    log_info(logger, "{}".format(string))
    log_flush()
    status, output = commands.getstatusoutput(string)
    log_info(logger, "status: {}, output: {}".format(status, output))
    return output

class TimeException(Exception):
    pass

def timeout_handler(signum, frame):
    raise TimeException()

class Handler():
    def __init__(self, signum, lam):
        self.signum = signum
        self.lam = lam
        self.old = None
    def __enter__(self):
        self.old = signal.signal(self.signum, self.lam)
    def __exit__(self, type, value, traceback):
        signal.signal(self.signum, self.old)

def RunTimedCheckOutput(args, env = os.environ.copy(), timeout = None, **popenargs):
    if timeout is None:
        timeout = config.Timeout

    logger = logging.getLogger('RunTimedCheckOutput')
    log_info(logger, 'Running: "'+ '" "'.join(args) + '" with timeout: ' + str(timeout)+'s')
    log_info(logger, "with: " + str(env))
    log_flush()
    p = subprocess.Popen(args, env = env, stdout=subprocess.PIPE, **popenargs)
    with Handler(signal.SIGALRM, timeout_handler):
        try:
            signal.alarm(timeout)
            output = p.communicate()[0]
            # if we get an alarm right here, nothing too bad should happen
            signal.alarm(0)
            if p.returncode:
                log_error(logger, "ERROR: returned" + str(p.returncode))
        except TimeException:
            # make sure it is no longer running
            p.kill()
            # in case someone looks at the logs...
            logger.warning(logger, "WARNING: Timed Out")
            # try to get any partial output
            output = p.communicate()[0]
    log_info(logger, output)
    return output

def run_realtime(cmd, shell=False, env=None):
    """from http://blog.kagesenshi.org/2008/02/teeing-python-subprocesspopen-output.html
    """
    logger = logging.getLogger('run_realtime')
    log_info(logger, cmd)
    log_flush()
    p = subprocess.Popen(cmd, shell=shell, env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    stdout = []
    while True:
        with Handler(signal.SIGALRM, timeout_handler):
            try:
                signal.alarm(60)
                line = p.stdout.readline()
                signal.alarm(0)
                stdout.append(line)
                log_info(logger, line)
            except TimeException:
                line = ''
        if line == '' and p.poll() != None:
            p.stdout.close()
            return_code = p.wait()
            if return_code:
                log_exception(logger, "Exception in run_realtime")
                raise subprocess.CalledProcessError(return_code, cmd)
            break
    return ''.join(stdout)

def unzip(directory, name):
    logger = logging.getLogger('unzip')
    if "tar.bz2" in name:
        log_info(logger, "Running: untar " + name)
        tar = tarfile.open(directory + "/" + name)
        tar.extractall(directory + "/")
        tar.close()
    else:
        log_info(logger, "Running: unzip " + name)
        zip = zipfile.ZipFile(directory + "/" + name)
        zip.extractall(directory + "/")
        zip.close()

def chmodx(file):
    logger = logging.getLogger('chmodx')
    log_info(logger, "Running: chmodx" + file)
    st = os.stat(file)
    os.chmod(file, st.st_mode | stat.S_IEXEC)

def fetch_json(url):
    logger = logging.getLogger('fetch_json')
    log_info(logger, "Fetching JSON at " + url)

    # TODO: Replace urllib2 with requests.
    headers = {
        'Accept': 'application/json',
        'User-Agent': 'arewefastyet',
    }
    request = urllib2.Request(url, headers=headers)
    response = urllib2.urlopen(request)

    read = response.read()
    if response.headers.get('Content-Encoding', None) == 'gzip':
        try:
            read = zlib.decompress(read, 16 + zlib.MAX_WBITS)
        except:
            pass

    return json.loads(read)

def getOrDownload(directory, prefix, revision, file, output):
    logger = logging.getLogger('getOrDownload')
    rev_file = directory + "/" + prefix + "-revision"
    old_revision = ""
    if os.path.isfile(rev_file):
        fp = open(rev_file, 'r')
        old_revision = fp.read()
        fp.close()

    if revision != old_revision:
        log_info(logger, "Retrieving {}".format(file))
        urllib.urlretrieve(file, output)

        fp = open(rev_file, 'w')
        fp.write(revision)
        fp.close()

def log_banner(text):
    line = "*******************************************************************************\n"
    line += (" " * ((len(line) - 1 - len(text)) / 2)) + text + '\n'
    line += "*******************************************************************************"
    log_info(logging.getLogger(), line)

def make_log(name):
    def log(*args):
        log_info(logging.getLogger(), "{} -- ".format(name) + ' '.join(args))
    return log

def flush():
    sys.stdout.flush()
    sys.stderr.flush()
    log_flush()

def create_logger(maxBytes=0, backupCount=0, rollover=False):
    """Create a rotating file logger which will be used to log messages
    both to stdout via print as well as to ~/AWFY.log. This will allow
    us to keep the currently expected print output to stdout while at
    the same time capturing these printed log messages to a log file
    for diagnosis.


    Use a rotating file handler which will keep the most recent copies
    of the log file.

    In the main process running task.py, backupCount is set to 3 to
    keep 3 copies and maxBytes is set to the maximum integer so that
    the log will not be automatically rolled over. Instead the log
    will only be rolled over in the main task.py process. Subprocesses
    which are created will use the same file name but with maxBytes
    and backupCount set to 0 so they will not roll over at all.
    """
    from logging.handlers import RotatingFileHandler

    logger = logging.getLogger()
    logger.setLevel(logging.DEBUG)
    file_handler = RotatingFileHandler(
        os.path.join(os.environ['HOME'], 'AWFY.log'),
        maxBytes=sys.maxint,
        backupCount=3)
    file_handler.setLevel(logging.DEBUG)
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)
    if rollover and maxBytes > 0 and backupCount > 0:
        file_handler.doRollover()
    return logger

def log_info(logger, msg):
    print msg
    logger.info(msg.rstrip())

def log_warning(logger, msg):
    print msg
    logger.warning(msg.rstrip())

def log_error(logger, msg):
    print msg
    logger.error(msg.rstrip())

def log_exception(logger, msg):
    print msg
    logger.exception(msg.rstrip())

def log_flush():
    """Flush root logger handlers which have flush methods"""
    logger = logging.getLogger()
    for h in logger.handlers:
        if hasattr(h, 'flush'):
            h.flush()

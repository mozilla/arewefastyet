import BaseHTTPServer
import hashlib
import httplib
import json
import os
import pickle
import requests
import signal
import sys
import urllib
import urlparse

from SimpleHTTPServer import SimpleHTTPRequestHandler

import benchmarks_local
import benchmarks_remote

import utils
utils.config.init("awfy.config")
translates = utils.config.benchmarkTranslates()

class LogWriter(object):
    def __init__(self):
        self.content = ''

    def write(self, txt):
        self.content += txt

STDOUT = LogWriter()
STDERR = LogWriter()

gqueue = None
cache = {}

class AWFYHandler(SimpleHTTPRequestHandler):
    def handle_one_request(self):
        """ This sometimes times out. Don't block """
        with utils.Handler(signal.SIGALRM, utils.timeout_handler):
            try:
                timeout = int(utils.config.getDefault('main', 'serverTimeout', 20))

                signal.alarm(timeout)
                SimpleHTTPRequestHandler.handle_one_request(self)
            except utils.TimeException:
                print "Server - timeout"
            finally:
                signal.alarm(0)

    def _json(self, obj):
        content = json.dumps(obj)

        self.send_response(200)
        self.send_header("Content-type", 'application/json')
        self.send_header("Content-Length", len(content))
        self.end_headers()

        self.wfile.write(bytes(content))

    def _json_ok(self):
        return self._json({
            'status': 'ok'
        })

    def _json_err(self, message):
        return self._json({
            'status': 'error',
            'message': message
        })

    def _flush(self):
        #sys.stdout = sys.__stdout__
        #sys.stderr = sys.__stdout__

        if len(STDOUT.content) + len(STDERR.content) > 0:
            print("")
            print("Server stdout:")
            print(STDOUT.content)
            print("Server stderr:")
            print(STDERR.content)
            print("")

        utils.flush()

        #sys.stdout = STDOUT
        #sys.stderr = STDERR

        return self._json_ok()

    def prime_local(self, path, Benchmark):
        bench_dir, _ = os.path.split(self.translate_path(Benchmark().page))
        if not os.path.isdir(bench_dir):
            return self._json_err("{} isn't a valid path.".format(path))

        def put_file_in_cache(full_path):
            content_type = self.guess_type(full_path)

            # Always read in binary mode. Opening files in text mode may cause
            # newline translations, making the actual size of the content
            # transmitted *less* than the content-length!
            f = open(full_path, 'rb')
            content = f.read()

            content = Benchmark.inject_data(full_path, content)

            fstat = os.fstat(f.fileno())
            headers = {
                'Content-Type': content_type,
                'Content-Length': len(content),
                'Last-Modified': self.date_time_string(fstat.st_mtime)
            }
            f.close()

            cache[full_path] = (content, headers)
            print "Cached file {}".format(full_path)

        def put_dir_in_cache(dir_path):
            for root, dirs, files in os.walk(dir_path):
                for f in files:
                    put_file_in_cache(os.path.join(root, f))
                for le_dir in dirs:
                    put_dir_in_cache(os.path.join(root, le_dir))
                print "Cached dir {}".format(root)

        put_dir_in_cache(bench_dir)

        return self._json_ok()

    def handle_admin(self):
        global cache

        if self.path == "/admin/flush":
            return self._flush()

        if self.path.startswith('/admin/prime'):
            raw_query = urlparse.urlparse(self.path).query
            query = urlparse.parse_qs(raw_query)
            benchmark = query['benchmark'][0]

            # Reset cache.
            cache = {}

            print "Priming for benchmark ", benchmark
            for Known in benchmarks_local.Known:
                if Known.name() == benchmark:
                    return self.prime_local(self.path, Known)

            # TODO remote benchmarks

            if found is None:
                return self._json_err("Couldn't find benchmark with name {}".format(benchmark))

            # One-off migration: if there's a cache dir with the previous name
            # format, assume it's the latest version and rename it.
            # TODO for remote benchmarks only
            #cache_dir_name =  + '-' + version
            #if os.path.exists("cache/" + cache_dir_name + "/"):
            #    os.rename("cache/" + cache_dir_name, "cache/" + bench_dir_name)


    def do_GET(self):
        if self.path.startswith("/admin/"):
            self.handle_admin()
            return

        if self.path.startswith('/submit'):
            return self.capture_results(urlparse.urlparse(self.path).query)

        if self.remote_benchmark():
            return

        if self.retrieve_offline():
            return

        self.send_error(404, "File not found")

    def do_POST(self):
        length = int(self.headers.getheader('content-length', 0))
        postdata = self.rfile.read(length)

        if self.path.startswith('/submit'):
            return self.capture_results(postdata)

        if self.remote_benchmark(postdata):
            return

        if self.retrieve_offline():
            return

        self.send_error(404, "File not found")

    def retrieve_offline(self):
        global cache

        path = self.translate_path(self.path)
        if os.path.isdir(path) and not self.path.endswith('/'):
            # redirect browser - doing basically what apache does
            self.send_response(301)
            self.send_header("Location", self.path + "/")
            self.end_headers()
            return True

        if path not in cache:
            self.send_error(404, "File '{}' not found".format(path))
            return True

        content, headers = cache[path]
        self.send_response(200)
        for name, value in headers.items():
            self.send_header(name, value)
        self.end_headers()
        self.wfile.write(bytes(content))
        return True

        # try to load index.html / index.htm
        if os.path.isdir(path):
            for index in "index.html", "index.htm":
                index = os.path.join(path, index)
                if os.path.exists(index):
                    path = index
                    break
            else:
                # list directory
                f = self.list_directory(path)
                return True

        return False

    def capture_results(self, query):
        global gqueue

        parsed_query = urlparse.parse_qs(query)
        json_results = json.loads(parsed_query["results"][0])

        gqueue.put(json_results)

        content = "Results successfully captured!"
        self.send_response(200)
        self.send_header("Content-Length", len(content))
        self.end_headers()
        self.wfile.write(bytes(content))
        return True

    def translate_benchmark_path(self, old_host, old_path):
        global translates
        protocol = None
        host = None
        path = None
        version = None

        for benchmark in benchmarks_remote.Known:
            if old_host.startswith(benchmark.name()+"."):
                protocol, host, path = benchmark.translate_path(old_path)
                version = benchmark.static_version()
                break

        if host:
            for url in translates:
                if host.startswith(url):
                    host = translates[url]
                    if host[-1] == "/":
                        host = host[:-1]

        return protocol, host, path, version

    def remote_benchmark(self, postdata=None):
        host = self.headers.get("Host", "")
        protocol, url, path, version = self.translate_benchmark_path(host, self.path)
        if not url and not path:
            return False

        if self.path != path:
            self.send_response(301)
            self.send_header('Location', 'http://' + host + path)
            self.end_headers()
            return True

        status, headers, data = self.retrieve(protocol, url, path, version, postdata)
        data = self.inject_data(host, path, data)

        if status == 301 or status == 302:
            for i in range(len(headers)):
                if headers[i][0] == "Location" or headers[i][0] == "location":
                    location = headers[i][1].split("/")
                    if len(location) == 3:
                        location = "/"
                    else:
                        location = "/".join(location[3:])
                    headers[i] = ("Location", "http://" + host + location)

        self.send_response(status)

        for name, header in headers:
            name = name.lower()
            if name in ["content-length", "accept-ranges", "connection", "transfer-encoding", "content-encoding"]:
                continue
            self.send_header(name, header)

        self.send_header("content-length", len(data))
        self.send_header("connection", "close")
        self.end_headers()
        self.wfile.write(bytes(data))
        return True

    def retrieve(self, protocol, host, path, version, postdata):
        hex_dig = hashlib.sha1(host + path).hexdigest()

        bench_dir_name = host + "-" + version
        cached_path = "cache/" + bench_dir_name + "/" + hex_dig

        if os.path.exists(cached_path):
            # Reuse the cached version.
            fp = open(cached_path, "rb")
            status, headers, data = pickle.load(fp)
            fp.close()
            return status, headers, data

        # Lookup the online version and cache it.
        status, headers, data = self.retrieve_online(protocol, host, path, postdata)

        if not os.path.exists("cache"):
            os.mkdir("cache")
        if not os.path.exists("cache/" + bench_dir_name):
            os.mkdir("cache/" + bench_dir_name)

        fp = open(cached_path, "wb")
        pickle.dump([status, headers, data], fp)
        fp.close()

        return status, headers, data

    def retrieve_online(self, protocol, host, path, postdata):
        headers = {
            "Cache-Control": self.headers.get("Cache-Control", ""),
            "Accept": self.headers.get("Accept", ""),
            "User-Agent": self.headers.get("User-Agent", ""),
            "Accept-Language": self.headers.get("Accept-Language", ""),
        }

        url = protocol + "://" + host + path

        if not postdata:
            response = requests.get(url=url, headers=headers, verify=False)
        else:
            headers["Content-Length"] = str(len(postdata))
            response = requests.post(url=url, data=postdata, headers=headers, verify=False)

        headers = [[key, response.headers[key]] for key in response.headers]
        data = response.content

        return response.status_code, headers, data

    def inject_data(self, host, path, data):
        for benchmark in benchmarks_remote.Known:
            if host.startswith(benchmark.name()+"."):
                return benchmark.inject_data(path, data)


def main(queue):
    global gqueue
    assert gqueue is None
    gqueue = queue

    HandlerClass = AWFYHandler
    ServerClass  = BaseHTTPServer.HTTPServer
    Protocol     = "HTTP/1.0"
    Port = 8000
    ServerAddress = ('', Port)

    #sys.stdout = STDOUT
    #sys.stderr = STDERR

    path = os.path.abspath(os.path.join(os.path.dirname(__file__),".."))
    with utils.chdir(path):
        HandlerClass.protocol_version = Protocol
        httpd = ServerClass(ServerAddress, HandlerClass)

        sa = httpd.socket.getsockname()
        print "Serving HTTP on", sa[0], "port", sa[1], "..."

        gqueue.put('ACK')
        httpd.serve_forever()

if __name__ == '__main__':
    class DummyQueue(object):
        def put(self, *args, **kwargs):
            pass

    dummy_queue = DummyQueue()
    main(dummy_queue)

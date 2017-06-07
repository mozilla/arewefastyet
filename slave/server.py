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

import benchmarks_remote as benchmarks

import utils
utils.config.init("awfy.config")
translates = utils.config.benchmarkTranslates()

seen_cachedirs = {}

class FakeHandler(SimpleHTTPRequestHandler):
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

    def do_GET(self):
        if self.remote_benchmark():
            return

        parsedParams = urlparse.urlparse(self.path)
        if self.local_benchmark(parsedParams.query):
            return

        self.send_error(404, "File not found")

    def do_POST(self):
        length = int(self.headers.getheader('content-length', 0))
        postdata = self.rfile.read(length)

        if self.remote_benchmark(postdata):
            return

        if self.local_benchmark(postdata):
            return

        self.send_error(404, "File not found")

    def local_benchmark(self, query = None):
        if self.path.startswith("/submit"):
            return self.capture_results(query)

        return self.retrieve_offline()

    def retrieve_offline(self):
        path = self.translate_path(self.path)
        if os.path.isdir(path) and not self.path.endswith('/'):
            # redirect browser - doing basically what apache does
            self.send_response(301)
            self.send_header("Location", self.path + "/")
            self.end_headers()
            return True

        f = None

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

        # load file
        ctype = self.guess_type(path)
        try:
            # Always read in binary mode. Opening files in text mode may cause
            # newline translations, making the actual size of the content
            # transmitted *less* than the content-length!
            f = open(path, 'rb')
        except IOError:
            self.send_error(404, "File not found")
            return True

        content = f.read()
        content = self.inject_data("localhost", self.path, content)

        self.send_response(200)
        self.send_header("Content-type", ctype)
        self.send_header("Content-Length", len(content))
        fs = os.fstat(f.fileno())
        self.send_header("Last-Modified", self.date_time_string(fs.st_mtime))
        self.end_headers()

        self.wfile.write(bytes(content))
        f.close()
        return True

    def capture_results(self, query):
        parsed_query = urlparse.parse_qs(query)
        fp = open("slave/results", "w")
        fp.write(parsed_query["results"][0])
        fp.close()

        content = "Results successfully captured!"
        self.send_response(200)
        self.send_header("Content-Length", len(content))
        self.end_headers()
        self.wfile.write(bytes(content))
        return True

    def translate_benchmark_path(self, old_host, old_path):
        global translates, benchmarks
        protocol = None
        host = None
        path = None
        version = None

        for benchmark in benchmarks.Known:
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

        # One-off migration: if there's a cache dir with the previous name
        # format, assume it's the latest version and rename it.
        if seen_cachedirs.get(bench_dir_name, None) is None:
            if os.path.exists("cache/" + host + "/"):
                os.rename("cache/" + host, "cache/" + bench_dir_name)
            seen_cachedirs[bench_dir_name] = True

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
        global benchmarks
        for benchmark in benchmarks.Known:
            if host.startswith(benchmark.name()+"."):
                return benchmark.inject_data(path, data)

        if host == "localhost":
            if path == "/benchmarks/misc-desktop/hosted/assorted/driver.html":
                return data.replace('location = "results.html?" + encodeURI(outputString);',
                                    'location.href = "http://localhost:8000/submit?results=" + encodeURI(outputString);');
            if path == "/benchmarks/webaudio/webaudio-bench.js":
                return data.replace('xhr.open("POST", "/results", true);',
                                    'xhr.open("POST", "/submit", true);');
            if path == "/benchmarks/unity-webgl/Data/mozbench.js":
                return data.replace('xmlHttp.open("POST", "/results", true);',
                                    'xmlHttp.open("POST", "/submit", true);');
        return data

HandlerClass = FakeHandler
ServerClass  = BaseHTTPServer.HTTPServer
Protocol     = "HTTP/1.0"
Port = 8000
ServerAddress = ('', Port)

path = os.path.abspath(os.path.join(os.path.dirname(__file__),".."))
with utils.chdir(path):
    HandlerClass.protocol_version = Protocol
    httpd = ServerClass(ServerAddress, HandlerClass)

    sa = httpd.socket.getsockname()
    print "Serving HTTP on", sa[0], "port", sa[1], "..."

    httpd.serve_forever()

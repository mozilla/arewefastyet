import BaseHTTPServer
import hashlib
import httplib
import json
import os
import pickle
import signal
import sys
import urllib
import urlparse
import benchmarks_remote as benchmarks

from SimpleHTTPServer import SimpleHTTPRequestHandler
from SocketServer     import ThreadingMixIn

import utils
utils.config.init("awfy.config")
translates = utils.config.benchmarkTranslates()

class FakeHandler(SimpleHTTPRequestHandler):

    def handle_one_request(self):
        """ This sometimes times out. Don't block """
        with utils.Handler(signal.SIGALRM, utils.timeout_handler):
            try:
                signal.alarm(20)
                SimpleHTTPRequestHandler.handle_one_request(self)
            except utils.TimeException:
                print "timeout"
            finally:
                signal.alarm(0)

    def do_GET(self):
        if self.remoteBenchmark():
            return

        parsedParams = urlparse.urlparse(self.path)
        if self.localBenchmark(parsedParams.query):
            return

        self.send_error(404, "File not found")

    def do_POST(self):
        length = int(self.headers.getheader('content-length', 0))
        postdata = self.rfile.read(length)

        if self.remoteBenchmark(postdata):
            return

        if self.localBenchmark(postdata):
            return

        self.send_error(404, "File not found")

    def localBenchmark(self, query = None):
        if self.path.startswith("/submit"):
            return self.captureResults(query)
        else:
            return self.retrieveOffline();

    def retrieveOffline(self):
        path = self.translate_path(self.path)
        if os.path.isdir(path) and not self.path.endswith('/'):
            # redirect browser - doing basically what apache does
            self.send_response(301)
            self.send_header("Location", self.path + "/")
            self.end_headers()
            return True
        else:
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
            content = self.injectData("localhost", self.path, content)

            self.send_response(200)
            self.send_header("Content-type", ctype)
            fs = os.fstat(f.fileno())
            self.send_header("Content-Length", len(content))
            self.send_header("Last-Modified", self.date_time_string(fs.st_mtime))
            self.end_headers()

            self.wfile.write(bytes(content))
            f.close()
            return True

    def captureResults(self, query):
        queryParsed = urlparse.parse_qs(query)
        fp = open("slave/results", "w");
        fp.write(queryParsed["results"][0]);
        fp.close()
        return False

    def translatePath(self, host, path):
        global translates, benchmarks
	protocol = None
	host = None
	path = None

        for benchmark in benchmarks.KnownBenchmarks:
            if host.startswith(benchmark.name()+"."):
                protocol, host, path = benchmark.translatePath(path)
                break

	if host:
            for url in translates:
                if host.startswith(url):
                    host = translates[url]
                    if host[-1] == "/":
                        host = new_host[:-1]

        return protocol, host, path

    def remoteBenchmark(self, postdata=None):
        host = self.headers.get("Host", "")
        protocol, url, path = self.translatePath(host, self.path)
        if not url and not path:
            return False

        if self.path != path:
            self.send_response(301)
            self.send_header('Location', 'http://' + host + path)
            self.end_headers()
            return True

        status, headers, data = self.retrieve(protocol, url, path, postdata)
        data = self.injectData(host, path, data)

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
            if name == "content-length" or name == "accept-ranges" or name == "connection" or name == "transfer-encoding" or name == "content-encoding":
                pass
            else:
                self.send_header(name, header)
        self.send_header("content-length", len(data))
        self.send_header("connection", "close")
        self.end_headers()
        self.wfile.write(bytes(data))
        return True

    def retrieve(self, protocol, host, path, postdata):
        hash_object = hashlib.sha1(host+path)
        hex_dig = hash_object.hexdigest()
        if os.path.exists("cache/"+host+"/"+hex_dig):
            fp = open("cache/"+host+"/"+hex_dig, "rb")
            status, headers, data = pickle.load(fp)
            fp.close()
        else:
            status, headers, data = self.retrieveOnline(protocol, host, path, postdata)

            if not os.path.exists("cache"):
                os.mkdir("cache")
            if not os.path.exists("cache/"+host):
                os.mkdir("cache/"+host)
            fp = open("cache/"+host+"/"+hex_dig, "wb")
            pickle.dump([status, headers, data], fp)
            fp.close()

        return status, headers, data

    def retrieveOnline(self, protocol, host, path, postdata):
        import requests
        if not postdata:
            response = requests.get(url=protocol+"://"+host+path,
                         headers = {
                             "Cache-Control": self.headers.get("Cache-Control", ""),
                             "Accept": self.headers.get("Accept", ""),
                             "User-Agent": self.headers.get("User-Agent", ""),
                             "Accept-Language": self.headers.get("Accept-Language", ""),
                         },
                         verify=False
            )
        else:
            response = requests.post(url=protocol+"://"+host+path,
                          data=postdata,
                          headers = {
                              "Cache-Control": self.headers.get("Cache-Control", ""),
                              "Accept": self.headers.get("Accept", ""),
                              "User-Agent": self.headers.get("User-Agent", ""),
                              "Content-Length": len(postdata),
                              "Accept-Language": self.headers.get("Accept-Language", ""),
                          },
                          verify=False
            )
        headers = [[key, response.headers[key]] for key in response.headers]

        data = response.content
        return response.status_code, headers, data

    def injectData(self, host, path, data):
        global benchmarks
        for benchmark in benchmarks.KnownBenchmarks:
            if host.startswith(benchmark.name()+"."):
                return benchmark.injectData(path, data)
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

class ThreadedHTTPServer(ThreadingMixIn, BaseHTTPServer.HTTPServer):
    pass

HandlerClass = FakeHandler
ServerClass  = ThreadedHTTPServer
ServerClass  = BaseHTTPServer.HTTPServer
Protocol     = "HTTP/1.0"
Port = 8000
ServerAddress = ('', Port)

path = os.path.abspath(os.path.join(os.path.dirname(__file__),".."))
with utils.FolderChanger(path):
    HandlerClass.protocol_version = Protocol
    httpd = ServerClass(ServerAddress, HandlerClass)

    sa = httpd.socket.getsockname()
    print "Serving HTTP on", sa[0], "port", sa[1], "..."

    httpd.serve_forever()

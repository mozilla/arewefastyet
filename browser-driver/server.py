import sys
import BaseHTTPServer
from SimpleHTTPServer import SimpleHTTPRequestHandler
import urlparse
import os
import json
import urllib
import httplib
from SocketServer     import ThreadingMixIn
import hashlib
import pickle

# we allow to view the top directory
os.chdir("../")

class FakeHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        host = self.headers.get("Host", "")
        if host == "localhost:8000":
            if self.path.startswith("/submit"):
                print "capture"
                return self.captureResults()
            elif self.path.startswith("/sunspider.js"):
                return self.returnSunspiderJS()
            return SimpleHTTPRequestHandler.do_GET(self)
        else:
            return self.forwardUrl()

    def do_POST(self):
        host = self.headers.get("Host", "")
        if host == "localhost:8000":
            if self.path.startswith("/submit"):
                content_len = int(self.headers.getheader('content-length', 0))
                post_body = self.rfile.read(content_len).split("=", 1)[1]
                fp = open("browser-driver/results", "w");
                fp.write(post_body);
                fp.close()

    def captureResults(self):
        parsedParams = urlparse.urlparse(self.path)
        queryParsed = urlparse.parse_qs(parsedParams.query)
        fp = open("browser-driver/results", "w");
        fp.write(queryParsed["results"][0]);
        fp.close()

    def returnSunspiderJS(self):
        parsedParams = urlparse.urlparse(self.path)
        queryParsed = urlparse.parse_qs(parsedParams.query)
        tests = queryParsed["tests"][0]

        fp = open(tests+"/LIST", "r");
        test_list = fp.read()
        test_list = test_list.replace("\r\n", "\n").replace("\r", "\n")
        test_list = test_list.split("\n")
        if test_list[-1].strip() == "":
            test_list = test_list[:-1]
        fp.close()
        
        output = "var tests = " + json.dumps(test_list)+";\n"

        test_content = []
        for t in test_list:
            content = ""

            if os.path.exists(tests+"/"+t+"-data.js"):
                fp = open(tests+"/"+t+"-data.js", "r");
                content += fp.read()
                fp.close()

            fp = open(tests+"/"+t+".js", "r");
            content += fp.read()
            fp.close()

            test_content.append(content)

        output += "var testContents = " + json.dumps(test_content)+";\n"

        self.send_response(200)
        self.send_header("Content-type", "application/javascript")
        self.end_headers()
        self.wfile.write(bytes(output))
        return

    def translatePath(self, host, path):
        if host.startswith("massive."):
            if path == "" or path == "/":
                path = "/Massive/?autoRun=true,postToURL=http://localhost:8000/submit"
            return "kripken.github.io", path
        elif host.startswith("octane."):
            if path == "" or path == "/":
                path = "/svn/latest/index.html"
            return "octane-benchmark.googlecode.com", path
        elif host.startswith("jetstream."):
            if path == "" or path == "/":
                path = "/JetStream/"
            return "browserbench.org", path
        elif host.startswith("speedometer."):
            if path == "" or path == "/":
                path = "/Speedometer/"
            return "browserbench.org", path

    def forwardUrl(self):
        host = self.headers.get("Host", "")
        url, path = self.translatePath(host, self.path)
        if self.path != path:
            self.send_response(301)
            self.send_header('Location', 'http://' + host + path)
            self.end_headers() 
            return

        status, headers, data = self.retrieve(url, path)
        data = self.injectData(host, path, data)

        if status == 301:
            for i in range(len(headers)):
                if headers[i][0] == "Location" or headers[i][0] == "location":
                    location = headers[i][1].split("/", 4)
                    headers[i] = ("Location", "http://" + host + location[4])
        self.send_response(status)
        for name, header in headers:
            if name == "content-length" or name == "accept-ranges" or name == "connection" or name == "transfer-encoding":
                pass
            else:
                self.send_header(name, header)
        self.send_header("content-length", len(data))
        self.send_header("connection", "close")
        self.end_headers()
        self.wfile.write(bytes(data))

    def retrieve(self, host, path):
        hash_object = hashlib.sha1(host+path)
        hex_dig = hash_object.hexdigest()
        if os.path.exists("cache/"+hex_dig):
            fp = open("cache/"+hex_dig, "rb")
            status, headers, data = pickle.load(fp)
            fp.close()
        else:
            status, headers, data = self.retrieveOnline(host, path)

            if not os.path.exists("cache"):
                os.mkdir("cache")
            fp = open("cache/"+hex_dig, "wb")
            pickle.dump([status, headers, data], fp)
            fp.close()

        return status, headers, data

    def retrieveOnline(self, host, path):
        conn = httplib.HTTPConnection(host)
        conn.request("GET", path, headers = {
            "Cache-Control": self.headers.get("Cache-Control", ""),
            "Accept": self.headers.get("Accept", ""),
            "User-Agent": self.headers.get("User-Agent", ""),
            # TODO: accept encoding
            #"Accept-Encoding": self.headers.get("Accept-Encoding", ""),
            "Accept-Language": self.headers.get("Accept-Language", ""),
            #"If-Modified-Since": self.headers.get("If-Modified-Since", "")
        })
        response = conn.getresponse()
        headers = response.getheaders()

        data = response.read()
        conn.close()

        return response.status, headers, data

    def injectData(self, host, path, data):
        if host.startswith("octane."):
            if path == "/svn/latest/index.html":
                return data.replace("</body>",
                                    "<script>"
                                    "   window.setTimeout(Run, 10000);"
                                    "   var oldAddResult = AddResult;"
                                    "   var results = {};"
                                    "   AddScore = function(score) {"
                                    "      results['total'] = score;"
                                    "      location.href = 'http://localhost:8000/submit?results=' + "
                                    "                          encodeURIComponent(JSON.stringify(results))"
                                    "   };" 
                                    "   AddResult = function(name, result) {"
                                    "      results[name] = result;"
                                    "      oldAddResult(name, result);"
                                    "   };" 
                                    "</script>"
                                    "</body>");
        if host.startswith("jetstream."):
            if path == "/JetStream/":
                return data.replace("</body>",
                                    "<script>"
                                    "   window.setTimeout(JetStream.start, 10000);"
                                    "</script>"
                                    "</body>");
            if path == "/JetStream/JetStreamDriver.js":
                return data.replace("function end()",
                                    "function end()"
                                    "{"
                                    "      location.href = 'http://localhost:8000/submit?results=' + "
                                    "                          encodeURIComponent(JSON.stringify(computeRawResults()))"
                                    "} " 
                                    "function foo()");
        if host.startswith("speedometer."):
            if path == "/Speedometer/":
                return data.replace("</body>",
                                    "<script>"
                                    "   window.setTimeout(function() {startTest()}, 10000);"
                                    "   var prev = window.BenchmarkClient.didFinishLastIteration;"
                                    "   window.BenchmarkClient.didFinishLastIteration = function() {"
                                    ""
                                    ""
                                    "   }"
                                    "</script>"
                                    "</body>");
        return data
        

class ThreadedHTTPServer(ThreadingMixIn, BaseHTTPServer.HTTPServer):
    pass

HandlerClass = FakeHandler
ServerClass  = ThreadedHTTPServer
ServerClass  = BaseHTTPServer.HTTPServer
Protocol     = "HTTP/1.0"
Port = 8000
ServerAddress = ('', Port)

HandlerClass.protocol_version = Protocol
httpd = ServerClass(ServerAddress, HandlerClass)

sa = httpd.socket.getsockname()
print "Serving HTTP on", sa[0], "port", sa[1], "..."

httpd.serve_forever()

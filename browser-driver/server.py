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
        if self.remoteBenchmark():
            return

        parsedParams = urlparse.urlparse(self.path)
        self.localBenchmark(parsedParams.query)

    def do_POST(self):
        length = int(self.headers.getheader('content-length', 0))
        postdata = self.rfile.read(length)

        if self.remoteBenchmark(postdata):
            return

        self.localBenchmark(postdata)

    def localBenchmark(self, query = None):
        if self.path.startswith("/submit"):
            return self.captureResults(query)
        elif self.path.startswith("/sunspider.js"):
            return self.returnSunspiderJS(query)
        else:
            return self.retrieveOffline();

    def retrieveOffline(self):
        f = SimpleHTTPRequestHandler.send_head(self)
        if f:
            content = f.read()
            content = self.injectData("localhost", self.path, content)
            self.wfile.write(bytes(content))
            f.close()

    def captureResults(self, query):
        queryParsed = urlparse.parse_qs(query)
        fp = open("browser-driver/results", "w");
        fp.write(queryParsed["results"][0]);
        fp.close()

    def returnSunspiderJS(self, query):
        queryParsed = urlparse.parse_qs(query)
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
        elif host.startswith("kraken."):
            if path == "" or path == "/":
                path = "/kraken-1.1/driver.html"
            return "krakenbenchmark.mozilla.org", path
        elif host.startswith("sunspider."):
            if path == "" or path == "/":
                path = "/perf/sunspider-1.0.2/sunspider-1.0.2/driver.html"
            return "www.webkit.org", path
        elif host.startswith("browsermark."):
            return "browsermark.local", path
        elif host.startswith("dromaeo."):
            return "dromaeo.com", path
        return None, None

    def remoteBenchmark(self, postdata=None):
        host = self.headers.get("Host", "")
        url, path = self.translatePath(host, self.path)
        if not url and not path:
            return False

        if self.path != path:
            self.send_response(301)
            self.send_header('Location', 'http://' + host + path)
            self.end_headers()
            return True

        status, headers, data = self.retrieve(url, path, postdata)
        data = self.injectData(host, path, data)

        if status == 301 or status == 302:
            for i in range(len(headers)):
                if headers[i][0] == "Location" or headers[i][0] == "location":
                    location = headers[i][1].split("/", 4)
                    if len(location) == 3:
                        location = "/"
                    else:
                        location = location[4]
                    print location
                    headers[i] = ("Location", "http://" + host + location)
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
        return True

    def retrieve(self, host, path, postdata):
        hash_object = hashlib.sha1(host+path)
        hex_dig = hash_object.hexdigest()
        if os.path.exists("cache/"+host+"/"+hex_dig):
            fp = open("cache/"+host+"/"+hex_dig, "rb")
            status, headers, data = pickle.load(fp)
            fp.close()
        else:
            status, headers, data = self.retrieveOnline(host, path, postdata)

            if not os.path.exists("cache"):
                os.mkdir("cache")
            if not os.path.exists("cache/"+host):
                os.mkdir("cache/"+host)
            fp = open("cache/"+host+"/"+hex_dig, "wb")
            pickle.dump([status, headers, data], fp)
            fp.close()

        return status, headers, data

    def retrieveOnline(self, host, path, postdata):
        conn = httplib.HTTPConnection(host)
        if not postdata:
            conn.request("GET", path, headers = {
                "Cache-Control": self.headers.get("Cache-Control", ""),
                "Accept": self.headers.get("Accept", ""),
                "User-Agent": self.headers.get("User-Agent", ""),
                "Accept-Language": self.headers.get("Accept-Language", ""),
            })
        else:
            conn.request("POST", path, postdata, headers = {
                "Cache-Control": self.headers.get("Cache-Control", ""),
                "Accept": self.headers.get("Accept", ""),
                "User-Agent": self.headers.get("User-Agent", ""),
                "Content-Length": len(postdata),
                "Accept-Language": self.headers.get("Accept-Language", ""),
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
                                    """
                                    <script defer>
                                       window.setTimeout(function() {
                                           startTest()
                                           benchmarkClient._updateGaugeNeedle = function (rpm) {
                                              location.href = 'http://localhost:8000/submit?results=' +
                                                                  encodeURIComponent(JSON.stringify([{'name': '__total__', 'time': rpm}]));
                                           };
                                       }, 10000);
                                    </script>
                                    </body>""");
        if host.startswith("kraken."):
            if path == "/kraken-1.1/driver.html":
                return data.replace('location = "results.html?" + encodeURI(outputString);',
                                    'location.href = "http://localhost:8000/submit?results=" + encodeURI(outputString);');
        if host.startswith("sunspider."):
            if path == "/perf/sunspider-1.0.2/sunspider-1.0.2/driver.html":
                return data.replace('location = "results.html?" + encodeURI(outputString);',
                                    'location.href = "http://localhost:8000/submit?results=" + encodeURI(outputString);');
        if host == "localhost":
            if path == "/benchmarks/misc-desktop/hosted/assorted/driver.html":
                return data.replace('location = "results.html?" + encodeURI(outputString);',
                                    'location.href = "http://localhost:8000/submit?results=" + encodeURI(outputString);');
        if host.startswith("dromaeo."):
            if path == "/webrunner.js":
                data = data.replace('function init(){',
                                    """
                                    function init(){
                                        setTimeout(function () {
                                            interval = true;
                                            dequeue();
                                        }, 10000);
                                    """)
                return data.replace('} else if ( queue.length == 0 ) {',
                                     """
                                     } else if ( queue.length == 0 ) {;
                                        var results = {};
                                        for (var i=0; i<dataStore.length; i++) {
                                            results[dataStore[i].curID] = dataStore[i].mean
                                        }
                                        var summary = (runStyle === "runs/s" ? Math.pow(Math.E, maxTotal / maxTotalNum) : maxTotal).toFixed(2);
                                        results["total"] = summary;
                                        location.href = "http://localhost:8000/submit?results="+encodeURIComponent(JSON.stringify(results))
                                     """)
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

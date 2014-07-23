import sys
import BaseHTTPServer
from SimpleHTTPServer import SimpleHTTPRequestHandler
import urlparse
import os
import json

# we allow to view the top directory
os.chdir("../")

DUMMY_RESPONSE = "NOTHING TO REPORT"

class FakeHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path[:7] == "/submit":
            parsedParams = urlparse.urlparse(self.path)
            queryParsed = urlparse.parse_qs(parsedParams.query)
            fp = open("android-driver/results", "w");
            fp.write(queryParsed["results"][0]);
            fp.close()
        elif self.path[:13] == "/sunspider.js":
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

        return SimpleHTTPRequestHandler.do_GET(self)

HandlerClass = FakeHandler
ServerClass  = BaseHTTPServer.HTTPServer
Protocol     = "HTTP/1.0"
Port = 8000
ServerAddress = ('', Port)

HandlerClass.protocol_version = Protocol
httpd = ServerClass(ServerAddress, HandlerClass)

sa = httpd.socket.getsockname()
print "Serving HTTP on", sa[0], "port", sa[1], "..."

httpd.serve_forever()


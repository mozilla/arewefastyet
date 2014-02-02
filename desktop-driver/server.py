import sys
import BaseHTTPServer
from SimpleHTTPServer import SimpleHTTPRequestHandler
import urlparse
import os

# we allow to view the top directory
os.chdir("../")

DUMMY_RESPONSE = "NOTHING TO REPORT"

class FakeHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path[:7] == "/submit":
            parsedParams = urlparse.urlparse(self.path)
            queryParsed = urlparse.parse_qs(parsedParams.query)
            fp = open("desktop-driver/results", "w");
            fp.write(queryParsed["results"][0]);
            fp.close()

        return SimpleHTTPRequestHandler.do_GET(self)

HandlerClass = FakeHandler
ServerClass  = BaseHTTPServer.HTTPServer
Protocol     = "HTTP/1.0"
Port = 8000
ServerAddress = ('127.0.0.1', Port)

HandlerClass.protocol_version = Protocol
httpd = ServerClass(ServerAddress, HandlerClass)

sa = httpd.socket.getsockname()
print "Serving HTTP on", sa[0], "port", sa[1], "..."

httpd.serve_forever()


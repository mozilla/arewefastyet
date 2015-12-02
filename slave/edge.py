import json
import urllib2
import urllib
import re
import os
import shutil
import socket
import utils
import platform

import tarfile
import zipfile
socket.setdefaulttimeout(120)

if __name__ == "__main__":
    from optparse import OptionParser
    parser = OptionParser(usage="usage: %prog [options]")
    parser.add_option("-o", "--output", dest="output",
                      help="download to DIR, default=output/", metavar="DIR", default='output')
    (options, args) = parser.parse_args()

    if not options.output.endswith("/"):
        options.output += "/"

    info = {}
    info["revision"] = "20.10240.16384" 
    info["engine_type"] = "edge"
    info["shell"] = False
    info["binary"] = "" 

    if os.path.isdir(options.output):
        shutil.rmtree(options.output)
    os.makedirs(options.output)

    fp = open(options.output + "info.json", "w")
    json.dump(info, fp)
    fp.close()


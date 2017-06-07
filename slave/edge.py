#!/usr/bin/env python2

import json
import os
import shutil
import socket

from optparse import OptionParser

socket.setdefaulttimeout(120)

import utils

if __name__ == "__main__":
    utils.log_banner('EDGE')

    parser = OptionParser(usage="usage: %prog [options]")
    parser.add_option("-o", "--output", dest="output",
                      help="download to DIR, default=output/", metavar="DIR", default='output')
    (options, args) = parser.parse_args()

    if not options.output.endswith("/"):
        options.output += "/"

    info = {}
    info["revision"] = "25.10586.0.0"
    info["engine_type"] = "edge"
    info["shell"] = False
    info["binary"] = ""

    if os.path.isdir(options.output):
        shutil.rmtree(options.output)
    os.makedirs(options.output)

    fp = open(options.output + "info.json", "w")
    json.dump(info, fp)
    fp.close()

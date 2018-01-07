import json
import sys
import urllib
import urllib2

from optparse import OptionParser

import utils

if __name__ == "__main__":
    logger = utils.create_logger(maxBytes=sys.maxint,
                                 backupCount=3,
                                 rollover=True)

    parser = OptionParser(usage="usage: %prog [options]")

    parser.add_option("-r", "--run", dest="machine", type="int", help="Get and run the task of a given (control) machine.")
    (options, args) = parser.parse_args()

    # Update AWFY to the latest version first.
    utils.run_realtime(['git', 'pull'])

    # Query the next tasks.
    url = "https://www.arewefastyet.com/task.php?unit="+str(options.machine)
    data = urllib2.urlopen(url).read()
    data = json.loads(data)

    # Run the tasks.
    task = data["task"].replace("\r\n", "\n").replace("\r", "\n")
    output = utils.run_realtime(task, shell=True)

    # Report the result.
    url = "https://www.arewefastyet.com/task.php?finish="+str(data["id"])
    req = urllib2.Request(url=url, data=urllib.urlencode({"output": output}));
    urllib2.urlopen(req)

import os
import urllib2
from optparse import OptionParser
import json

if __name__ == "__main__":
    from optparse import OptionParser
    parser = OptionParser(usage="usage: %prog [options]")

    parser.add_option("-r", "--run", dest="machine", type="int", help="Get and run the task of a given (control) machine.")
    (options, args) = parser.parse_args()

    url = "http://www.arewefastyet.com/task.php?unit="+str(options.machine)
    data = urllib2.urlopen(url).read()
    data = json.loads(data)

    task = data["task"].replace("\r\n", "\n").replace("\r", "\n")
    os.system(task)

    url = "http://www.arewefastyet.com/task.php?finish="+str(data["id"])
    urllib2.urlopen(url)

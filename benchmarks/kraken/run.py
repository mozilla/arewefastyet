import subprocess
import json
import argparse

argparser = argparse.ArgumentParser(description='Run the tests!')
argparser.add_argument('shell', help='a js shell environment')
argparser.add_argument('suite', help='suite')
argparser.add_argument('--args', default='', help='arguments')
argparser.add_argument('--count', default='10', help='count')

args = argparser.parse_args()

with open("tests/"+args.suite+"/LIST") as f:
    tests = f.readlines()

results = {}	
for i in range(len(tests)):
	tests[i] = tests[i].replace("\r\n",'').replace("\r",'').replace("\n",'')
	results[tests[i]] = 0

for i in range(int(args.count)):
	output = subprocess.check_output(args.shell+" "+args.args+" -e "+json.dumps("var tests = "+json.dumps(tests)+"; var suitePath = 'tests/"+args.suite+"'; var suiteName = '"+args.suite+"'")+" -f resources/sunspider-standalone-driver.js", shell=True)
	input = json.loads(output)
	for i in input:
		results[i] += input[i]

for i in results:
	print i+": "+str(results[i]*1.0/int(args.count))
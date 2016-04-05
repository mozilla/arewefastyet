#!/usr/bin/env python

# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

from submission import Submission
import json
import os
import sys

pwd = os.path.dirname(os.path.realpath(__file__))
sys.path.append(pwd + "/../server") 
import awfy
import tables

def first(gen):
    li = list(gen)
    if len(li) == 0:
       return None
    return li[0]

class Submitter(object):
    def __init__(self):
        pass

    """
    Submit the given data
    """
    def submit(self, revision, data, mode_info, log = []):
        repo = mode_info["repo"]
        settings = {
            "treeherder": {
                'group_symbol': 'AWFY',
                'group_name': 'AWFY',
                'job_name': mode_info["job_name"],
                'job_symbol': mode_info["job_symbol"],
                "tier": mode_info["tier"],
                "platform": mode_info["platform"]
            }
        }

        logfile = create_log_item({
            "repo": repo,
            "revision": revision,
            "settings": settings,
            "perf_data": data,
            "extra_log_info": log
        })
        loglink = "https://arewefastyet.com/data.php?file=treeherder-logs/"+logfile

        retriggerlink = None
        if "mode_id" in log and "machine_id" in log:
            retriggerlink = "https://arewefastyet.com/retrigger/?machine_id="+str(log["machine_id"])+"&mode_id="+str(log["mode_id"])+"&revision="+revision

        th = Submission(repo, revision,
                        treeherder_url = awfy.th_host,
                        treeherder_client_id = awfy.th_user, 
                        treeherder_secret = awfy.th_secret,
                        settings = settings)

        job = th.create_job(None)
        th.submit_completed_job(job, data, loglink = loglink, retriggerlink = retriggerlink)

    """
    Takes all scores/subscores from a build and submit the data to treeherder.
    """
    def submitBuild(self, build):
        revision = build.get("cset")
        machine_id = build.get("run").get("machine_id")
        mode_symbol = build.get("mode").get("mode")
        perfdata = []

        mode_info = config.mode_info(machine_id, mode_symbol)
        if not mode_info:
            print "Couldn't submit", revision, "with mode", mode_symbol
            print "No data found in the config file about how to submit it" 
            return

        scores = build.getScores()
        for score in scores:
            if not score.get("suite_version") or not score.get("suite_version").exists():
                continue
            suite_version = score.get("suite_version")
            if not suite_version.get("suite"):
                continue
            if suite_version.get("suite").get("visible") != 1:
                continue
            perfdata.append({
                "name": suite_version.get("name"),
                "lowerIsBetter": suite_version.get("suite").get("better_direction") == -1,
                "subscores": {}
            })
            if suite_version.get("suite").get("totalmeaningless") == 0:
                perfdata[-1]["score"] = score.get("score")
            for breakdown in score.getBreakdowns():
                if not breakdown.get("suite_test") or not breakdown.get("suite_test").exists():
                    continue
                suite_test = breakdown.get("suite_test")
                perfdata[-1]["subscores"][suite_test.get("name")] = breakdown.get("score")

        data = self.transform(perfdata)

        self.submit(revision, data, mode_info, log = {
            "run_id": build.get("run_id"),
            "machine_id": machine_id,
            "mode_symbol": mode_symbol,
            "mode_id": build.get("mode_id")
        })

      
    """
    Takes all builds from a run and submit the enabled ones to treeherder.
    """
    def submitRun(self, run):
        # Annonate run that it was forwared to treeherder.
        if awfy.th_host != "mock":
            run.update({"treeherder": 1})
            awfy.db.commit()

        # Treeherder can't handle inter-push commits
        if run.get("out_of_order") == 1:
            print "Couldn't submit run", run.id
            print "Out of order is currently not supported"
            return

        # Send the data.
        modes = config.modes(run.get("machine_id"))
        for mode in modes:
            mode_db = first(tables.Mode.where({"mode": mode}))
            if not mode_db:
                print "Didn't find db mode entry for", mode
                continue
            build = tables.Build.fromRunAndMode(run.id, mode_db.id)
            if not build:
                continue
            self.submitBuild(build)

    """
    transforms the intermediate representation of benchmark results pulled from the DB
    into the canonical format needed by treeherder/perfherder
    """
    def transform(self, tests):
        data = {
            "framework": {
                "name": "awfy"
            },
            "suites": []
        }
        for test in tests:
            testdata = {
                "name": test["name"],
                "subtests": [],
                "lowerIsBetter": bool(test["lowerIsBetter"])
            }
            if "score" in test:
                testdata["value"] = float(test["score"])
            if "subscores" not in test:
                test["subscores"] = []
            for subtest in test["subscores"]:
                subtestdata = {
                    "lowerIsBetter": bool(test["lowerIsBetter"]),
                    "name": subtest,
                    "value": float(test["subscores"][subtest])
                }
                testdata["subtests"].append(subtestdata)
            data["suites"].append(testdata)
        return data 

def create_log_item(data):
    import uuid
    filename = str(uuid.uuid4().hex) + ".json"
    location = os.path.join(awfy.path, "treeherder-logs", filename)
    if os.path.exists(location):
        return create_log_item(data) 

    f = open(location, 'w')
    json.dump(data, f);
    f.close()

    print json.dumps(data)
    return filename

class Config(object):
  def __init__(self, filename):
    fp = open(filename)
    self.data = json.load(fp)
    fp.close()

  def modes(self, machine_id):
    for machine_data in self.data:
        if str(machine_data["machine"]) != str(machine_id):
            continue
        return [mode["mode"] for mode in machine_data["modes"] if mode["enabled"]]
    return []
  def mode_info(self, machine_id, mode_symbol):
    for machine_data in self.data:
        if str(machine_data["machine"]) != str(machine_id):
            continue
        for mode in machine_data["modes"]:
            if mode["mode"] != mode_symbol:
                continue
            return mode 
    return None
  def validate(self, schema):
    from jsonschema import validate
    fp = open(schema)
    schema = json.load(fp)
    fp.close()
    validate(self.data, schema)

if __name__ == '__main__':
    config = Config(pwd+"/config.json")
    config.validate(pwd+"/config.schema")
    
    print "running update.py"
    submitter = Submitter()
    for run in tables.Run.where({"status": 1, "treeherder": 0}):
      submitter.submitRun(run)


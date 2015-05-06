# vim: set ts=4 sw=4 tw=99 et:
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

import awfy
import sys
import time
import tables
import tables_old
import regression_detector
import regression_detector_old 
from collections import defaultdict

import os
import time
import datetime
os.environ['TZ'] = "Europe/Amsterdam"
time.tzset()

def testRuns():
  c = awfy.db.cursor()
  newer = int(time.time() - 60 * 60 * 24 * 30)
  older = int(time.time() - 60 * 60 * 24 * 1)
  c.execute("SELECT id                                                          \
             FROM awfy_run                                                      \
             WHERE stamp > "+str(newer)+" AND                                   \
                   stamp < "+str(older)+" AND                                   \
                   status = 1 AND                                               \
                   detector = 1 AND                                             \
                   machine in (28, 29)")
  runs = []
  for row in c.fetchall():
    runs.append(tables.Run(row[0]))
  return runs


changes = defaultdict(int)
for run in testRuns():
    scores = run.getScoresAndBreakdowns()
    for score in scores:
        if score.get("build").get("mode").get("name") != "Ion":
            continue

        if score.__class__ == tables.Score:
            regression = tables.RegressionScore(score.get("build"), score)
            score_old = tables_old.Score(score.id)
        elif score.__class__ == tables.Breakdown:
            regression = tables.RegressionBreakdown(score.get("build"), score)
            score_old = tables_old.Breakdown(score.id)

        status_db = "noregression"
        if regression.id != 0:
            if regression.get("noise") == 1:
                status_db = "marked noregression"
            elif regression.regression().get('status') == "noise":
                status_db = "marked noregression"
            elif regression.regression().get('status') == "unconfirmed":
                status_db = "unconfirmed"
            else:
                status_db = "regressed"
        
        status_old = "noregression"
        regressed_ = regression_detector_old.regressed(score_old)
        if regressed_ is None:
            status_old = "nodata"
        elif regressed_:
            status_old = "regressed"
    
        status_now = "noregression"
        regressed_ = regression_detector.regressed(score)
        if regressed_ is None:
            status_now = "nodata"
        elif regressed_:
            status_now = "regressed"

        key = status_db+"-"+status_now
        changes["db_"+status_db] += 1
        changes["now_"+status_now] += 1
        changes["old_"+status_old] += 1
        changes[key] += 1  
        
        if key == "regressed-noregression" or key == "noregression-regressed" or status_now == "regressed":
            print datetime.datetime.fromtimestamp(
                int(score.get("build").get("run").get("stamp"))
            ).strftime('%Y-%m-%d %H:%M:%S'),
            if regression.id == 0:
                print 0,
            else:
                print regression.regression().id, 
            print score.get("build").get("run").get("machine_id"),
            print score.get("build").get("mode").get("name"),
            print score.change(),
            print score.noise(),
            print score.avg_change(),
            if score.__class__ == tables.Score:
                print score.get("suite_version").get("name"),
            else:
                print score.get("suite_test").get("name"),
            print key

print "Lost detections!:", changes["regressed-noregression"]
print "Over active detection: ", changes["noregression-regressed"]
print "% less detections: ", 1.0*int(changes["marked noregression-noregression"])/(int(changes["marked noregression-regressed"])+int(changes["marked noregression-noregression"]))

print "Db regressions: ", int(changes["db_marked noregression"]) + int(changes["db_regressed"]) + int(changes["db_unconfirmed"])
print "Old regressions: ", int(changes["old_regressed"])
print "Now regressions: ", int(changes["now_regressed"])

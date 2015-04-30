# vim: set ts=4 sw=4 tw=99 et:
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

import awfy
import sys
import time
import tables
import regression_detector
from collections import defaultdict

def testRuns():
  c = awfy.db.cursor()
  c.execute("SELECT id                                                          \
             FROM awfy_run                                                      \
             WHERE stamp > 1428624000 AND                                       \
                   status = 1 AND                                               \
                   detector = 1 AND                                             \
                   machine in (28)")
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
        elif score.__class__ == tables.Breakdown:
            regression = tables.RegressionBreakdown(score.get("build"), score)

        status_db = "noregression"
        if regression.id != 0:
            if regression.get("noise") == 1:
                status_db = "marked noregression"
            elif regression.regression().get('status') == "noise":
                status_db = "marked noregression"
            else:
                status_db = "regressed"
        
        status_now = "noregression"
        regressed_ = regression_detector.regressed(score)
        if regressed_ is None:
            status_now = "nodata"
        elif regressed_:
            status_now = "regressed"
    
        key = status_db+"-"+status_now
        changes[key] += 1  
        
        if key == "regressed-noregression" or key == "noregression-regressed":
            if regression.id == 0:
                print 0,
            else:
                print regression.regression().id, 
            if score.__class__ == tables.Score:
                print score.get("suite_version").get("name"),
            else:
                print score.get("suite_test").get("name"),
            print key

print "Lost detections!:", changes["regressed-noregression"]
print "Over active detection: ", changes["noregression-regressed"]
print "% less detections: ", 1.0*int(changes["marked noregression-noregression"])/(int(changes["marked noregression-regressed"])+int(changes["marked noregression-noregression"]))




# vim: set ts=4 sw=4 tw=99 et:
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

import awfy
import sys
import time
import tables

def notProcessedRuns():
  c = awfy.db.cursor()
  c.execute("SELECT id                                                          \
             FROM awfy_run                                                      \
             WHERE id > 223536                                                  \
             AND status = 1 AND machine=28")
  runs = []
  for row in c.fetchall():
    runs.append(tables.Run(row[0]))
  return runs
   
def regressed(score):
  change = score.change()

  # No change, so wait for more data before reporting.
  if not change:
    return None

  # Lower than threshold, no regression.
  if abs(change) <= score.noise():
    return False

  # Next is not available. Wait for that before reporting.
  if not score.next():
    return None

  # Next has a bigger change. Regression is more likely to be that.
  if change >= 0 and score.next().change() > change:
    return False
  if change <= 0 and score.next().change() < change:
    return False

  # If there is a prev, test that prev change is smaller
  if score.prev(): 
    if change >= 0 and score.prev().change() >= change:
      return False
    if change <= 0 and score.prev().change() <= change:
      return False

  return True

import os
import time
os.environ['TZ'] = "Europe/Amsterdam"
time.tzset()

start = time.time()
for run in notProcessedRuns():
  scores = run.getScoresAndBreakdowns()
  finish = True
  print "run:", run.get("id")
  for score in scores:
    regressed_ = regressed(score)

    # Not enough info yet
    if regressed_ is None:
      finish = False

    if regressed_ is True: 
      score.dump()
      build = score.get("build_id")
      try:
        id_ = tables.Regression.insert({"build_id": build})
        tables.RegressionStatus.insert({"regression_id": id_, "name": "awfy", "status": "unconfirmed", "stamp":"UNIX_TIMESTAMP()"})
      except:
        pass
      try:
        if score.__class__ == tables.Score:
            tables.RegressionScore.insert({"build_id": build, "score_id": score.get("id")})
        elif score.__class__ == tables.Breakdown:
            tables.RegressionBreakdown.insert({"build_id": build, "breakdown_id": score.get("id")})
        else:
            assert False
      except:
        pass
  #if finish:
  #  run.update({"detector": "1"})
  tables.DBTable.maybeflush()

awfy.db.commit()

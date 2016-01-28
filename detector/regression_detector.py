# vim: set ts=4 sw=4 tw=99 et:
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

from optparse import OptionParser
import sys
import time

sys.path.append("../server") 
import awfy
import tables

parser = OptionParser(usage="usage: %prog [options]")
parser.add_option( "--dry-run", dest="dryrun", action="store_true", default=False,
                  help="Don't commit the new regressions to the database yet.")
(options, args) = parser.parse_args()

def notProcessedRuns():
  # Only look at reports in the last week
  newer = int(time.time() - 60 * 60 * 24 * 7)
  c = awfy.db.cursor()
  c.execute("SELECT id                                                          \
             FROM awfy_run                                                      \
             WHERE finish_stamp > "+str(newer)+" AND                            \
                   status = 1 AND                                               \
                   detector != 1 AND                                            \
                   machine in (28,29,26,17,30)")
  runs = []
  for row in c.fetchall():
    runs.append(tables.Run(row[0]))
  return runs
   
def regressed(score):
  # Disabled. So no testing
  if score.disabled():
    return False

  # Lower than threshold, no regression.
  change = score.change()
  if change is None:
    return None
  if abs(change) <= score.noise():
    return False

  #Don't report outliners
  if score.outliner():
    return False

  # Don't report if same revision
  if score.prev() is not None:
    if score.get('build').get('cset') == score.prev().get('build').get('cset'):
      return False

  # average change over multiple runs.
  change = score.avg_change()

  # No change, so wait for more data before reporting.
  if change is None:
    return None

  # Next is not available. Wait for that before reporting.
  if not score.next():
    return None
  if score.next().avg_change() is None:
    return None

  # Next has a bigger change. Regression is more likely to be that.
  if change >= 0 and score.next().avg_change() > change:
    return False
  if change <= 0 and score.next().avg_change() < change:
    return False

  # If there is a prev, test that prev change is smaller
  if score.prev(): 
    if change >= 0 and score.prev().avg_change() >= change:
      return False
    if change <= 0 and score.prev().avg_change() <= change:
      return False

  return True

if __name__ == "__main__":
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
        if not score.sane():
            continue
        regressed_ = regressed(score)

        # Not enough info yet
        if regressed_ is None:
          finish = False

        if regressed_ is True: 
          score.dump()
          if not options.dryrun:
            build = score.get("build_id")
            prev_build = score.prev().get("build_id")
            regression = [regression for regression in tables.Regression.where({
                    "build_id": build,
                    "prev_build_id": prev_build
            })]
            if len(regression) == 0:
              regression_id = tables.Regression.insert({
                  "build_id": build,
                  "prev_build_id": prev_build
              })
              tables.RegressionStatus.insert({"regression_id": regression_id,
                                              "name": "awfy",
                                              "extra": "Submitted",
                                              "stamp":"UNIX_TIMESTAMP()"})
            else:
              regression_id = regression[0].id

            try:
              if score.__class__ == tables.Score:
                  tables.RegressionScore.insert({"regression_id": regression_id,
                                                 "score_id": score.get("id")})
              elif score.__class__ == tables.Breakdown:
                  tables.RegressionBreakdown.insert({"regression_id": regression_id,
                                                     "breakdown_id": score.get("id")})
              else:
                  assert False
            except:
              pass
      if finish and not options.dryrun:
        run.update({"detector": "1"})
      tables.DBTable.maybeflush()

    awfy.db.commit()

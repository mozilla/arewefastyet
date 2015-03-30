# vim: set ts=4 sw=4 tw=99 et:
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

import awfy
import sys
import time
import tables

def avg_diff(machine, suite, mode, first):
    prev = first
    current = first.next()
    total = 0
    count = 0
    while current:
       diff = abs(prev.get('score') - current.get('score'))
       total += diff
       count += 1
       prev = current
       current = current.next()
    return total/count

for machine in tables.Machine.all():
  if machine.get("description") != "Mac OS X 10.10 32-bit (Mac Pro, shell)":
    continue
  
  for mode in tables.Mode.allWith(machine):
    for suite in tables.SuiteVersion.all():
        first = tables.Score.first(machine, suite, mode)
        if not first:
            continue
        diff = avg_diff(machine, suite, mode, first)
        tables.RegressionScoreNoise.insertOrUpdate(machine, suite, mode, diff)
        print suite.get('name'), mode.get('name'), diff
        awfy.db.commit()
    for suite in tables.SuiteTest.all():
        first = tables.Breakdown.first(machine, suite, mode)
        if not first:
            continue
        diff = avg_diff(machine, suite, mode, first)
        tables.RegressionBreakdownNoise.insertOrUpdate(machine, suite, mode, diff)
        print suite.get('name'), mode.get('name'), diff
        awfy.db.commit()


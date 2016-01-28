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
parser.add_option("-n", "--non-existing", dest="nonexistonly", action="store_true", default=False,
                  help="Only compute noise of items that don't have one yet.")
(options, args) = parser.parse_args()

def median(x):
    x.sort()
    length = len(x)
    if length % 2 == 1:
        return x[length/2]
    else:
        return (x[(length-1)/2] + x[(length+1)/2]) / 2.0

def avg_diff(machine, suite, mode, first):
    prev = first
    current = first.next()
    diffs = []
    while current:
       diff = abs(prev.get('score') - current.get('score'))
       if diff != 0:
           diffs.append(diff)

       prev = current
       current = current.next()
    if len(diffs) == 0:
       return None
    return median(diffs)

def equal_sign(a, b):
    if a >= 0 and b >= 0:
       return True
    if a <= 0 and b <= 0:
       return True
    return False

def avg_consequent_diff(machine, suite, mode, first):
    prev = first
    current = first.next()
    diffs = []
    consequent = 0
    while current:
       diff = prev.get('score') - current.get('score')
       if diff != 0:
           if equal_sign(diff, consequent):
              consequent += diff
           else:
              diffs.append(abs(consequent))
              consequent = diff

       prev = current
       current = current.next()
    if consequent != 0:
       diffs.append(abs(consequent))
    if len(diffs) == 0:
       return None
    return median(diffs)

for machine in tables.Machine.all():
  if (machine.id != 28 and # mac os x 32 bit shell
      machine.id != 29 and # mac os x 64 bit shell 
      machine.id != 26 and # ffos flame browser
      machine.id != 30 and # mac os x browser 
      machine.id != 17):   # windows 8 browser
    continue
  
  for mode in tables.Mode.allWith(machine):
    for suite in tables.SuiteVersion.all():
        # Don't update, only insert new ones, if requested
        if tables.RegressionScoreNoise(machine, suite, mode).id != 0 and options.nonexistonly:
            continue

        first = tables.Score.firstOfRecent(machine, suite, mode)
        if not first:
            continue
        diff = avg_consequent_diff(machine, suite, mode, first)
        if not diff:
            continue
        tables.RegressionScoreNoise.insertOrUpdate(machine, suite, mode, diff)
        print suite.get('name'), mode.get('name'), diff
        awfy.db.commit()
    for suite in tables.SuiteTest.all():
        # Don't update, only insert new ones, if requested
        if tables.RegressionBreakdownNoise(machine, suite, mode).id != 0 and options.nonexistonly:
            continue

        first = tables.Breakdown.firstOfRecent(machine, suite, mode)
        if not first:
            continue
        diff = avg_consequent_diff(machine, suite, mode, first)
        if not diff:
            continue
        tables.RegressionBreakdownNoise.insertOrUpdate(machine, suite, mode, diff)
        print suite.get('name'), mode.get('name'), diff
        awfy.db.commit()


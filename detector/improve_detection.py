# vim: set ts=4 sw=4 tw=99 et:
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

import awfy
import tables

RUNS = 20

def isOutliner(item):
  score = item.score()
  nexts = [i.get("score") for i in score.nexts_no_outliners(RUNS)]
  prevs = [i.get("score") for i in score.prevs_no_outliners(RUNS)]
  if len(nexts) != RUNS:
    return False
  if len(prevs) != RUNS:
    return False
  avg_nexts = sum(nexts)/len(nexts)
  avg_prevs = sum(prevs)/len(prevs)

  if abs(avg_nexts - avg_prevs) < score.noise() / tables.NOISE_FACTOR:
     return True
  return False

def isEmptyRegression(item):
  score = item.score()
  if score.prev().get("build").get("cset") == score.get("build").get("cset"):
    return True
  return False

def isBiModal(item):
  def divide(li):
    h = max(li)
    l = min(li)
    highs = []
    lows = []
    for i in li:
      if h-i < i-l:
        highs.append(i)
      else:
        lows.append(i)
    return highs, lows


  score = item.score()
  nexts = [i.get("score") for i in score.nexts(RUNS)]
  prevs = [i.get("score") for i in score.prevs(RUNS)]
  nexts_h, nexts_l = divide(nexts)
  prevs_h, prevs_l = divide(prevs)

  if len(nexts_h) < 4:
    return False
  if len(nexts_l) < 4:
    return False
  if len(prevs_h) < 4:
    return False
  if len(prevs_l) < 4:
    return False
  avg_nexts_h = sum(nexts_h)/len(nexts_h)
  avg_nexts_l = sum(nexts_l)/len(nexts_l)
  avg_prevs_h = sum(prevs_h)/len(prevs_h)
  avg_prevs_l = sum(prevs_l)/len(prevs_l)

  if abs(avg_nexts_h - avg_prevs_h) >= score.noise() / tables.NOISE_FACTOR:
     return False
  if abs(avg_nexts_l - avg_prevs_l) >= score.noise() / tables.NOISE_FACTOR:
     return False
  return True

modes = [14,16,20,21,22,23,25,26,27,28,29,31,32,33,35]
for regression in tables.Regression.where({'status':'unconfirmed'}):
  if regression.get("build").get("mode_id") not in modes:
    continue

  allRemoved = True
  for item in regression.regressions():
    if item.get("noise"):
      continue

    print "item" 
    
    if isEmptyRegression(item):
      print "remove", regression.id 
      item.score().dump()
      item.update({"noise":"1"}) 
      continue

    if isOutliner(item):
      print "remove", regression.id 
      item.score().dump()
      item.update({"noise":"1"}) 
      continue

    if isBiModal(item):
      print "remove", regression.id 
      item.score().dump()
      item.update({"noise":"1"}) 
      continue

    allRemoved = False

  if allRemoved:
    print "remove item"
    regression.update({"status":"noise"})
      
awfy.db.commit()

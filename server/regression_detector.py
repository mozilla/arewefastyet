# vim: set ts=4 sw=4 tw=99 et:
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

import awfy
import sys
import types

def get_class(field):
    try:
        identifier = getattr(sys.modules[__name__], field)
    except AttributeError:
        raise NameError("%s doesn't exist." % field)
    if isinstance(identifier, (types.ClassType, types.TypeType)):
        return identifier
    raise TypeError("%s is not a class." % field)

def camelcase(string):
    """Convert string or unicode from lower-case underscore to camel-case"""
    splitted_string = string.split('_')
    # use string's class to work on the string to keep its type
    class_ = string.__class__
    return class_.join('', map(class_.capitalize, splitted_string))

class DBTable:
  def __init__(self, id):
    self.id = int(id)
    self.initialized = False
    self.cached = {}

  def initialize(self):
    if self.initialized:
      return
    self.initialized = True
    c = awfy.db.cursor()
    c.execute("SELECT *                                                         \
               FROM "+self.table()+"                                            \
               WHERE id = %s                                                    \
               LIMIT 1", (self.id, ))
    data = c.fetchone()
    for i in range(len(data)):
      self.cached[c.description[i][0]] = data[i]

  def get(self, field):
    self.initialize()

    if field in self.cached:
      return self.cached[field]

    if field+"_id" in self.cached:
      id_ = self.cached[field+"_id"]
      class_ = get_class(camelcase(field))
      value = class_(id_)
      self.cached[field] = value
      return self.cached[field]
    assert False

  @staticmethod
  def insert(class_, data):
    c = awfy.db.cursor()
    values = []
    for i in data.values():
        if "'" in str(i):
            raise TypeError("' is not allowed as value.")
        if i == "UNIX_TIMESTAMP()":
            values.append(i)
        else:
            values.append("'"+str(i)+"'")
    c.execute("INSERT INTO "+class_.table()+"                                  \
               ("+",".join(data.keys())+")                                     \
               VALUES ("+",".join(values)+")")
    return c.lastrowid

class Run(DBTable):
  def __init__(self, id):
    DBTable.__init__(self, id)

  @staticmethod
  def table():
    return "awfy_run"

  def initialize(self):
    if self.initialized:
      return
    DBTable.initialize(self)
    self.cached["machine_id"] = self.cached["machine"]
    del self.cached["machine"]

  @staticmethod
  def notProcessedRuns():
    c = awfy.db.cursor()
    c.execute("SELECT id                                                          \
               FROM awfy_run                                                      \
               WHERE id > 210036                                                  \
               AND status = 1 AND machine=28")
    runs = []
    for row in c.fetchall():
      runs.append(Run(row[0]))
    return runs
    
  def getScores(self):
    c = awfy.db.cursor()
    c.execute("SELECT id                                                              \
               FROM awfy_build                                                        \
               WHERE run_id = %s", (self.id,))
    scores = []
    for row in c.fetchall():
      scores += Build(row[0]).getScores()
    return scores

  def finishStamp(self):
    pass

class SuiteVersion(DBTable):
  def __init__(self, id):
    DBTable.__init__(self, id)

  @staticmethod
  def table():
    return "awfy_suite_version"

class Suite(DBTable):
  def __init__(self, id):
    DBTable.__init__(self, id)

  @staticmethod
  def table():
    return "awfy_suite"

class Machine(DBTable):
  def __init__(self, id):
    DBTable.__init__(self, id)

  @staticmethod
  def table():
    return "awfy_machine"

class Mode(DBTable):
  def __init__(self, id):
    DBTable.__init__(self, id)

  @staticmethod
  def table():
    return "awfy_mode"

class Regression(DBTable):
  def __init__(self, id):
    DBTable.__init__(self, id)

  @staticmethod
  def table():
    return "awfy_regression"

class RegressionScore(DBTable):
  def __init__(self, id):
    DBTable.__init__(self, id)

  @staticmethod
  def table():
    return "awfy_regression_score"

class RegressionStatus(DBTable):
  def __init__(self, id):
    DBTable.__init__(self, id)

  @staticmethod
  def table():
    return "awfy_regression_status"

class Build(DBTable):
  def __init__(self, id):
    DBTable.__init__(self, id)

  @staticmethod
  def table():
    return "awfy_build"

  def getScores(self):
    scores = []
    c = awfy.db.cursor()
    c.execute("SELECT id                                                              \
               FROM awfy_score                                                        \
               WHERE build_id = %s", (self.id,))
    for row in c.fetchall():
      scores.append(Score(row[0]))
    return scores

class Score(DBTable):
  def __init__(self, id):
    DBTable.__init__(self, id)

  @staticmethod
  def table():
    return "awfy_score"
  
  def next(self):
    if "next" not in self.cached:
        self.compute_next()
    return self.cached["next"]

  def prev(self):
    if "prev" not in self.cached:
        self.compute_prev()
    return self.cached["prev"]

  def compute_next(self):
    stamp = self.get("build").get("run").get("stamp")
    machine = self.get("build").get("run").get("machine_id")
    mode = self.get("build").get("mode_id")
    suite = self.get("suite_version_id")

    c = awfy.db.cursor()
    c.execute("SELECT awfy_score.id                                                   \
               FROM awfy_score                                                        \
               INNER JOIN awfy_build ON awfy_build.id = awfy_score.build_id           \
               INNER JOIN awfy_run ON awfy_run.id = awfy_build.run_id                 \
               WHERE stamp > %s AND                                                   \
                     machine = %s AND                                                 \
                     mode_id = %s AND                                                 \
                     suite_version_id = %s AND                                        \
                     status = 1                                                       \
               ORDER BY stamp ASC                                                     \
               LIMIT 1", (stamp, machine, mode, suite))
    row = c.fetchone()
    self.cached["next"] = Score(row[0]) if row else None

  def compute_prev(self):
    stamp = self.get("build").get("run").get("stamp")
    machine = self.get("build").get("run").get("machine_id")
    mode = self.get("build").get("mode_id")
    suite = self.get("suite_version_id")

    c = awfy.db.cursor()
    c.execute("SELECT awfy_score.id                                                   \
               FROM awfy_score                                                        \
               INNER JOIN awfy_build ON awfy_build.id = awfy_score.build_id           \
               INNER JOIN awfy_run ON awfy_run.id = awfy_build.run_id                 \
               WHERE stamp < %s AND                                                   \
                     machine = %s AND                                                 \
                     mode_id = %s AND                                                 \
                     suite_version_id = %s AND                                        \
                     status = 1                                                       \
               ORDER BY stamp DESC                                                    \
               LIMIT 1", (stamp, machine, mode, suite))
    row = c.fetchone()
    self.cached["prev"] = Score(row[0]) if row else None

  def prevs(self, amount):
    prevs = []
    point = self
    for i in range(amount):
        point = point.prev()
        if not point:
            break
        prevs.append(point)
    return prevs

  def nexts(self, amount):
    nexts = []
    point = self
    for i in range(amount):
        point = point.next()
        if not point:
            break
        nexts.append(point)
    return nexts

  def change(self):
    if "change" not in self.cached:
        self.cached["change"] = self.compute_change()
    return self.cached["change"]

  def runs(self):
    runs = max(1, self.get('build').get('run').get('machine').get("confidence_runs"))
    runs *= self.get('suite_version').get('suite').get("confidence_factor")
    runs = int(round(runs))
    return runs

  def compute_change(self):
    "Compute the change in runs before and after the current run"
    # How many runs do we need to test?
    runs = self.runs()

    # Get scores before and after this run.    
    prevs = [i.get('score') for i in self.prevs(runs)]
    nexts = [self.get('score')] + [i.get('score') for i in self.nexts(runs - 1)]

    # Not enough data to compute change.
    if len(nexts) != runs:
        return None
    
    # Handle edge cases.
    if sum(prevs) == 0 and sum(nexts) == 0:
        return 0
    if sum(prevs) == 0 or sum(nexts) == 0:
        return float("inf")

    avg_prevs = sum(prevs)/len(prevs)
    avg_nexts = sum(nexts)/len(nexts)

    change = (avg_prevs - avg_nexts) / (avg_prevs + avg_nexts)
    return abs(change)

  def regressed(self):
    change = self.change()

    # No change, so wait for more data before reporting.
    if not change:
        return None

    # Lower than threshold, no regression.
    if change <= 0.01:
        return False

    # Next is not available. Wait for that before reporting.
    if not self.next():
        return None

    # Next has a bigger change. Regression is more likely to be that.
    if self.next().change() > change:
        return False

    # If there is a prev, test that prev change is smaller
    if self.prev(): 
        if self.prev().change() >= change:
            return False

    import datetime
    print datetime.datetime.fromtimestamp(
        int(self.get("build").get("run").get("stamp"))
    ).strftime('%Y-%m-%d %H:%M:%S'),
    print "", self.get("build").get("run").get("machine").get("description"), 
    print "", self.get("build").get("mode").get("name"),
    print "", self.get("suite_version").get("name")+":", change,
    print "", self.prev().get("score") if self.prev() else "", self.get("score"),
    print " (%d runs)"%self.runs()
    return True
  
import os
import time
os.environ['TZ'] = "Europe/Amsterdam"
time.tzset()

for run in Run.notProcessedRuns():
  scores = run.getScores()
  finish = True
  for score in scores:
    regressed = score.regressed()

    # Not enough info yet
    if regressed is None:
      finish = False

    if regressed is True: 
      build = score.get("build_id")
      try:
        id_ = DBTable.insert(Regression, {"build_id": build})
        DBTable.insert(RegressionStatus, {"regression_id": id_, "name": "awfy", "status": "unconfirmed", "stamp":"UNIX_TIMESTAMP()"})
      except:
        pass
      try:
        DBTable.insert(RegressionScore, {"build_id": build, "score_id": score.get("id")})
      except:
        pass
  print "Finished run", run.get("id")

awfy.db.commit()

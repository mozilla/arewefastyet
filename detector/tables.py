# vim: set ts=4 sw=4 tw=99 et:
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

import awfy
import types

RUNS_FACTOR = 1
NOISE_FACTOR = 2

def get_class(field):
    try:
        identifier = globals()[field]
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

class DBTable(object):
  globalcache = {}

  def __init__(self, id):
    self.id = int(id)
    self.initialized = False
    self.cached = None

  def prefetch(self):
    if self.table() not in self.__class__.globalcache:
      self.__class__.globalcache[self.table()] = {}

    c = awfy.db.cursor()
    c.execute("SELECT *                                                         \
               FROM "+self.table()+"                                            \
               WHERE id > %s - 100 AND                                          \
                     id < %s + 100                                              \
               ", (self.id, self.id))
    for row in c.fetchall():
      cache = {}
      for i in range(len(row)):
        cache[c.description[i][0]] = row[i]
      self.__class__.globalcache[self.table()][cache["id"]] = cache

  def initialize(self):
    if self.initialized:
      return

    self.initialized = True
    if self.table() in self.__class__.globalcache:
      if self.id in self.__class__.globalcache[self.table()]:
        self.cached = self.__class__.globalcache[self.table()][self.id]
        return

    self.prefetch()
    self.cached = self.__class__.globalcache[self.table()][self.id]
    return

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

  def update(self, data):
    sets = [key + " = " + DBTable.valuefy(data[key]) for key in data]
    c = awfy.db.cursor()
    c.execute("UPDATE "+self.table()+"                                          \
               SET "+",".join(sets)+"                                           \
               WHERE id = %s", (self.id, ))

  def delete(self):
    c = awfy.db.cursor()
    c.execute("DELETE FROM "+self.table()+"										\
               WHERE id = %s", (self.id, ))

  @staticmethod
  def valuefy(value):
    if "'" in str(value):
        raise TypeError("' is not allowed as value.")
    if value == "UNIX_TIMESTAMP()":
        return value
    else:
        return "'"+str(value)+"'"

  @classmethod
  def insert(class_, data):
    values = [DBTable.valuefy(value) for value in data.values()]
    c = awfy.db.cursor()
    c.execute("INSERT INTO "+class_.table()+"                                  \
               ("+",".join(data.keys())+")                                     \
               VALUES ("+",".join(values)+")")
    return c.lastrowid

  @classmethod
  def all(class_):
    c = awfy.db.cursor()
    c.execute("SELECT id FROM "+class_.table())
    for row in c.fetchall():
        yield class_(row[0])

  @classmethod
  def where(class_, data):
    where = [name+" = "+DBTable.valuefy(data[name]) for name in data]
    c = awfy.db.cursor()
    c.execute("SELECT id FROM "+class_.table()+" WHERE "+" AND ".join(where))
    for row in c.fetchall():
        yield class_(row[0])

  @classmethod
  def maybeflush(class_):
    #TODO
    records = 0
    for i in class_.globalcache:
        records += len(class_.globalcache[i].keys())

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
    if "machine_id" not in self.cached:
       self.cached["machine_id"] = self.cached["machine"]
       del self.cached["machine"]

  def getScoresAndBreakdowns(self):
    c = awfy.db.cursor()
    c.execute("SELECT id                                                              \
               FROM awfy_build                                                        \
               WHERE run_id = %s", (self.id,))
    scores = []
    for row in c.fetchall():
      scores += Build(row[0]).getScoresAndBreakdowns()
    return scores

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

class SuiteTest(DBTable):
  def __init__(self, id):
    DBTable.__init__(self, id)

  @staticmethod
  def table():
    return "awfy_suite_test"

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

  @classmethod
  def allWith(class_, machine):
    c = awfy.db.cursor()
    c.execute("SELECT distinct(awfy_build.mode_id)                                   \
               FROM awfy_build                                                       \
               LEFT JOIN awfy_run ON awfy_build.run_id = awfy_run.id                 \
               WHERE machine = %s", (machine.get("id"),))
    for row in c.fetchall():
      if row[0] == 0:
         continue
      yield Mode(row[0])

  @staticmethod
  def table():
    return "awfy_mode"

class Regression(DBTable):
  def __init__(self, id):
    DBTable.__init__(self, id)

  def regressions(self):
    c = awfy.db.cursor()
    c.execute("SELECT id FROM awfy_regression_breakdown        \
               WHERE regression_id = %s", (self.id,))
    for row in c.fetchall():
      if row[0] == 0:
         continue
      yield RegressionBreakdown(row[0])
    c.execute("SELECT id FROM awfy_regression_score        \
               WHERE regression_id = %s", (self.id,))
    for row in c.fetchall():
      if row[0] == 0:
         continue
      yield RegressionScore(row[0])

  @staticmethod
  def table():
    return "awfy_regression"

class RegressionScore(DBTable):

  def score(self):
	return self.get("score")

  @staticmethod
  def table():
    return "awfy_regression_score"

class RegressionScoreNoise(DBTable):
  def __init__(self, machine, suite, mode):
    c = awfy.db.cursor()
    c.execute("SELECT id FROM "+self.table()+"          \
               WHERE machine_id = %s AND                \
                     mode_id = %s AND                   \
                     suite_version_id = %s", (machine.get("id"), mode.get("id"), suite.get("id")))
    row = c.fetchone()
    id = row[0] if row else 0
    DBTable.__init__(self, id)

  @classmethod
  def insertOrUpdate(class_, machine, suite, mode, noise):
    try:
       RegressionScoreNoise.insert({
         "machine_id": machine.get("id"),
         "suite_version_id": suite.get("id"),
         "mode_id": mode.get("id"),
         "noise": noise
       })
    except:
        c = awfy.db.cursor()
        c.execute("UPDATE "+class_.table()+"        \
                   SET noise = %s                   \
                   WHERE machine_id = %s AND        \
                         mode_id = %s AND           \
                         suite_version_id = %s", (noise, machine.get("id"), mode.get("id"),
                                                  suite.get("id")))

  @staticmethod
  def table():
    return "awfy_regression_score_noise"

class RegressionBreakdown(DBTable):

  def score(self):
	return self.get("breakdown")

  @staticmethod
  def table():
    return "awfy_regression_breakdown"

class RegressionBreakdownNoise(DBTable):
  def __init__(self, machine, suite, mode):
    c = awfy.db.cursor()
    c.execute("SELECT id FROM "+self.table()+"        \
               WHERE machine_id = %s AND                \
                     mode_id = %s AND                   \
                     suite_test_id = %s", (machine.get("id"), mode.get("id"), suite.get("id")))
    row = c.fetchone()
    id = row[0] if row else 0
    DBTable.__init__(self, id)

  @classmethod
  def insertOrUpdate(class_, machine, suite, mode, noise):
    try:
       RegressionBreakdownNoise.insert({
         "machine_id": machine.get("id"),
         "suite_test_id": suite.get("id"),
         "mode_id": mode.get("id"),
         "noise": noise
       })
    except:
        c = awfy.db.cursor()
        c.execute("UPDATE "+class_.table()+"        \
                   SET noise = %s                   \
                   WHERE machine_id = %s AND        \
                         mode_id = %s AND           \
                         suite_test_id = %s", (noise, machine.get("id"), mode.get("id"),
                                               suite.get("id")))

  @staticmethod
  def table():
    return "awfy_regression_breakdown_noise"

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

  def getScoresAndBreakdowns(self):
    scores = self.getScores()
    c = awfy.db.cursor()
    c.execute("SELECT id                                                              \
               FROM awfy_breakdown                                                    \
               WHERE build_id = %s", (self.id,))
    for row in c.fetchall():
      scores.append(Breakdown(row[0]))
    return scores

class RegressionTools(DBTable):
  def __init__(self, id):
    DBTable.__init__(self, id)

  def outliner(self):
    if self.next() is None:
      return False
    if self.prev() is None:
      return False
    if abs(self.next().get("score") - self.prev().get("score")) < self.noise():
      if (abs(self.next().get("score") - self.get("score")) > self.noise() and
          abs(self.prev().get("score") - self.get("score")) > self.noise()):
        return True
    prevs, _ = self.avg_prevs_nexts()
    _, nexts = self.next().avg_prevs_nexts()
    if prevs is None or nexts is None:
      return False
    if abs(prevs-nexts) <= self.noise():
      if (abs(self.get('score') - self.prev().get('score')) > self.noise() and
          abs(self.get('score') - self.next().get('score')) > self.noise()):
        return True
    return False

  def next(self):
    self.initialize()
    if "next" not in self.cached:
        self.cached["next"] = self.compute_next()
    return self.cached["next"]

  def compute_next(self):
    nexts = self.prefetch_next(10)

    prev = self
    prev.cached["next"] = None
    for score in nexts:
       prev.initialize()
       prev.cached["next"] = score
       score.initialize()
       score.cached["prev"] = prev
       prev = score

    return self.cached["next"]

  def prev(self):
    self.initialize()
    if "prev" not in self.cached:
        self.cached["prev"] = self.compute_prev()
        if self.cached["prev"]:
            self.cached["prev"].initialize()
            self.cached["prev"].cached["next"] = self
    else:
        pass
    return self.cached["prev"]

  def compute_prev(self):
    prevs = self.prefetch_prev(10)

    next_ = self
    next_.cached["prev"] = None
    for score in prevs:
       next_.initialize()
       next_.cached["prev"] = score
       score.initialize()
       score.cached["next"] = next_
       next_ = score

    return self.cached["prev"]

  def prevs(self, amount):
    prevs = []
    point = self
    while len(prevs) < amount:
        point = point.prev()
        if not point:
            break
        prevs.append(point)
    return prevs

  def nexts(self, amount):
    nexts = []
    point = self
    while len(nexts) < amount:
        point = point.next()
        if not point:
            break
        nexts.append(point)
    return nexts

  def prevs_no_outliners(self, amount):
    # note this removes outliners
    prevs = []
    point = self
    while len(prevs) < amount:
        point = point.prev()
        if not point:
            break
        if point.outliner():
            continue
        prevs.append(point)
    return prevs

  def nexts_no_outliners(self, amount):
    # note this removes outliners
    nexts = []
    point = self
    while len(nexts) < amount:
        point = point.next()
        if not point:
            break
        if point.outliner():
            continue
        nexts.append(point)
    return nexts

  def avg_prevs_no_outliners(self):
    avg_prevs, _ = self.avg_prevs_nexts_no_outliners()
    return avg_prevs

  def avg_nexts_no_outliners(self):
    _, avg_nexts = self.avg_prevs_nexts_no_outliners()
    return avg_nexts

  def avg_prevs_nexts_no_outliners(self):
    self.initialize()
    if "avg_prevs_no_outliners" not in self.cached:
        self.cached["avg_prevs_no_outliners"], self.cached["avg_nexts_no_outliners"] = self.compute_avg_prevs_nexts_no_outliners()
    return self.cached["avg_prevs_no_outliners"], self.cached["avg_nexts_no_outliners"]

  def avg_prevs_nexts(self):
    self.initialize()
    if "avg_prevs" not in self.cached:
        self.cached["avg_prevs"], self.cached["avg_nexts"] = self.compute_avg_prevs_nexts()
    return self.cached["avg_prevs"], self.cached["avg_nexts"]

  def compute_avg_prevs_nexts_no_outliners(self):
    "Compute the change in runs before and after the current run"
    # How many runs do we need to test?
    runs = self.runs()

    # Get scores before and after this run.
    prevs = [i.get('score') for i in self.prevs_no_outliners(runs)]
    nexts = [self.get('score')] + [i.get('score') for i in self.nexts_no_outliners(runs - 1)]

    p_weight = [len(prevs)-i for i in range(len(prevs))]
    n_weight = [len(nexts)-i for i in range(len(nexts))]
    prevs = [prevs[i]*p_weight[i] for i in range(len(prevs))]
    nexts = [nexts[i]*n_weight[i] for i in range(len(nexts))]

    # Not enough data to compute change.
    if len(nexts) != runs:
        return None, None

    avg_prevs = sum(prevs)
    avg_nexts = sum(nexts)

    # Handle edge cases.
    if avg_prevs != 0:
        avg_prevs /= sum(p_weight)
    if avg_nexts != 0:
        avg_nexts /= sum(n_weight)

    return avg_prevs, avg_nexts

  def compute_avg_prevs_nexts(self):
    "Compute the change in runs before and after the current run"
    # How many runs do we need to test?
    runs = self.runs()

    # Get scores before and after this run.
    prevs = [i.get('score') for i in self.prevs(runs)]
    nexts = [self.get('score')] + [i.get('score') for i in self.nexts(runs - 1)]

    p_weight = [len(prevs)-i for i in range(len(prevs))]
    n_weight = [len(nexts)-i for i in range(len(nexts))]
    prevs = [prevs[i]*p_weight[i] for i in range(len(prevs))]
    nexts = [nexts[i]*n_weight[i] for i in range(len(nexts))]

    # Not enough data to compute change.
    if len(nexts) != runs:
        return None, None

    avg_prevs = sum(prevs)
    avg_nexts = sum(nexts)

    # Handle edge cases.
    if avg_prevs != 0:
        avg_prevs /= sum(p_weight)
    if avg_nexts != 0:
        avg_nexts /= sum(n_weight)

    return avg_prevs, avg_nexts

  def change(self):
    prevs, nexts = self.avg_prevs_nexts_no_outliners()
    if not prevs or not nexts:
        return None

    return abs(prevs - nexts)

  def avg_change(self):
    prevs, nexts = self.avg_prevs_nexts_no_outliners()
    if not prevs or not nexts:
        return None

    if prevs == 0:
        return float("inf")

    change = (prevs - nexts) / (prevs)
    return change


class Score(RegressionTools):
  def __init__(self, id):
    RegressionTools.__init__(self, id)

  @staticmethod
  def table():
    return "awfy_score"

  def sane(self):
    if self.get("suite_version_id") == -1:
        return False
    if self.get("suite_version_id") == 0:
        return False
    try:
        self.noise()
    except:
        print "no noise?"
        return False
    return True

  def prefetch_next(self, limit = 1):
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
               LIMIT "+str(limit), (stamp, machine, mode, suite))
    rows = c.fetchall()
    return [Score(row[0]) for row in rows]

  def prefetch_prev(self, limit = 1):
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
    rows = c.fetchall()
    return [Score(row[0]) for row in rows]

  def runs(self):
    runs = max(1, self.get('build').get('run').get('machine').get("confidence_runs"))
    runs *= self.get('suite_version').get('suite').get("confidence_factor")
    runs *= RUNS_FACTOR
    runs = int(round(runs))
    return runs

  def disabled(self):
    return RegressionScoreNoise(self.get('build').get('run').get('machine'),
                                self.get('suite_version'),
                                self.get('build').get('mode')).get('disabled')

  def noise(self):
    noise = RegressionScoreNoise(self.get('build').get('run').get('machine'),
                                 self.get('suite_version'),
                                 self.get('build').get('mode')).get('noise')
    return NOISE_FACTOR*noise

  @classmethod
  def firstOfRecent(class_, machine, suite, mode):
    assert machine.__class__ == Machine
    assert suite.__class__ == SuiteVersion
    assert mode.__class__ == Mode

    c = awfy.db.cursor()
    c.execute("SELECT id                                                                    \
               FROM (SELECT awfy_score.id, stamp                                            \
                     FROM awfy_score                                                        \
                     INNER JOIN awfy_build ON awfy_build.id = awfy_score.build_id           \
                     INNER JOIN awfy_run ON awfy_run.id = awfy_build.run_id                 \
                     WHERE machine = %s AND                                                 \
                           mode_id = %s AND                                                 \
                           suite_version_id = %s AND                                        \
                           status = 1                                                       \
                     ORDER BY stamp DESC                                                    \
                     LIMIT 1000) tmp                                                        \
               ORDER BY stamp ASC                                                           \
               LIMIT 1", (machine.get("id"), mode.get("id"), suite.get("id")))
    row = c.fetchone()
    if row:
      return Score(row[0])
    return None

  def dump(self):
    import datetime
    print datetime.datetime.fromtimestamp(
        int(self.get("build").get("run").get("stamp"))
    ).strftime('%Y-%m-%d %H:%M:%S'),
    print "", self.get("build").get("run").get("machine").get("description"),
    print "", self.get("build").get("mode").get("name"),
    print "", self.get("suite_version").get("name")+":", self.avg_change(),
    print "", self.prev().get("score") if self.prev() else "", self.get("score"),
    print " ("+str(self.runs())+" runs, "+str(self.noise())+")"

class Breakdown(RegressionTools):
  def __init__(self, id):
    RegressionTools.__init__(self, id)

  @staticmethod
  def table():
    return "awfy_breakdown"

  def get(self, field):
    if field == "build_id":
      return Score(self.get("score_id")).get("build_id")
    if field == "build":
      return Score(self.get("score_id")).get("build")

    return super(Breakdown, self).get(field)

  def sane(self):
    if self.get("suite_test_id") == 0:
        return False
    if self.get("suite_test_id") == -1:
        return False
    if self.get("suite_test").get("suite_version_id") == -1:
        return False
    if self.get("suite_test").get("suite_version_id") == 0:
        return False
    try:
        self.noise()
    except:
        print "no noise?"
        return False
    return True

  def prefetch_next(self, limit = 1):
    stamp = self.get("build").get("run").get("stamp")
    machine = self.get("build").get("run").get("machine_id")
    mode = self.get("build").get("mode_id")
    suite = self.get("suite_test_id")

    c = awfy.db.cursor()
    c.execute("SELECT awfy_breakdown.id                                               \
               FROM awfy_breakdown                                                    \
               INNER JOIN awfy_build ON awfy_build.id = awfy_breakdown.build_id       \
               INNER JOIN awfy_run ON awfy_run.id = awfy_build.run_id                 \
               WHERE stamp > %s AND                                                   \
                     machine = %s AND                                                 \
                     mode_id = %s AND                                                 \
                     suite_test_id = %s AND                                           \
                     status = 1                                                       \
               ORDER BY stamp ASC                                                     \
               LIMIT "+str(limit), (stamp, machine, mode, suite))
    rows = c.fetchall()
    return [Breakdown(row[0]) for row in rows]

  def prefetch_prev(self, limit = 1):
    stamp = self.get("build").get("run").get("stamp")
    machine = self.get("build").get("run").get("machine_id")
    mode = self.get("build").get("mode_id")
    suite = self.get("suite_test_id")

    c = awfy.db.cursor()
    c.execute("SELECT awfy_breakdown.id                                               \
               FROM awfy_breakdown                                                    \
               INNER JOIN awfy_build ON awfy_build.id = awfy_breakdown.build_id       \
               INNER JOIN awfy_run ON awfy_run.id = awfy_build.run_id                 \
               WHERE stamp < %s AND                                                   \
                     machine = %s AND                                                 \
                     mode_id = %s AND                                                 \
                     suite_test_id = %s AND                                           \
                     status = 1                                                       \
               ORDER BY stamp DESC                                                    \
               LIMIT "+str(limit), (stamp, machine, mode, suite))
    rows = c.fetchall()
    return [Breakdown(row[0]) for row in rows]

  @classmethod
  def firstOfRecent(class_, machine, suite, mode):
    assert machine.__class__ == Machine
    assert suite.__class__ == SuiteTest
    assert mode.__class__ == Mode

    c = awfy.db.cursor()
    c.execute("SELECT id                                                                    \
               FROM (SELECT awfy_breakdown.id, stamp                                        \
                     FROM awfy_breakdown                                                    \
                     INNER JOIN awfy_build ON awfy_build.id = awfy_breakdown.build_id       \
                     INNER JOIN awfy_run ON awfy_run.id = awfy_build.run_id                 \
                     WHERE machine = %s AND                                                 \
                           mode_id = %s AND                                                 \
                           suite_test_id = %s AND                                           \
                           status = 1                                                       \
                     ORDER BY stamp DESC                                                    \
                     LIMIT 1000) tmp                                                        \
               ORDER BY stamp ASC                                                           \
               LIMIT 1", (machine.get("id"), mode.get("id"), suite.get("id")))
    row = c.fetchone()
    if row:
      return Breakdown(row[0])
    return None

  def runs(self):
    runs = max(1, self.get('build').get('run').get('machine').get("confidence_runs"))
    runs *= self.get('suite_test').get("confidence_factor")
    runs *= RUNS_FACTOR
    runs = int(round(runs))
    return runs

  def disabled(self):
    return RegressionBreakdownNoise(self.get('build').get('run').get('machine'),
                                    self.get('suite_test'),
                                    self.get('build').get('mode')).get('disabled')

  def noise(self):
    noise = RegressionBreakdownNoise(self.get('build').get('run').get('machine'),
                                     self.get('suite_test'),
                                     self.get('build').get('mode')).get('noise')
    return NOISE_FACTOR*noise

  def dump(self):
    import datetime
    print datetime.datetime.fromtimestamp(
        int(self.get("build").get("run").get("stamp"))
    ).strftime('%Y-%m-%d %H:%M:%S'),
    print "", self.get("build").get("run").get("machine").get("description"),
    print "", self.get("build").get("mode").get("name"),
    print "", self.get("suite_test").get("suite_version").get("name")+":", self.get("suite_test").get("name")+":", self.avg_change(),
    print "", self.prev().get("score") if self.prev() else "", self.get("score"),
    print " ("+str(self.runs())+" runs, "+str(self.noise())+", "+str(self.change())+")"

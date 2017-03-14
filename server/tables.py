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

  @classmethod
  def FromId(class_, id):
    obj = class_(row[0])
    if obj.exists():
      return obj
    return None
    
  def __init__(self, id):
    self.id = int(id)
    self.initialized = False
    self.cached = None

  def exists(self):
    self.initialize()
    return self.cached != None

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
    if self.id in self.__class__.globalcache[self.table()]:
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
    c.execute("DELETE FROM "+self.table()+"                                        \
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

  def getScores(self):
    c = awfy.db.cursor()
    c.execute("SELECT id                                                              \
               FROM awfy_build                                                        \
               WHERE run_id = %s", (self.id,))
    scores = []
    for row in c.fetchall():
      scores += Build(row[0]).getScores()
    return scores

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

  @staticmethod
  def table():
    return "awfy_mode"

class Build(DBTable):
  def __init__(self, id):
    DBTable.__init__(self, id)

  @staticmethod
  def table():
    return "awfy_build"

  @staticmethod
  def fromRunAndMode(run_id, mode_id):
    c = awfy.db.cursor()
    c.execute("SELECT id                                                             \
               FROM awfy_build                                                       \
               WHERE run_id = %s AND                                                 \
                     mode_id = %s", (run_id, mode_id))
    rows = c.fetchall()
    if len(rows) == 0:
        return None
    assert len(rows) == 1
    return Build(rows[0][0])

  def getScores(self):
    scores = []
    c = awfy.db.cursor()
    c.execute("SELECT id                                                              \
               FROM awfy_score                                                        \
               WHERE build_id = %s", (self.id,))
    for row in c.fetchall():
      scores.append(Score(row[0]))
    return scores

class RegressionTools(DBTable):
  def __init__(self, id):
    DBTable.__init__(self, id)

class Score(RegressionTools):
  def __init__(self, id):
    RegressionTools.__init__(self, id)

  @staticmethod
  def table():
    return "awfy_score"

  def getBreakdowns(self):
    c = awfy.db.cursor()
    c.execute("SELECT awfy_breakdown.id                                               \
               FROM awfy_breakdown                                                    \
               WHERE score_id = %s", (self.id,))
    breakdowns = []
    for row in c.fetchall():
      breakdowns.append(Breakdown(row[0]))
    return breakdowns

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

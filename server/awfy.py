# vim: set ts=4 sw=4 tw=99 et:
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

try:
  import MySQLdb as mdb
except:
  import mysqldb as mdb
try:
  import ConfigParser
except:
  import configparser as ConfigParser

db = None
version = None
path = None
th_host = None
th_user = None
th_secret = None


queries = 0
class DB:
  def __init__(self, host, user, pw, name):
    self.host = host
    self.user = user
    self.pw = pw
    self.name = name
    self.connect()
  def connect(self):
    if self.host[0] == '/':
      self.db = mdb.connect(unix_socket=self.host, user=self.user, passwd=self.pw,
                            db=self.name, use_unicode=True)
    else:
      self.db = mdb.connect(self.host, self.user, self.pw, self.name, use_unicode=True)
  def cursor(self):
    return DBCursor(self.db.cursor())
  def commit(self):
    return self.db.commit()
class DBCursor:
  def __init__(self, cursor):
    self.cursor = cursor
  def execute(self, sql, data=None):
    global queries
    queries+=1
    exe = self.cursor.execute(sql, data);
    self.description = self.cursor.description
    self.lastrowid = self.cursor.lastrowid
    self.rowcount = self.cursor.rowcount
    return exe
  def fetchone(self):
    return self.cursor.fetchone();
  def fetchall(self):
    return self.cursor.fetchall();

def Startup():
    global db, version, path, th_host, th_user, th_secret
    config = ConfigParser.RawConfigParser()
    config.read("/etc/awfy-server.config")

    host = config.get('mysql', 'host')
    user = config.get('mysql', 'user')
    pw = config.get('mysql', 'pass')
    name = config.get('mysql', 'db_name')

    db = DB(host, user, pw, name)
    c = db.cursor()
    c.execute("SELECT `value` FROM awfy_config WHERE `key` = 'version'")
    row = c.fetchone()
    version = int(row[0])

    path = config.get('general', 'data_folder')

    if config.has_section('treeherder'):
        th_host = config.get('treeherder', 'host')
        th_user = config.get('treeherder', 'user')
        th_secret = config.get('treeherder', 'secret')

Startup()

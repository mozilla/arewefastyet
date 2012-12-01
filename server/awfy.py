# vim: set ts=4 sw=4 tw=99 et:
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

def Startup():
    global db, version, path
    config = ConfigParser.RawConfigParser()
    config.read("/etc/awfy-server.config")

    host = config.get('mysql', 'host')
    user = config.get('mysql', 'user')
    pw = config.get('mysql', 'pass')
    name = config.get('mysql', 'name')

    if host[0] == '/':
        db = mdb.connect(unix_socket=host, user=user, passwd=pw, db=name)
    else:
        db = mdb.connect(host, user, pw, name)

    c = db.cursor()
    c.execute("SELECT `value` FROM awfy_config WHERE `key` = 'version'")
    row = c.fetchone()
    version = int(row[0])

    path = config.get('general', 'path')

Startup()


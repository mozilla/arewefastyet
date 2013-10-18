# vim: set sts=4 ts=8 sw=4 tw=99 et:
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
import awfy

awfy.Startup()

c = awfy.db.cursor()
c.execute("show tables;")
tables = set()
for row in c.fetchall():
    tables.add(row[0])

if not 'awfy_suite_test' in tables:
    c.execute("""
        create table if not exists `awfy_suite_test` (
            `id` int(10) unsigned not null auto_increment,
            `suite_id` int(11) not null,
            `name` varchar(128) not null,
            primary key(`id`),
            unique key `suite_id` (`suite_id`, `name`)
        ) ENGINE=MyISAM DEFAULT CHARSET=latin1 AUTO_INCREMENT=1;
    """)

awfy_breakdown_columns = set()
c.execute("show columns from awfy_breakdown")
for row in c.fetchall():
    awfy_breakdown_columns.add(row[0])

if 'test_id' not in awfy_breakdown_columns:
    print('Creating new column on awfy_breakdown_columns...')
    c.execute("alter table `awfy_breakdown` add `test_id` int unsigned not null")

if 'test' in awfy_breakdown_columns:
    print('Finding tests...')
    
    suite_map = {}
    c.execute("select distinct suite_id, test from awfy_breakdown where test is not null")
    for row in c.fetchall():
        suite_id = row[0]
        test_name = row[1]
        if suite_id not in suite_map:
            suite_map[suite_id] = {}
        test_map = suite_map[suite_id]
        c.execute("select id from awfy_suite_test where suite_id = %s and name = %s",
                  (suite_id, test_name))
        result = c.fetchone()
        if not result:
            c.execute("insert into awfy_suite_test (suite_id, name) values (%s, %s)",
                      (suite_id, test_name))
            test_id = c.lastrowid
        else:
            test_id = result[0]
        test_map[test_name] = test_id

    for suite_id in suite_map:
        test_map = suite_map[suite_id]
        for test_name in test_map:
            test_id = test_map[test_name]
            print('Updating columns for suite_id {0} test {1} to test_id {2}'.format(suite_id, test_name, test_id))
            c.execute("update awfy_breakdown set test_id = %s where suite_id = %s and test = %s",
                      (test_id, suite_id, test_name))

    print('Dropping old column test...')
    c.execute("alter table `awfy_breakdown` drop `test`")

if 'suite_id' in awfy_breakdown_columns:
    print('Dropping old column suite_id...')
    c.execute("alter table `awfy_breakdown` drop `suite_id`")

def try_add_index(table, column):
    try:
        c.execute("alter table `{0}` add index {1} ({2})".format(table, column, column))
    except:
        pass

try_add_index('awfy_breakdown', 'run_id')
try_add_index('awfy_breakdown', 'mode_id')
try_add_index('awfy_breakdown', 'test_id')
try_add_index('awfy_score', 'run_id')
try_add_index('awfy_score', 'mode_id')
try_add_index('awfy_score', 'suite_id')

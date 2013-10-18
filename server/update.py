# vim: set ts=4 sw=4 tw=99 et:
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

import os
import sys
import awfy
import data
import time
import util
import os.path
import datetime
import condenser, json
from profiler import Profiler
from builder import Builder

def timezone_offset():
    return 0

def export(name, j):
    path = os.path.join(awfy.path, name)
    if os.path.exists(path):
        os.remove(path)
    with open(path, 'w') as fp:
        util.json_dump(j, fp)
    print('Exported: ' + name)

def load_metadata(prefix):
    try:
        with open(os.path.join(awfy.path, 'metadata-' + prefix + '.json'), 'r') as fp:
            cache = util.json_load(fp)
    except:
        cache = { 'earliest_run_id': 0 }

    return cache

def save_metadata(prefix, data):
    with open(os.path.join(awfy.path, 'metadata-' + prefix + '.json'), 'w') as fp:
        util.json_dump(data, fp)

def delete_metadata(prefix, data):
    name = os.path.join(awfy.path, 'metadata-' + prefix + '.json')
    if os.path.exists(name):
        os.remove(name)

def fetch_test_scores(machine_id, suite_id, name, earliest_run_id):
    query = "SELECT r.id, r.stamp, b.cset, s.score, s.mode_id                       \
             FROM awfy_breakdown s                                                  \
             JOIN fast_run r ON s.run_id = r.id                                     \
             JOIN awfy_build b ON s.run_id = b.run_id                               \
             WHERE s.test_id = %s                                                   \
             AND r.status = 1                                                       \
             AND r.machine = %s                                                     \
             AND r.id > %s                                                          \
             ORDER BY r.stamp ASC                                                   \
             "
    c = awfy.db.cursor()
    c.execute(query, [name, machine_id, earliest_run_id])
    return c.fetchall()

def fetch_suite_scores(machine_id, suite_id, earliest_run_id):
    query = "SELECT r.id, r.stamp, b.cset, s.score, s.mode_id               \
             FROM awfy_score s                                              \
             JOIN fast_run r ON s.run_id = r.id                             \
             JOIN awfy_build b ON s.run_id = b.run_id                       \
             WHERE s.suite_id = %s                                          \
             AND r.id > %s                                                  \
             AND r.status = 1                                               \
             AND r.machine = %s                                             \
             ORDER BY r.stamp ASC                                           \
             "
    c = awfy.db.cursor()
    c.execute(query, [suite_id, earliest_run_id, machine_id])
    return c.fetchall()

def open_cache(suite, prefix):
    try:
        with open(os.path.join(awfy.path, prefix + '.json')) as fp:
            cache = util.json_load(fp)
            return cache['graph']
    except:
        return { 'timelist': [],
                 'lines': [],
                 'direction': suite.direction
               }

def save_cache(prefix, cache):
    j = { 'graph': cache,
          'version': awfy.version
        }
    with open(os.path.join(awfy.path, prefix + '.json'), 'w') as fp:
        util.json_dump(j, fp)

def update_cache(cx, suite, prefix, when, rows):
    # Sort everything into separate modes.
    modes = { }
    for row in rows:
        modeid = int(row[4])
        if not modeid in cx.modemap:
            continue

        if modeid in modes:
            line = modes[modeid]
        else:
            line = []
            modes[modeid] = line

        line.append(row)

    # Build our actual datasets.
    lines = [ ]
    builder = Builder()
    for modeid in modes:
        rows = modes[modeid]
        points = []
        for row in rows:
            score = float(row[3])
            if score:
                cset = row[2]
            else:
                cset = None
            builder.addPoint(points,
                             int(row[1]) - timezone_offset(),
                             cset,
                             None,
                             score)
        line = { 'modeid': modeid,
                 'data': points
               }
        lines.append(line)
    builder.prune()
    builder.finish(lines)

    # Open the old cache.
    cache = open_cache(suite, prefix)

    # Build a reverse mode mapping for the cache.
    cache_modes = { }
    for i, oldline in enumerate(cache['lines']):
        cache_modes[int(oldline['modeid'])] = oldline

    # Prune times which are before the last time in the cache.
    if len(cache['timelist']) and len(builder.timelist):
        last_time = cache['timelist'][-1]
        i = 0
        while i < len(builder.timelist) and builder.timelist[i] < last_time:
            i = i + 1
        if i:
            builder.timelist = builder.timelist[i:]
            for line in lines:
                line['data'] = line['data'][i:]


    # For any of our lines that are not in the cache, prepend null points so
    # the line width matches the existing lines.
    for line in lines:
        if line['modeid'] in cache_modes:
            continue

        data = { 'data': [None] * len(cache['timelist']),
                 'modeid': line['modeid']
               }
        cache['lines'].append(data)
        cache_modes[line['modeid']] = data

    # Now we can merge our data into the existing graph.
    for line in lines:
        oldline = cache_modes[line['modeid']]
        oldline['data'].extend(line['data'])

    # For any lines which are in the cache, but not in our pulled data, extend
    # them to have null datapoints for our timelist.
    for oldline in cache['lines']:
        modeid = int(oldline['modeid'])
        if modeid in modes:
            continue
        oldline['data'].extend([None] * len(builder.timelist))

    # Finally we can extend the cache timelist.
    cache['timelist'].extend(builder.timelist)

    # Sanity check.
    for line in cache['lines']:
        if len(line['data']) != len(cache['timelist']):
            print(str(len(line['data'])) + ' != ' + str(len(cache['timelist'])))
            raise Exception('computed datapoints wrong')

    # Now save the results.
    save_cache(prefix, cache)

def perform_update(cx, machine, suite, prefix, fetch):
    # Fetch the actual data.
    metadata = load_metadata(prefix)
    earliest_run_id = metadata['earliest_run_id']

    sys.stdout.write('Querying ' + prefix + '... ')
    sys.stdout.flush()
    with Profiler() as p:
        rows = fetch(machine, earliest_run_id)
        diff = p.time()
    new_rows = len(rows)
    print('found ' + str(new_rows) + ' new rows in ' + diff)

    # Break everything into months.
    year = 0
    month = 0
    current = []
    months = []
    for row in rows:
        stamp = int(row[1]) - timezone_offset()
        t = time.gmtime(stamp)
        if t.tm_year != year or t.tm_mon != month:
            if year and len(current):
                months.append(((year, month), current))
            current = []
            year = t.tm_year
            month = t.tm_mon

        current.append(row)

    if len(current):
        months.append(((year, month), current))

    for when, data in months:
        name = prefix + '-' + str(when[0]) + '-' + str(when[1])

        sys.stdout.write('Updating cache for ' + name + '...')
        sys.stdout.flush()
        with Profiler() as p:
            update_cache(cx, suite, name, when, data)
            diff = p.time()
        print('took ' + diff)

    if len(rows):
        earliest_run_id = rows[-1][0]
    else:
        # Find the latest runid for this machine, so we can avoid querying the
        # entire database every time if this benchmark is never run.
        c = awfy.db.cursor()
        c.execute("""
                  select r.id from fast_run r
                  where
                   r.machine = %s and
                   r.status = 1
                  order by r.id desc
                  limit 1""",
                  (machine.id))
        rows = c.fetchall()
        if rows:
            earliest_run_id = rows[0][0]
        else:
            earliest_run_id = 0

    metadata['earliest_run_id'] = earliest_run_id
    save_metadata(prefix, metadata)

    return new_rows
# Done

def update(cx, machine, suite):
    def fetch_aggregate(machine, earliest_run_id):
        return fetch_suite_scores(machine.id, suite.id, earliest_run_id)

    prefix = 'raw-' + suite.name + '-' + str(machine.id)
    new_rows = perform_update(cx, machine, suite, prefix, fetch_aggregate)

    # This is a little cheeky, but as an optimization we don't bother querying
    # subtests if we didn't find new rows.
    if not new_rows:
        return

    for test_id, test_name in suite.tests:
        def fetch_test(machine, earliest_run_id):
            return fetch_test_scores(machine.id, suite.id, test_id, earliest_run_id)

        prefix = 'bk-raw-' + suite.name + '-' + test_name + '-' + str(machine.id)
        perform_update(cx, machine, suite, prefix, fetch_test)

def export_master(cx):
    j = { "version": awfy.version,
          "modes": cx.exportModes(),
          "vendors": cx.exportVendors(),
          "machines": cx.exportMachines(),
          "suites": cx.exportSuites()
        }

    text = "var AWFYMaster = " + json.dumps(j) + ";\n"

    path = os.path.join(awfy.path, 'master.js')
    if os.path.exists(path):
        os.remove(path)
    with open(path, 'w') as fp:
        fp.write(text)

def update_all(cx):
    for machine in cx.machines:
        # Don't try to update machines that we're no longer tracking.
        if machine.active == 2:
            continue

        for benchmark in cx.benchmarks:
            update(cx, machine, benchmark)

def main(argv):
    sys.stdout.write('Computing master properties... ')
    sys.stdout.flush()
    with Profiler() as p:
        cx = data.Context()
        diff = p.time()
    print('took ' + diff)

    update_all(cx)
    condenser.condense_all(cx)
    export_master(cx)

if __name__ == '__main__':
    main(sys.argv[1:])


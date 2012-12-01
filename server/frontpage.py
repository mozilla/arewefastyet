# vim: set ts=4 sw=4 tw=99 et:
import os
import sys
import awfy
import data
import json
import time
import os.path
import datetime

# Increment is currently 1 day.
TimeIncrement = 60 * 60 * 24

def export(name, j):
    path = os.path.join(awfy.path, name)
    if os.path.exists(path):
        os.remove(path)
    with open(path, 'w') as fp:
        json.dump(j, fp)
    print('Exported: ' + name)

# Takes an existing dataset and condenses the historical slice of it such that
# the number of historical points is not more than recent points.
def condense_aggregate(lines, timelist, historical):
    recent = len(timelist) - historical

    for line in lines:
        line['newdata'] = []

    newtimelist = []

    # We want to take the N historical points and condense them into 
    # R slices, where R is the number of recent points.
    increment = historical // recent
    pos = 0
    while pos < historical:
        limit = min(pos + increment, historical)
        for line in lines:
            data = line['data']
            newdata = line['newdata']

            average = 0.0
            count = 0
            firstCset = None
            lastCset = None
            for point in data[pos:limit]:
                if not point or not point['first']:
                    continue
                if not firstCset:
                    firstCset = point['first']
                lastCset = point['last']
                average = ((average * count) + point['score']) / (count + 1)
                count += 1
            point = { 'first': firstCset,
                      'last': lastCset,
                      'score': average
                    }
            newdata.append(point)
        newtimelist.append(timelist[pos])

        pos += increment

    # Fix up the old lines.
    for line in lines:
        data = line['data']
        newdata = line['newdata']
        newdata.extend(data[historical:])
        line['data'] = newdata
        del line['newdata']

    for t in timelist[historical:]:
        newtimelist.append(t)

    return lines, newtimelist

# The aggregate view attempts to coalesce all runs from a 24-hour period into
# one data point, by taking an average of all non-zero scores in that run. In
# order to ensure that each line has the same x-axis points, we take the
# earliest date available, round it to a week, and then build a data point for
# each week.
def aggregate(builder, runs, rows):
    # Convert the time to UTC.
    earliest = int(rows[0][0]) - time.timezone

    # Rewind to the beginning of the day.
    earliest -= earliest % TimeIncrement

    pos = 0
    points = []
    while earliest < runs.earliest:
        average = 0.0
        count = 0
        firstCset = None
        lastCset = None
        stop = False
        for i in range(pos, len(rows)):
            row = rows[i]
            t = int(row[0]) - time.timezone
            if t >= earliest + TimeIncrement:
                break
            if t >= runs.earliest:
                stop = True
                break

            # If we get a 0 score, we discount it.
            score = float(row[2])
            if not score:
                continue

            if not firstCset:
                firstCset = row[1]
            lastCset = row[1]

            average = ((average * count) + score) / (count + 1)
            count += 1

        if not count and stop:
            break

        # Note that first/lastCset may be None, if no points were available.
        builder.addPoint(points, earliest, firstCset, lastCset, average)

        if stop:
            break

        earliest += TimeIncrement
        pos = i + 1

    # Add in the fixed data points left over.
    for i in range(pos, len(rows)):
        row = rows[i]
        if not runs.contains(row[3]):
            continue

        score = float(row[2])
        if score:
            cset = row[1]
        else:
            cset = None
        builder.addPoint(points,
                         int(row[0]) - time.timezone,
                         cset,
                         None,
                         score)

    return points

def fetch_test_scores(suite_id, name, machine_id, mode_id):
    query = "SELECT r.stamp, b.cset, s.score, r.id                                  \
             FROM awfy_breakdown s                                                  \
             JOIN awfy_mode m ON m.id = s.mode_id                                   \
             JOIN fast_run r ON s.run_id = r.id                                     \
             JOIN awfy_build b ON (s.run_id = b.run_id AND s.mode_id = b.mode_id)   \
             WHERE s.suite_id = %s                                                  \
             AND s.test = %s                                                        \
             AND r.status = 1                                                       \
             AND r.machine = %s                                                     \
             AND m.id = %s                                                          \
             ORDER BY r.stamp ASC                                                   \
             "
    with Profiler('Queried scores test=' + name + ', machine=' + str(machine_id) + \
                  ', mode=' + str(mode_id)):
        c = awfy.db.cursor()
        c.execute(query, [suite_id, name, machine_id, mode_id])
        return c.fetchall()

def fetch_all_scores(suite_id, machine_id, mode_id):
    query = "SELECT r.stamp, b.cset, s.score, r.id                                  \
             FROM awfy_score s                                                      \
             JOIN awfy_mode m ON m.id = s.mode_id                                   \
             JOIN fast_run r ON s.run_id = r.id                                     \
             JOIN awfy_build b ON (s.run_id = b.run_id AND s.mode_id = b.mode_id)   \
             WHERE s.suite_id = %s                                                  \
             AND r.status = 1                                                       \
             AND r.machine = %s                                                     \
             AND m.id = %s                                                          \
             ORDER BY r.stamp ASC                                                   \
             "
    with Profiler('Queried scores suite=' + str(suite_id) + ', machine=' + str(machine_id) + \
                  ', mode=' + str(mode_id)):
        c = awfy.db.cursor()
        c.execute(query, [suite_id, machine_id, mode_id])
        return c.fetchall()

def fetch_and_aggregate(cx, runs, machine, fetch):
    lines = []
    builder = Builder()

    for mode in cx.modes:
        rows = fetch(machine, mode.id)
        if not len(rows):
            continue
        points = aggregate(builder, runs, rows)
        line = { 'modeid': mode.id,
                 'data': points
               }
        lines.append(line)

    builder.prune()
    builder.finish(lines)

    # Still not done. If we have more historical points than we do latest
    # points, the graph will become biased toward the historical side. To
    # prevent this, we condense further, which is now much easier. First,
    # find the number of historical points.
    for i, t in enumerate(builder.timelist):
        if t >= runs.earliest:
            break

    historical = i
    if historical > len(builder.timelist) - historical:
        return condense_aggregate(lines, builder.timelist, historical)

    # Now, we export the timelist and timemap.
    return lines, builder.timelist

def condense_all_days(builder, rows):
    # Convert the time to UTC.
    earliest = int(rows[0][0]) - time.timezone

    # Rewind to the beginning of the day.
    earliest -= earliest % TimeIncrement

    pos = 0
    points = []
    while pos < len(rows):
        average = 0.0
        count = 0
        first = None
        last = None

        for i in range(pos, len(rows)):
            row = rows[i]
            t = int(row[0]) - time.timezone
            if t >= earliest + TimeIncrement:
                break

            # Discount 0 scores.
            score = float(row[2])
            if not score:
                continue

            if not first:
                first = row[1]
            last = row[1]

            average = ((average * count) + score) / (count + 1)
            count += 1

        builder.addPoint(points, earliest, first, last, average)

        earliest += TimeIncrement
        pos = i + 1

    return points

# Take a dataset and split it into an array of smaller datasets, grouped by month.
def split_by_month(builder, lines):
    # Figure out which ranges in the timelist correspond to distinct months.
    ranges = []
    first_index = 0
    first = time.gmtime(builder.timelist[first_index])
    for i, t in enumerate(builder.timelist):
        s = time.gmtime(t)
        if s.tm_year != first.tm_year or s.tm_mon != first.tm_mon:
            ranges.append([first_index, i])
            first_index = i
            first = s
    if first_index != i:
        ranges.append([first_index, i])

    months = []
    for r in ranges:
        start = r[0]
        end = r[1]
        timelist = builder.timelist[start:end]
        newlines = []
        for line in lines:
            newline = { }
            newline['modeid'] = line['modeid']
            newline['data'] = line['data'][start:end]
            newlines.append(newline)
        month = { 'timelist': timelist,
                  'lines': newlines
                }
        months.append(month)
    return months

def condense_months(resultsets):
    lines = []
    builder = Builder()

    for results in resultsets:
        rows = results['rows']
        if not len(rows):
            continue
        points = condense_all_days(builder, rows)
        line = { 'modeid': results['mode'].id,
                 'data': points
               }
        lines.append(line)

    builder.prune()
    builder.finish(lines)

    return split_by_month(builder, lines)

def dump_months(resultsets):
    lines = []
    builder = Builder()

    for results in resultsets:
        rows = results['rows']
        if not len(rows):
            continue

        points = []
        for row in rows:
            score = float(row[2])
            if score:
                cset = row[1]
            else:
                cset = None
            builder.addPoint(points,
                             int(row[0]) - time.timezone,
                             cset,
                             None,
                             score)
        line = { 'modeid': results['mode'].id,
                 'data': points
               }
        lines.append(line)

    builder.prune()
    builder.finish(lines)

    return split_by_month(builder, lines)

def export_months(cx, machine, suites):
    for suite in suites:
        resultsets = [ ]
        for mode in cx.modes:
            rows = fetch_all_scores(suite.suite_id, machine, mode.id)
            resultsets.append({ 'mode': mode,
                                'rows': rows
                              })

        months = dump_months(resultsets)
        for month in months:
            j = { 'version': awfy.version,
                  'graph': month
                }
            s = time.gmtime(month['timelist'][0])
            fname = 'raw-' + suite.name + '-' + str(s.tm_year) + '-' + str(s.tm_mon) + '-' + \
                    str(machine) + '.json'
            export(fname, j)

        months = condense_months(resultsets)
        for month in months:
            j = { 'version': awfy.version,
                  'graph': month
                }
            s = time.gmtime(month['timelist'][0])
            fname = 'aggregate-' + suite.name + '-' + str(s.tm_year) + '-' + str(s.tm_mon) + '-' + \
                    str(machine) + '.json'
            export(fname, j)

        for test in suite.tests:
            resultsets = [ ]
            for mode in cx.modes:
                rows = fetch_test_scores(suite.suite_id, test, machine, mode.id)
                resultsets.append({ 'mode': mode,
                                    'rows': rows
                                  })

            months = dump_months(resultsets)
            for month in months:
                j = { 'version': awfy.version,
                      'graph': month
                    }
                s = time.gmtime(month['timelist'][0])
                fname = 'bk-raw-' + suite.name + '-' + test + '-' + str(s.tm_year) + '-' + \
                        str(s.tm_mon) + '-' + str(machine) + '.json'
                export(fname, j)

            months = condense_months(resultsets)
            for month in months:
                j = { 'version': awfy.version,
                      'graph': month
                    }
                s = time.gmtime(month['timelist'][0])
                fname = 'bk-condensed-' + suite.name + '-' + test + '-' + str(s.tm_year) + '-' + \
                        str(s.tm_mon) + '-' + str(machine) + '.json'
                export(fname, j)


def export_aggregate_suites(cx, machine, suites):
    graphs = { }
    runs = data.Runs(machine)
    for suite in suites:
        def fetch(machine_id, mode_id):
            return fetch_all_scores(suite.suite_id, machine_id, mode_id)

        graph = { }
        lines, timelist = fetch_and_aggregate(cx, runs, machine, fetch)
        graph['lines'] = lines
        graph['direction'] = suite.direction
        graph['timelist'] = timelist
        graph['aggregate'] = True
        graph['earliest'] = runs.earliest
        graphs[suite.name] = graph

    # Now build ye old json.
    j = { "version": awfy.version,
          "graphs": graphs
        }

    export('aggregate-' + str(machine) + '.json', j)

    # Now export indiviudal test aggregate graphs.
    for suite in suites:
        for test in suite.tests:
            def fetch(machine_id, mode_id):
                return fetch_test_scores(suite.suite_id, test, machine_id, mode_id)

            graph = { }
            lines, timelist = fetch_and_aggregate(cx, runs, machine, fetch)
            graph['lines'] = lines
            graph['direction'] = suite.direction
            graph['timelist'] = timelist
            graph['aggregate'] = True

            j = { 'version': awfy.version,
                  'graph': graph
                }

            name = 'bk-aggregate-' + suite.name + '-' + test + '-' + str(machine) + '.json'
            export(name, j)
# End export_aggregate_suites

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

def main(argv):
    print('Computing master properties...')
    cx = data.Context()

    suites = [ ]
    for benchmark in cx.benchmarks:
        if benchmark.name == 'v8' or benchmark.name == 'misc':
            continue
        suites.append(benchmark)

    for machine in cx.machines:
        export_months(cx, machine.id, suites)
        export_aggregate_suites(cx, machine.id, suites)

    export_master(cx)

if __name__ == '__main__':
    main(sys.argv[1:])


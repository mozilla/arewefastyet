# vim: set ts=4 sw=4 tw=99 et:
import os
import sys
import awfy
import data
import json
import time
import os.path

Machines = [8, 9, 10, 11, 12]

# Increment is currently 1 day.
TimeIncrement = 60 * 60 * 24

def condense(lines, timelist, timemap, historical):
    recent = len(timelist) - historical

    for line in lines:
        line['newdata'] = []

    newtimelist = []
    newtimemap = {}

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
        newtimemap[timelist[pos]] = len(newtimelist)
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
        newtimemap[t] = len(newtimelist)
        newtimelist.append(t)

    return lines, newtimelist, newtimemap

# The aggregate view attempts to coalesce all runs from a 24-hour period into
# one data point, by taking an average of all non-zero scores in that run. In
# order to ensure that each line has the same x-axis points, we take the
# earliest date available, round it to a week, and then build a data point for
# each week.
def aggregate(runs, rows):
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
        for i in range(pos, len(rows)):
            row = rows[i]
            t = int(row[0]) - time.timezone
            if t > earliest + TimeIncrement:
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

        # Note that first/lastCset may be None, if no points were available.
        point = { 'time': earliest,
                  'first': firstCset,
                  'last': lastCset,
                  'score': average
                }
        points.append(point)

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
        point = { 'time': int(row[0]) - time.timezone,
                  'first': cset,
                  'score': score
                }
        points.append(point)

    return points

def aggregate_suite(cx, runs, machine, suite):
    lines = [ ]
    timemap = { }

    for mode in cx.modes:
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
        c = awfy.db.cursor()
        c.execute(query, [suite.suite_id, machine, mode.id])
        rows = c.fetchall()
        if not len(rows):
            continue
        points = aggregate(runs, rows)
        for point in points:
            if not point['time'] in timemap:
                timemap[point['time']] = [points, point]
            else:
                timemap[point['time']].append([points, point])
        line = { 'modeid': mode.id,
                 'data': points
               }
        lines.append(line)

    # Remove any time slice that has no corresponding datapoints.
    for key in timemap:
        empty = True
        points = timemap[key]
        for L in points:
            point = L[1]
            if point['first']:
                empty = False
                break
        if empty:
            for L in points:
                L[0].remove(L[1])
            del timemap[key]

    # Build a sorted list of all time values, then provide a mapping from
    # time values back to indexes into this list.
    timelist = sorted(timemap.keys())
    for i, t in enumerate(timelist):
        timemap[t] = i

    # Now we have a canonical list of time points across all lines. Build
    # a new point list for each line, such that all lines have the same
    # list of points.
    for i, line in enumerate(lines):
        # Prefill, so each slot in the line has one point.
        newlist = [None] * len(timelist)
        for point in line['data']:
            index = timemap[point['time']]
            del point['time']
            newlist[index] = point

        line['data'] = newlist

    # Still not done. If we have more historical points than we do latest
    # points, the graph will become biased toward the historical side. To
    # prevent this, we condense further, which is now much easier. First,
    # find the number of historical points.
    for i, t in enumerate(timelist):
        if t >= runs.earliest:
            break

    historical = i
    if historical > len(timelist) - historical:
        return condense(lines, timelist, timemap, historical)

    # Now, we export the timelist and timemap.
    return lines, timelist, timemap


def export_aggregate_suites(cx, machine, suites):
    graphs = { }
    runs = data.Runs(machine)
    for suite in suites:
        graph = { }
        lines, timelist, timemap = aggregate_suite(cx, runs, machine, suite)
        graph['lines'] = lines
        graph['direction'] = suite.direction
        graph['timelist'] = timelist
        graph['timemap'] = timemap
        graph['aggregate'] = True
        graph['earliest'] = runs.earliest
        graphs[suite.name] = graph

    # Now build ye old json.
    j = { "version": awfy.version,
          "graphs": graphs
        }

    path = os.path.join(awfy.path, 'aggregate-' + str(machine) + '.json')
    if os.path.exists(path):
        os.remove(path)
    with open(path, 'w') as fp:
        json.dump(j, fp)

def export_master(cx):
    j = { "version": awfy.version,
          "modes": cx.exportModes(),
          "vendors": cx.exportVendors()
        }

    text = "var AWFYMaster = " + json.dumps(j) + ";\n"

    path = os.path.join(awfy.path, 'master.js')
    if os.path.exists(path):
        os.remove(path)
    with open(path, 'w') as fp:
        fp.write(text)

def main(argv):
    cx = data.Context()

    suites = [ ]
    for benchmark in cx.benchmarks:
        if benchmark.name == 'v8' or benchmark.name == 'misc':
            continue
        suites.append(benchmark)

    for machine in Machines:
        export_aggregate_suites(cx, machine, suites)

    export_master(cx)

if __name__ == '__main__':
    main(sys.argv[1:])


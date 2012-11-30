# vim: set ts=4 sw=4 tw=99 et:
import os
import sys
import awfy
import data
import json
import time
import os.path

# Increment is currently 1 day.
TimeIncrement = 60 * 60 * 24

# This class does some dirty work in unifying the structure of the graph.
class Builder:
    def __init__(self):
        self.lines = []
        self.timemap = {}

    def addPoint(self, points, time, first, last, score):
        point = { 'time': time,
                  'first': first,
                  'score': score
                }
        if last:
            point['last'] = last
        if not time in self.timemap:
            self.timemap[time] = [[points, point]]
        else:
            self.timemap[time].append([points, point])
        points.append(point)

    # Remove any time slice that has no corresponding datapoints.
    def prune(self):
        empties = []
        for key in self.timemap:
            empty = True
            points = self.timemap[key]
            for L in points:
                point = L[1]
                if point['first']:
                    empty = False
                    break
            if empty:
                for L in points:
                    L[0].remove(L[1])
                empties.append(key)
        for key in empties:
            del self.timemap[key]

    def finish(self, lines):
        # Build a sorted list of all time values, then provide a mapping from
        # time values back to indexes into this list.
        self.timelist = sorted(self.timemap.keys())
        for i, t in enumerate(self.timelist):
            self.timemap[t] = i

        # Now we have a canonical list of time points across all lines. Build
        # a new point list for each line, such that all lines have the same
        # list of points.
        for i, line in enumerate(lines):
            # Prefill, so each slot in the line has one point.
            newlist = [None] * len(self.timelist)
            for point in line['data']:
                index = self.timemap[point['time']]
                del point['time']
                newlist[index] = point

            line['data'] = newlist
        return
# end class Builder


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
            if t > earliest + TimeIncrement:
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
    c = awfy.db.cursor()
    c.execute(query, [suite_id, machine_id, mode_id])
    return c.fetchall()

def aggregate_suite(cx, runs, machine, suite):
    lines = []
    builder = Builder()

    for mode in cx.modes:
        rows = fetch_all_scores(suite.suite_id, machine, mode.id)
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

def export_aggregate_suites(cx, machine, suites):
    graphs = { }
    runs = data.Runs(machine)
    for suite in suites:
        graph = { }
        lines, timelist = aggregate_suite(cx, runs, machine, suite)
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

    path = os.path.join(awfy.path, 'aggregate-' + str(machine) + '.json')
    if os.path.exists(path):
        os.remove(path)
    with open(path, 'w') as fp:
        json.dump(j, fp)

def export_master(cx):
    j = { "version": awfy.version,
          "modes": cx.exportModes(),
          "vendors": cx.exportVendors(),
          "machines": cx.exportMachines()
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

    for machine in cx.machines:
        export_aggregate_suites(cx, machine.id, suites)

    export_master(cx)

if __name__ == '__main__':
    main(sys.argv[1:])


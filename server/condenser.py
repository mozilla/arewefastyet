# vim: set ts=4 sw=4 tw=99 et:
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

import re
import os
import sys
import awfy, util
import math
from profiler import Profiler
from datetime import datetime
import glob

SecondsPerDay = 60 * 60 * 24
MaxRecentRuns = 30

class FolderChanger:
    def __init__(self, folder):
        self.old = os.getcwd()
        self.new = folder

    def __enter__(self):
        os.chdir(self.new)

    def __exit__(self, type, value, traceback):
        os.chdir(self.old)

def export(name, j):
    path = os.path.join(awfy.path, name)
    if os.path.exists(path):
        os.remove(path)
    with open(path, 'w') as fp:
        util.json_dump(j, fp)

def find_all_months(cx, prefix, name):
    pattern = prefix + 'raw-' + name + '-*-*.json'
    re_pattern = prefix + 'raw-' + name + '-(\d\d\d\d)-(\d+)\.json'

    with FolderChanger(awfy.path):
        files = []
        for file in glob.glob(pattern):
            m = re.match(re_pattern, file)
            if not m:
                continue

            year = int(m.group(1))
            month = int(m.group(2))
            files.append(((year, month), file))

    files = sorted(files, key=lambda key: key[0][0] * 12 + key[0][1])
    return files

def retrieve_graphs(cx, files):
    graphs = []
    for when, file in files:
        graphs.append((when, retrieve_graph(cx, file)))
    return graphs

def retrieve_graph(cx, file):
    with open(os.path.join(awfy.path, file)) as fp:
        cache = util.json_load(fp)
    return cache['graph']

# Take a timelist and split it into lists of which times correspond to days.
def split_into_days(timelist):
    if not len(timelist):
        return []

    days = []

    first = None
    earliest = timelist[0]
    for i, t in enumerate(timelist):
        if t >= earliest + SecondsPerDay:
            days.append((first, i))
        first = i
    days.append((first, i))

    return days

# Aggregate the datapoints in a graph into the supplied regions. Line ordering
# stays the same.
def condense_graph(graph, regions):
    # Prefill the new graph.
    new_graph = { 'direction': graph['direction'],
                  'timelist': [],
                  'lines': []
                }

    for line in graph['lines']:
        points = []
        for start, end in regions:
            total = 0
            count = 0
            first = None
            last = None
            suite_version = None
            id = None
            for i in range(start, end):
                p = line['data'][i]
                if not p or not p[0]:
                    continue
                total += p[0]
                count += 1
                if not first:
                    first = p[1]
                last = p[1]
                suite_version = p[3]
                id = p[4]
            if count == 0:
                avg = 0
            else:
                avg = total/count
            points.append([avg, first, last, suite_version, id if count is 1 else None])

        newline = { 'modeid': line['modeid'],
                    'data': points
                  }
        new_graph['lines'].append(newline)

    for start, end in regions:
        new_graph['timelist'].append(graph['timelist'][start])

    return new_graph

def condense_month(cx, graph, prefix, name):
    days = split_into_days(graph['timelist'])
    new_graph = condense_graph(graph, days)

    j = { 'version': awfy.version,
          'graph': new_graph
        }
    export(name + '.json', j)

def combine(graphs):
    combined = { 'lines': [],
                 'timelist': [],
                 'direction': graphs[0]['direction']
               }

    # Pre-fill modes.
    modes = { }
    for graph in graphs:
        for line in graph['lines']:
            if line['modeid'] in modes:
                continue
            obj = { 'modeid': line['modeid'],
                    'data': []
                  }
            modes[line['modeid']] = obj
            combined['lines'].append(obj)

    for graph in graphs:
        updated = { }
        for line in graph['lines']:
            newline = modes[line['modeid']]
            newline['data'].extend(line['data'])
            updated[line['modeid']] = True

        for mode in modes:
            if mode in updated:
                continue
            empty = [None] * len(graph['timelist'])
            modes[mode]['data'].extend(empty)

        combined['timelist'].extend(graph['timelist'])

    # Sanity check.
    for line in combined['lines']:
        if len(line['data']) != len(combined['timelist']):
            raise Exception('corrupt graph')

    return combined

def aggregate(cx, prefix, name):
    with Profiler() as p:
        sys.stdout.write('Aggregating ' + name + '... ')
        sys.stdout.flush()

        files = find_all_months(cx, prefix, name)
        graphs = retrieve_graphs(cx, files)
        graph = combine([graph for when, graph in graphs])

        graph['aggregate'] = True

        # If we don't have enough points for a historical view, we won't display
        # a historical view.
        if len(graph['timelist']) <= MaxRecentRuns:
            if len(graph['timelist']) == 0:
                graph['earliest'] = 0
            else:
                graph['earliest'] = graph['timelist'][0]
            return graph

        # Show MacRecentRuns of atleast one line.
        recentRuns = 0
        runs = []
        for i in range(len(graph['lines'])):
            runs.append(0)
        for i in range(len(graph['timelist'])-1, -1, -1):
            for j in range(len(graph['lines'])):
                if graph['lines'] and i < len(graph['lines'][j]["data"]) and graph['lines'][j]["data"][i]:
                    runs[j] += 1
            recentRuns += 1
            if max(runs) == MaxRecentRuns:
                break

        # If the number of historical points is <= the number of recent points,
        # then the graph is about split so we don't have to do anything.
        historical = len(graph['timelist']) - recentRuns
        if historical <= MaxRecentRuns:
            graph['earliest'] = graph['timelist'][historical]
            return graph

        # How big should each region be?
        region_length = float(historical) / MaxRecentRuns

        pos = 0
        regions = []
        for i in range(0, MaxRecentRuns):
            start = int(round(pos))

            end = min(int(math.floor(pos + region_length)), historical) - 1
            if end < start:
                end = start
            regions.append((start, end))
            pos += region_length

        new_graph = condense_graph(graph, regions)
        for i, line in enumerate(new_graph['lines']):
            oldline = graph['lines'][i]
            line['data'].extend(oldline['data'][historical:])
        new_graph['timelist'].extend(graph['timelist'][historical:])

        new_graph['earliest'] = graph['timelist'][historical]
        new_graph['aggregate'] = True

        # Sanity check.
        for line in new_graph['lines']:
            if len(line['data']) != len(new_graph['timelist']):
                raise Exception('corrupt graph')

        diff = p.time()
    print('took ' + diff)
    return new_graph

def file_is_newer(file1, file2):
    return os.path.getmtime(file1) >= os.path.getmtime(file2)

def condense(cx, prefix, name):
    with Profiler() as p:
        sys.stdout.write('Importing all datapoints for ' + name + '... ')
        sys.stdout.flush()

        files = find_all_months(cx, prefix, name)
        diff = p.time()

    print('took ' + diff)

    if not len(files):
        return False

    change = False

    for when, raw_file in files:
        condensed_name = prefix + 'condensed-' + name + '-' + str(when[0]) + '-' + str(when[1])
        condensed_file = condensed_name + '.json'

        # Only update the graph when condensed file is older.
        if os.path.exists(os.path.join(awfy.path, condensed_file)) and file_is_newer(os.path.join(awfy.path, condensed_file), os.path.join(awfy.path, raw_file)):
            continue

        # There was a datapoint added to one of the condensed files.
        change = True

        with Profiler() as p:
            sys.stdout.write('Condensing ' + condensed_name + '... ')
            sys.stdout.flush()

            graph = retrieve_graph(cx, raw_file)

            condense_month(cx, graph, prefix, condensed_name)
            diff = p.time()
        print(' took ' + diff)

    return change

def condense_suite(cx, machine, suite):
    name = suite.name + '-' + str(machine.id)
    prefix = ""
    if suite.visible == 2:
        prefix = "auth-"

    # Condense suite
    change = condense(cx, prefix, name)

    # Aggregate suite if needed.
    aggregated_file = prefix + 'aggregate-' + name + '.json'
    if change:
        j = {
            'version': awfy.version,
            'graph': aggregate(cx, prefix, name)
        }

        export(aggregated_file, j)

        # Note: only run the subtest condenser when suite was changed.
        for test_name in suite.tests:
            test_path = suite.name + '-' + test_name + '-' + str(machine.id)

            # Condense test
            change = condense(cx, prefix + 'bk-', test_path)

            # Aggregate suite if needed.
            if change:
                j = {
                    'version': awfy.version,
                    'graph': aggregate(cx, prefix + 'bk-', test_path)
                }
                export(prefix + 'bk-aggregate-' + test_path + '.json', j)

    if not os.path.exists(os.path.join(awfy.path, aggregated_file)):
        return None
    return retrieve_graph(cx, aggregated_file)


def condense_all(cx):
    for machine in cx.machines:
        # If a machine is set to no longer report scores, don't condense it.
        if machine.active == 2:
            continue

        aggregates = { }
        for suite in cx.benchmarks:
            if suite.name == 'v8':
                continue
            suite_aggregate = condense_suite(cx, machine, suite)
            if suite.name == 'misc':
                continue
            if suite.visible == 2:
                continue
            if suite_aggregate == None:
                continue
            aggregates[suite.name] = suite_aggregate

        j = {
            'version': awfy.version,
            'graphs': aggregates
        }

        export('aggregate-' + str(machine.id) + '.json', j)

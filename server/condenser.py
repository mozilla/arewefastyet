# vim: set ts=4 sw=4 tw=99 et:
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

import re
import os
import sys
import awfy
import json
from profiler import Profiler

SecondsPerDay = 60 * 60 * 24
MaxRecentRuns = 30

def export(name, j):
    path = os.path.join(awfy.path, name)
    if os.path.exists(path):
        os.remove(path)
    with open(path, 'w') as fp:
        json.dump(j, fp)

def find_all_months(cx, prefix, name):
    pattern = prefix + 'raw-' + name + '-(\d\d\d\d)-(\d+)\.json'

    files = []
    for file in os.listdir(awfy.path):
        m = re.match(pattern, file)
        if not m:
            continue

        year = int(m.group(1))
        month = int(m.group(2))
        files.append(((year, month), file))

    files = sorted(files, key=lambda key: key[0][0] * 12 + key[0][1])
    graphs = []
    for when, file in files:
        with open(os.path.join(awfy.path, file)) as fp:
            cache = json.load(fp)
        graphs.append((when, cache['graph']))

    return graphs

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
            average = 0
            count = 0
            first = None
            last = None
            for i in range(start, end):
                p = line['data'][i]
                if not p or not p[0]:
                    continue
                average = ((average * count) + p[0]) / (count + 1)
                count = count + 1
                if not first:
                    first = p[1]
                last = p[1]
            points.append([average, first, last])
                

        newline = { 'modeid': line['modeid'],
                    'data': points
                  }
        new_graph['lines'].append(newline)

    for start, end in regions:
        new_graph['timelist'].append(graph['timelist'][start])

    return new_graph

def condense_month(cx, suite, graph, prefix, name):
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

def aggregate(graph):
    graph['aggregate'] = True

    # If we don't have enough points for a historical view, we won't display
    # a historical view.
    if len(graph['timelist']) <= MaxRecentRuns:
        if len(graph['timelist']) == 0:
            graph['earliest'] = 0
        else:
            graph['earliest'] = graph['timelist'][0]
        return graph

    # If the number of historical points is <= the number of recent points,
    # then the graph is about split so we don't have to do anything.
    historical = len(graph['timelist']) - MaxRecentRuns
    if historical <= MaxRecentRuns:
        graph['earliest'] = graph['timelist'][historical]
        return graph

    # How big should each region be?
    region_length = float(historical) / MaxRecentRuns

    pos = 0
    regions = []
    for i in range(0, MaxRecentRuns):
        start = int(round(pos))

        j = start
        while j < pos + region_length and j < historical:
            j = j + 1
        regions.append((start, j))
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

    return new_graph

def condense(cx, suite, prefix, name):
    sys.stdout.write('Importing all datapoints for ' + name + '... ')
    sys.stdout.flush()
    with Profiler() as p:
        graphs = find_all_months(cx, prefix, name)
        diff = p.time()
    print('took ' + diff)

    if not len(graphs):
        return

    for when, graph in graphs:
        new_name = prefix + 'condensed-' + name + '-' + str(when[0]) + '-' + str(when[1])
        sys.stdout.write('Condensing ' + new_name + '... ')
        sys.stdout.flush()
        with Profiler() as p:
            condense_month(cx, suite, graph, prefix, new_name)
            diff = p.time()
        print(' took ' + diff)

    # Combine everything.
    sys.stdout.write('Aggregating ' + name + '... ')
    sys.stdout.flush()
    with Profiler() as p:
        combined = combine([graph for when, graph in graphs])
        summary = aggregate(combined)
        diff = p.time()
    print('took ' + diff)

    return summary

def condense_suite(cx, machine, suite):
    name = suite.name + '-' + str(machine.id)

    # We don't build individual aggregate json for each suite, so just pass
    # the combine graph back to our caller.
    suite_aggregate = condense(cx, suite, '', name)

    for test in suite.tests:
        test_name = suite.name + '-' + test + '-' + str(machine.id)
        test_aggregate = condense(cx, suite, 'bk-', test_name)
        j = { 'version': awfy.version,
              'graph': test_aggregate
            }
        export('bk-aggregate-' + test_name + '.json', j)

    return suite_aggregate

def condense_all(cx):
    for machine in cx.machines:
        aggregates = { }
        for suite in cx.benchmarks:
            if suite.name == 'v8':
                continue
            suite_aggregate = condense_suite(cx, machine, suite)
            if suite.name == 'misc':
                continue
            aggregates[suite.name] = suite_aggregate

        j = { 'version': awfy.version,
              'graphs': aggregates
            }
        export('aggregate-' + str(machine.id) + '.json', j)


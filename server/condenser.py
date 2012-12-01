# vim: set ts=4 sw=4 tw=99 et:
import re
import os
import sys
import awfy
import json
from profiler import Profiler

SecondsPerDay = 60 * 60 * 24

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

# Aggregate the datapoints in a graph into the supplied regions.
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
        new_graph['timelist'].append(start)

    return new_graph

def condense_month(cx, suite, graph, prefix, name):
    days = split_into_days(graph['timelist'])
    new_graph = condense_graph(graph, days)

    j = { 'version': awfy.version,
          'graph': new_graph
        }
    export(name + '.json', j)

def condense(cx, suite, prefix, name):
    sys.stdout.write('Importing all datapoints for ' + name + '... ')
    sys.stdout.flush()
    with Profiler() as p:
        graphs = find_all_months(cx, prefix, name)
        diff = p.time()
    print('took ' + diff)

    for when, graph in graphs:
        new_name = prefix + 'condensed-' + name + '-' + str(when[0]) + '-' + str(when[1])
        sys.stdout.write('Condensing ' + new_name + '... ')
        sys.stdout.flush()
        with Profiler() as p:
            condense_month(cx, suite, graph, prefix, new_name)
            diff = p.time()
        print(' took ' + diff)


def condense_suite(cx, machine, suite):
    name = suite.name + '-' + str(machine.id)
    condense(cx, suite, '', name)

    for test in suite.tests:
        name = suite.name + '-' + test + '-' + str(machine.id)
        condense(cx, suite, 'bk-', name)


def condense_all(cx):
    for machine in cx.machines:
        for suite in cx.benchmarks:
            if suite.name == 'v8':
                continue
            condense_suite(cx, machine, suite)


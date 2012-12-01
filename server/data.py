# vim: set ts=4 sw=4 tw=99 et:
import awfy
import time

class Benchmark(object):
    def __init__(self, suite_id, name, description, direction):
        self.id = suite_id
        self.name =  name
        self.description = description
        self.direction = direction

        # Get a list of individual tests
        self.tests = []
        c = awfy.db.cursor()
        c.execute("SELECT test FROM awfy_breakdown  \
                   WHERE suite_id = %s              \
                   GROUP BY test",
                   [suite_id])
        for row in c.fetchall():
            self.tests.append(row[0])

    def export(self):
        return { "id": self.id,
                 "name": self.name,
                 "description": self.description,
                 "direction": self.direction,
                 "tests": self.tests
               }

class Vendor(object):
    def __init__(self, id, name, vendor, url, browser):
        self.id = id
        self.name = name
        self.vendor = vendor
        self.url = url
        self.browser = browser

class Machine(object):
    def __init__(self, id, os, cpu, description):
        self.id = id
        self.os = os
        self.cpu = cpu
        self.description = description

    def export(self):
        return { "id": self.id,
                 "os": self.os,
                 "cpu": self.cpu,
                 "description": self.description
               }

class Mode(object):
    def __init__(self, id, vendor, mode, name, color, level):
        self.id = id
        self.vendor_id = vendor
        self.mode = mode
        self.name = name
        self.color = color
        self.level = level

class Runs(object):
    def __init__(self, machine_id):
        self.runs = []
        self.map_ = {}
        c = awfy.db.cursor()
        c.execute("SELECT fr.id, fr.stamp                   \
                   FROM fast_run fr                         \
                   JOIN awfy_score a ON fr.id = a.run_id    \
                   WHERE fr.machine = %s                    \
                   AND fr.status <> 0                       \
                   GROUP BY fr.id                           \
                   ORDER BY fr.stamp DESC                   \
                   LIMIT 30", [machine_id])
        for row in c.fetchall():
            t = (row[0], row[1])
            self.map_[row[0]] = len(self.runs)
            self.runs.append(t)

        self.earliest = int(self.runs[-1][1]) - time.timezone

    def slot(self, run_id):
        return self.map_[run_id]

    def length(self):
        return len(self.runs)

    def contains(self, run_id):
        return run_id in self.map_

    def export(self):
        list = []
        for run in self.runs:
            t = run[1] - time.timezone
            list.append(t)
        return list

class Context(object):
    def __init__(self):
        # Get a list of vendors, and map vendor IDs -> vendor info
        self.vendors = []

        c = awfy.db.cursor()
        c.execute("SELECT id, name, vendor, csetURL, browser FROM awfy_vendor")
        for row in c.fetchall():
            v = Vendor(row[0], row[1], row[2], row[3], row[4])
            self.vendors.append(v)

        # Get a list of modes, and a reverse mapping from DB ids.
        self.modes = []
        self.modemap = { }
        c.execute("SELECT id, vendor_id, mode, name, color, level FROM awfy_mode WHERE level <= 10")
        for row in c.fetchall():
            m = Mode(row[0], row[1], row[2], row[3], row[4], row[5])
            self.modemap[int(row[0])] = m
            self.modes.append(m)

        # Get a list of benchmark suites.
        self.benchmarks = []
        c.execute("SELECT id, name, description, better_direction FROM awfy_suite")
        for row in c.fetchall():
            b = Benchmark(row[0], row[1], row[2], row[3])
            self.benchmarks.append(b)

        # Get a list of machines.
        self.machines = []
        c.execute("SELECT id, os, cpu, description FROM awfy_machine WHERE active = 1")
        for row in c.fetchall():
            m = Machine(row[0], row[1], row[2], row[3])
            self.machines.append(m)

    def exportModes(self):
        o = { }
        for mode in self.modes:
            o[mode.id] = { "vendor_id": mode.vendor_id,
                           "mode": mode.mode,
                           "name": mode.name,
                           "color": mode.color
                         }
        return o

    def exportVendors(self):
        o = { }
        for vendor in self.vendors:
            o[vendor.id] = { "name": vendor.name,
                             "url": vendor.url,
                             "browser": vendor.browser
                           }
        return o

    def exportMachines(self):
        o = { }
        for machine in self.machines:
            o[machine.id] = machine.export()
        return o

    def exportSuites(self):
        o = { }
        for b in self.benchmarks:
            o[b.id] = b.export()
        return o


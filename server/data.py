# vim: set ts=4 sw=4 tw=99 et:
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

import awfy
import time

class Benchmark(object):
    def __init__(self, suite_id, name, description, direction, sort_order):
        self.id = suite_id
        self.name =  name
        self.description = description
        self.direction = direction
        self.sort_order = sort_order

        # Get a list of individual tests
        self.tests = []
        c = awfy.db.cursor()
        c.execute("SELECT t.name                                                          \
                   FROM awfy_suite_test t                                                 \
                   JOIN awfy_suite_version v ON v.id = t.suite_version_id                 \
                   WHERE suite_id = %s                                                    \
                   AND visible = 1                                                        \
                   GROUP BY t.name", (suite_id,))
        for row in c.fetchall():
            self.tests.append(row[0])

    def export(self):
        return { "id": self.id,
                 "name": self.name,
                 "description": self.description,
                 "direction": self.direction,
                 "tests": self.tests,
                 "sort_order": self.sort_order
               }

class Vendor(object):
    def __init__(self, id, name, vendor, url, browser, rangeURL):
        self.id = id
        self.name = name
        self.vendor = vendor
        self.url = url
        self.browser = browser
        self.rangeURL = rangeURL

class Machine(object):
    def __init__(self, id, os, cpu, description, active, frontpage, pushed_separate, message):
        self.id = id
        self.os = os
        self.cpu = cpu
        self.description = description
        self.active = active
        self.frontpage = frontpage
        self.pushed_separate = pushed_separate
        self.message = message

        self.suites = []
        c = awfy.db.cursor()
        c.execute("SELECT DISTINCT(suite_version_id) FROM awfy_run                        \
                   JOIN `awfy_build` ON awfy_run.id = run_id                              \
                   JOIN `awfy_score` ON awfy_build.id = build_id                          \
                   WHERE machine = %s", (id,))
        ids = [str(row[0]) for row in c.fetchall()]
	if len(ids) > 0:
                c.execute("SELECT DISTINCT(awfy_suite.name) FROM awfy_suite                       \
                           JOIN `awfy_suite_version` ON suite_id = awfy_suite.id                  \
                           WHERE awfy_suite_version.id in ("+(",".join(ids))+")")
                for row in c.fetchall():
                    self.suites.append(row[0])

    def export(self):
        return { "id": self.id,
                 "os": self.os,
                 "cpu": self.cpu,
                 "description": self.description,
                 "frontpage": self.frontpage,
                 "pushed_separate": self.pushed_separate,
                 "message": self.message,
                 "suites": self.suites
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
        c.execute("SELECT ar.id, ar.stamp                   \
                   FROM awfy_run ar                         \
                   JOIN awfy_score a ON ar.id = a.run_id    \
                   WHERE ar.machine = %s                    \
                   AND ar.status <> 0                       \
                   GROUP BY ar.id                           \
                   ORDER BY ar.stamp DESC                   \
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
        c.execute("SELECT id, name, vendor, csetURL, browser, rangeURL FROM awfy_vendor")
        for row in c.fetchall():
            v = Vendor(row[0], row[1], row[2], row[3], row[4], row[5])
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
        self.suitemap = {}
        self.benchmarks = []
        c.execute("SELECT id, name, description, better_direction, sort_order FROM awfy_suite WHERE sort_order > 0")
        for row in c.fetchall():
            b = Benchmark(row[0], row[1], row[2], row[3], row[4])
            self.suitemap[row[0]] = b
            self.benchmarks.append(b)

        # Get a list of suite versions
        self.suiteversions = []
        c.execute("SELECT id, name, suite_id FROM awfy_suite_version")
        for row in c.fetchall():
			if row[2] in self.suitemap:
				self.suiteversions.append([row[0], row[1], self.suitemap[row[2]].name])

        # Get a list of machines.
        self.machines = []
        c.execute("SELECT id, os, cpu, description, active, frontpage, pushed_separate, message FROM awfy_machine WHERE active >= 1")
        for row in c.fetchall():
            m = Machine(row[0], row[1], row[2], row[3], row[4], row[5], row[6], row[7])
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
                             "browser": vendor.browser,
                             "rangeURL": vendor.rangeURL
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
            o[b.name] = b.export()
        return o

    def exportSuiteVersions(self):
        o = { }
        for v in self.suiteversions:
            o[v[0]] = { "name": v[1],
                        "suite": v[2]
					  }
        return o


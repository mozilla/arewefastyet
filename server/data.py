# vim: set ts=4 sw=4 tw=99 et:
import awfy

class Benchmark(object):
    def __init__(self, suite_id, name, description, direction):
        self.suite_id = suite_id
        self.name =  name
        self.description = description
        self.direction = direction

class Vendor(object):
    def __init__(self, id, name, vendor, url, browser):
        self.id = id
        self.name = name
        self.vendor = vendor
        self.url = url
        self.browser = browser

    def export(self):
        return { "id": self.id,
                 "name": self.name,
                 "vendor": self.vendor,
                 "url": self.url,
                 "browser": self.browser
               }

class Mode(object):
    def __init__(self, id, vendor, mode, name, color):
        self.id = id
        self.vendor = vendor
        self.mode = mode
        self.name = name
        self.color = color

    def export(self):
        return { "id": self.id,
                 "vendorid": self.vendor.id,
                 "mode": self.mode,
                 "name": self.name,
                 "color": self.color
               }

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

        self.earliest = self.runs[-1][0]

    def contains(self, run_id):
        return run_id in self.map_

class Context(object):
    def __init__(self):
        # Get a list of vendors, and map vendor IDs -> vendor info
        self.vendors = []
        self.vendorMap_ = {}

        c = awfy.db.cursor()
        c.execute("SELECT id, name, vendor, csetURL, browser FROM awfy_vendor")
        for row in c.fetchall():
            v = Vendor(row[0], row[1], row[2], row[3], row[4])
            self.vendorMap_[v.id] = v
            self.vendors.append(v)

        # Get a list of modes, and a reverse mapping from DB ids.
        self.modes = []
        self.modeMap_ = {}
        c.execute("SELECT id, vendor_id, mode, name, color FROM awfy_mode")
        for row in c.fetchall():
            v = self.vendorMap_[row[1]]
            m = Mode(row[0], v, row[2], row[3], row[4])
            self.modeMap_[m.id] = m
            self.modes.append(m)

        # Get a list of benchmarks.
        self.benchmarks = []
        c.execute("SELECT id, name, description, better_direction FROM awfy_suite")
        for row in c.fetchall():
            b = Benchmark(row[0], row[1], row[2], row[3])
            self.benchmarks.append(b)


def graph(cx, runs, suite_id):
    c = awfy.db.cursor()
    c.execute("SELECT s.run_id, s.mode_id, s.score                      \
               FROM awfy_score s                                        \
               JOIN awfy_mode m ON m.id = s.mode_id                     \
               WHERE s.suite_id = %s                                    \
               AND s.run_id > %s", [suite_id, runs.earliest])
    points = []
    for row in c.fetchall():
        points.append(row)
    return points


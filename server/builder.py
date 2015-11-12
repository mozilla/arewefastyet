# vim: set ts=4 sw=4 tw=99 et:

class LineBuilder:
    def __init__(self, mode_id):
        self.points = []
        self.mode_id = mode_id
        self.time_occurence = {} 

    def addPoint(self, time, first, last, score, suite_version, id):
        if not score:
            return

        point = { 'time': time,
                  'first': first,
                  'last': None,
                  'score': score,
                  'suite_version': suite_version,
                  'id': id
                }
        self.points.append(point)
        if time not in self.time_occurence:
            self.time_occurence[time] = 0
        self.time_occurence[time] += 1

    def time_occurences(self):
        return self.time_occurence

    def fixup(self, max_occurences):
        # sort the list of points and add 'null' datapoints
        # for every given occurence of timestamp that isn't
        # in this list.

        amount_datapoints = sum(max_occurences.values())

        point_map = {}
        for point in self.points:
            if point['time'] not in point_map:
                point_map[point['time']] = []
            point_map[point['time']].append(point)

        self.points = []
        for time in sorted(max_occurences.keys()):
            added = 0
            if time in point_map:
                self.points += point_map[time]
                added = len(point_map[time])
            self.points += [None] * (max_occurences[time] - added)

        self.time_occurence = max_occurences
        return

    def _data(self):
        data = []
        for point in self.points:
            if not point:
                data.append(None)
            else:
                data.append([
                    point['score'],
                    point['first'],
                    point['last'],
                    point['suite_version'],
                    point['id']
                ])
        return data

    def output(self):
        return {
            'modeid': self.mode_id,
            'data':  self._data()
        }

class GraphBuilder:
    def __init__(self, direction):
        self.direction = direction
        self.lines = []

    def newLine(self, mode_id):
        line = LineBuilder(mode_id)
        self.lines.append(line)
        return line 
        
    def _calculate_max_occurences(self):
        # Returns a dictionary with for every timestamp in
        # all lines the maxium number of times it occurs in one line.
        max_occurences = {}
        for line in self.lines:
            line_occurences = line.time_occurences()
            for time in line_occurences:
                if time not in max_occurences:
                    max_occurences[time] = 0
                max_occurences[time] = max(max_occurences[time], line_occurences[time]) 
        return max_occurences

    def _timelist(self):
        if len(self.lines) == 0:
            return []    

        # After fixup, all lines have the same time_occurences.
        # Take the first one to create the timelist.
        occurences = self.lines[0].time_occurences()
        timelist = []
        for time in sorted(occurences.keys()):
            timelist += [time] * occurences[time]
        return timelist

    def fixup(self):
        max_occurences = self._calculate_max_occurences()
        for line in self.lines:
            line.fixup(max_occurences)

    def output(self):
        # Note: always first call fixup! Very important!
        return {
            'direction': self.direction,
            'lines': [line.output() for line in self.lines],
            'timelist': self._timelist()
        }

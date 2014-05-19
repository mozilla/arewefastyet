# vim: set ts=4 sw=4 tw=99 et:

# This class does some dirty work in unifying the structure of the graph.
class Builder:
    def __init__(self):
        self.lines = []
        self.timemap = {}

    def addPoint(self, points, time, first, last, score, suite_version):
        point = { 'time': time,
                  'first': first,
                  'score': score,
                  'suite_version': suite_version
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
        self.prune()

        # Build a sorted list of all time values, then provide a mapping from
        # time values back to indexes into this list.
        self.timelist = sorted(self.timemap.keys())
        for i, t in enumerate(self.timelist):
            self.timemap[t] = i

        # Now we have a canonical list of time points across all lines. Build
        # a new point list for each line, such that all lines have the same
        # list of points. At this time, we also rewrite points to be lists, as
        # this results in smaller exported JSON.
        for i, line in enumerate(lines):
            # Prefill, so each slot in the line has one point.
            newlist = [None] * len(self.timelist)
            for point in line['data']:
                index = self.timemap[point['time']]
                if 'last' in point:
                    newlist[index] = [point['score'], point['first'], point['last'], point['suite_version']]
                else:
                    newlist[index] = [point['score'], point['first'], None, point['suite_version']]

            line['data'] = newlist
        return
# end class Builder

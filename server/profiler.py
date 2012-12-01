# vim: set ts=4 sw=4 tw=99 et:
import datetime

class Profiler(object):
    def __init__(self, text = None):
        self.text = text
        self.end = None

    def __enter__(self):
        self.start()
        return self

    def start(self):
        self.begin = datetime.datetime.now()

    def stop(self):
        self.end = datetime.datetime.now()

    def __exit__(self, exc_type, exc_value, traceback):
        if self.text:
            print(self.text + ' (took ' + self.time() + ')')

    def time(self):
        if self.end:
            end = self.end
        else:
            end = datetime.datetime.now()
        diff = end - self.begin
        return str(diff.seconds) + 's' + str(diff.microseconds // 1000) + 'ms'


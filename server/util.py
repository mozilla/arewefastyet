# vim: set ts=4 sw=4 tw=99 et:
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

try:
    import cjson
except:
    import json
    cjson = None

def json_dump(j, fp):
    if cjson:
        text = cjson.encode(j)
        fp.write(text)
    else:
        json.dump(j, fp)

def json_load(fp):
    if cjson:
        text = fp.read()
        return cjson.decode(text)
    return json.load(fp)

def json_dumps(obj):
    if cjson:
        return cjson.encode(obj)
    return json.dumps(obj)

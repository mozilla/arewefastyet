import json

def getInfo(path):
    if not path.endswith("/"):
        path += "/"

    fp = open(path + "info.json", 'r')
    info = json.load(fp)
    fp.close();

    # which platform to execute:
    if "platform" not in info:
        if info["binary"].endswith(".apk"):
            info["platform"] = "android"
        elif info["binary"].endswith(".dmg") or "mac" in info["binary"]:
            info["platform"] = "osx"
        elif info["binary"].endswith(".exe"):
            info["platform"] = "windows"
        else:
            info["platform"] = "linux"

    # default args and env
    if "args" not in info:
        info["args"] = []
    if "env" not in info:
        info["env"] = {}
    
    return info

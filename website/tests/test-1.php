<?php

require_once("../lib/ManipulateTask.php");

$task_text = '

python download.py --repo mozilla-inbound -o ~/repos/mozilla-inbound/
python edge.py  -o ~/repos/edge/

python submitter.py -c -m 31 -o /tmp/submitter_id
python execute.py --submitter-session /tmp/submitter_id -b remote.sunspider -b remote.octane -b remote.kraken -b remote.massive -b remote.jetstream -b remote.speedometer -b local.assorteddom -e ~/repos/mozilla-inbound/ -e ~/repos/edge/ -s remote -c default --submitter-mode "firefox,default:browser_win10" --submitter-mode "edge,default:edge"
python execute.py --submitter-session /tmp/submitter_id -b remote.browsermark -e ~/repos/mozilla-inbound/ -e ~/repos/edge/ -s remote -c default --submitter-mode "firefox,default:browser_win10" --submitter-mode "edge,default:edge"
python execute.py -b remote.sunspider -s remote -e ~/repos/mozilla-inbound
python submitter.py -f -s /tmp/submitter_id

';

$task = new ManipulateTask($task_text);

assert($task->engines() == Array("firefox", "edge"));
assert($task->modes() == Array("browser_win10", "edge", "jmim"));

$task->update_engines(["firefox"]);
assert($task->engines() == Array("firefox"));
assert($task->modes() == Array("browser_win10", "jmim"));

$task->update_modes(["jmim"]);
assert($task->engines() == Array("firefox"));
assert($task->modes() == Array("jmim"));

$task = new ManipulateTask($task_text);
$task->update_modes(["browser_win10"]);
assert($task->engines() == Array("firefox"));
assert($task->modes() == Array("browser_win10"));

$task_text = '

python build.py -c 32bit -s mozilla -o ~/awfy-new/repos/mozilla-inbound-32/
python build.py -c 32bit -s v8 -o ~/awfy-new/repos/v8-32/

python submitter.py -c -m 28 -o /tmp/submitter_id
python execute.py --submitter-session /tmp/submitter_id -b shell.sunspider -b shell.octane -b shell.kraken -b shell.assorted -b shell.dart -e ~/awfy-new/repos/mozilla-inbound-32/ -e ~/awfy-new/repos/v8-32/ -s remote -c default -c unboxedobjects -c turbofan -c testbedregalloc
python execute.py --submitter-session /tmp/submitter_id -b shell.asmjsapps -b shell.asmjsmicro -e ~/awfy-new/repos/mozilla-inbound-32/ -e ~/awfy-new/repos/v8-32/ -s remote -c default -c unboxedobjects -c turbofan -c testbedregalloc -c noasmjs
python submitter.py -f -s /tmp/submitter_id

';

$task = new ManipulateTask($task_text);
$task->update_engines(["firefox"]);
$task->update_modes(["jmim"]);
$task->update_benchmarks(["shell.asmjsapps"]);
assert($task->engines() == Array("firefox"));
assert($task->modes() == Array("jmim"));
assert($task->benchmarks() == Array("shell.asmjsapps"));

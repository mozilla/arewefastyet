#!/bin/bash

# Protocol for stopping AWFY:
#
# (1) If you want to stop it immediately:
#     screen -r
#     ctrl+c
#     rm /tmp/awfy-daemon
#     rm /tmp/awfy
#     ctrl a+d
#     Remember to start it again later!
#
# (2) If you want to it to stop when possible:
#     touch /tmp/awfy
#     screen -r
#     (wait for it to confirm that it's no longer running)
#     ctrl a+d

PATH=/opt/local/bin:/opt/local/sbin:/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin:/usr/X11/bin
if [ -e /tmp/awfy-daemon ]
then
  echo "Already running"
  exit 0
fi

touch /tmp/awfy-daemon
while :
do
	if [ -e /tmp/awfy ]
	then
		echo "/tmp/awfy lock in place"
		sleep 10
	else
		cd /Users/mozilla/awfy/ia32/driver
		python dostuff.py --config=awfy-x86.config
		cd /Users/mozilla/awfy/x64/driver
		python dostuff.py --config=awfy-x64.config
	fi
done
rm /tmp/awfy-daemon


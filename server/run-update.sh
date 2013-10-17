#!/bin/bash

if [ -e /tmp/awfy-lock ]
then
  echo "Already running"
  exit 0
fi

touch /tmp/awfy-lock
/usr/bin/python /home/awfy/arewefastyet/server/update.py
rm /tmp/awfy-lock


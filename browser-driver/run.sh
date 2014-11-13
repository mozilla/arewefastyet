#!/bin/bash

adb kill-server
killall adb
sudo adb start-server

while :
do
	python dostuff.py
	sleep 60
done

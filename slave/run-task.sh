#!/bin/bash

if [ -f /tmp/awfy-deamon ]
then
    echo "Already running";
    exit;
fi

touch /tmp/awfy-deamon;

control_c()
{
    rm /tmp/awfy-deamon;
    exit;
}

# trap keyboard interrupt (control-c)
trap control_c SIGINT

cd arewefastyet

for (( ; ; ))
do
    python task.py --run <<CONTROL_UNIT_ID>>
done

#!/bin/bash

# Execute the arewefastyet task for the control unit
# specified in the environment variable CONTROL_UNIT_ID.

help()
{
    cat <<EOF
error: Missing CONTROL_UNIT_ID environment variable.

Either specify CONTROL_UNIT_ID in the environment or create
~/AWFY_CONFIG containing the line:

export CONTROL_UNIT_ID=id

where id is the control unit id for this host.

Then re-run this command.
EOF
}

if [[ -e ~/AWFY_CONFIG ]]; then
    source ~/AWFY_CONFIG
fi

if [[ -z "$CONTROL_UNIT_ID" ]]; then
    help
    exit 1
fi

cd ~/arewefastyet/slave

while true; do
    # Remove temporary files left behind by Firefox.
    rm -f /tmp/tmpaddon*
    echo "$(date): task.py --run $CONTROL_UNIT_ID"
    if ! python task.py --run $CONTROL_UNIT_ID; then
        echo "$(date): task.py --run $CONTROL_UNIT_ID: $?"
    fi
    echo "$(date): sleep 60"
    echo "========================================"
    sleep 60
done

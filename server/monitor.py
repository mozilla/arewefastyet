# vim: set ts=4 sw=4 tw=99 et:
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
import awfy
import time
from email.mime.text import MIMEText
from smtplib import SMTP
try:
    import ConfigParser
except:
    import configparser as ConfigParser

awfy.Startup()

config = ConfigParser.RawConfigParser()
config.read('/etc/awfy-server.config')

c = awfy.db.cursor()
c.execute("SELECT id, machine_id, mode_id, monitor_timeout, monitor_last_checked, monitor_contact FROM control_tasks")
tasks = c.fetchall()
for task in tasks:
    task_id = task[0]
    task_machine_id = task[1]
    task_mode_id = task[2]
    task_timeout_min = task[3]
    task_last_checked = task[4]
    task_contact = task[5]

    c.execute("SELECT description FROM awfy_machine WHERE id = %s", (task_machine_id, ))
    machine = c.fetchone()
    if not machine:
        continue
    machine_description = machine[0]

    if task_mode_id != 0:
        c.execute("SELECT name FROM awfy_mode WHERE id = %s", (task_mode_id, ))
        mode = c.fetchone()
        if not mode:
            continue
        machine_description += " with "+mode[0]

    print machine_description

    c.execute("""
               SELECT finish
               FROM control_task_queue
               WHERE control_tasks_id = %s AND
                     finish > 0
               ORDER BY finish DESC LIMIT 1
              """,
              (task_id,))
    last_task = c.fetchone()
    if not last_task:
        print "Never ran"
        continue

    last_run = last_task[0]
    time_since_reported = (time.time() - last_run) / 60
    if time_since_reported < task_timeout_min:
        print "No timeout"
        continue

    # Don't report every single time. Report every hour.
    time_since_checked = (time.time() - task_last_checked) / 60
    if time_since_checked < 60:
        print "Already reported, waiting an hour"
        continue

    c.execute("UPDATE control_tasks SET monitor_last_checked = UNIX_TIMESTAMP() WHERE id = %s",
              (task_id,))
    awfy.db.commit()

    # If there's no one to e-mail, just stop.
    if not len(task_contact):
        print "Nobody to contact. Ignore."
        continue

    delta = int(time_since_reported / 60)

    text = """AreWeFastYet has not received results from machine {0} (task_id {1}) in {2} hours.
    """.format(machine_description, task_id, delta)

    message = MIMEText(text)
    message['Subject'] = 'AreWeFastYet Machine {0} id {1} not reporting'.format(
        machine_description,
        task_id
    )
    message['From'] = 'AreWeFastYet <no-reply@arewefastyet.com>'
    message['To'] = ', '.join(task_contact.split(','))

    mailer = SMTP('localhost')
    mailer.sendmail(
      'AreWeFastYet <no-reply@arewefastyet.com>',
      task_contact.split(','),
      message.as_string()
    )

    print(message.as_string())

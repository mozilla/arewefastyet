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
c.execute("select id, description, last_checked, timeout, contact from awfy_machine where active = 1")
machines = c.fetchall()
for machine_row in machines:
    machine_id = machine_row[0]
    machine_description = machine_row[1]
    machine_last_checked = machine_row[2]
    machine_timeout_minutes = machine_row[3]
    machine_contact = machine_row[4]

    # Find the last time this machine submitted any data.
    c.execute(
      """
        select stamp
         from fast_run
        where
         machine = %s and
         status = 1
        order by stamp desc
        limit 1
      """,
      (machine_id,)
    )
    row = c.fetchone()
    if not row:
        continue

    last_run = row[0]
    time_since_reported = (time.time() - last_run) / 60
    if time_since_reported < machine_timeout_minutes:
        continue

    # Don't report every single time we monitor; wait again.
    time_since_checked = (time.time() - machine_last_checked) / 60
    if time_since_checked < machine_timeout_minutes:
        continue

    c.execute("update awfy_machine set last_checked = UNIX_TIMESTAMP() where id = %s",
              (machine_id,))

    # If there's no one to e-mail, just stop.
    if not len(machine_contact):
        continue

    delta = int(time_since_reported / 60)

    text = """AreWeFastYet has not received results from machine {0} (id {1}) in {2} hours.
    """.format(machine_description, machine_id, delta)

    message = MIMEText(text)
    message['Subject'] = 'AreWeFastYet Machine {0} id {1} not reporting'.format(
        machine_description,
        machine_id
    )
    message['From'] = 'AreWeFastYet <no-reply@arewefastyet.com>'
    message['To'] = ', '.join(machine_contact.split(','))

    mailer = SMTP('localhost')
    mailer.sendmail(
      'AreWeFastYet <no-reply@arewefastyet.com>',
      machine_contact.split(','),
      message.as_string()
    )

    print(message.as_string())

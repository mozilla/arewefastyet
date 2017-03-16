# vim: set ts=4 sw=4 tw=99 et:
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

import awfy

c = awfy.db.cursor()
query = "UPDATE `control_task_queue` SET output = '' WHERE UNIX_TIMESTAMP() - 60*60*24*30 >= finish"
c.execute(query)
awfy.db.commit()

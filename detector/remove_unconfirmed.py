# vim: set ts=4 sw=4 tw=99 et:
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

import awfy

c = awfy.db.cursor()
c.execute("SELECT id, build_id                                              \
		   FROM awfy_regression                                             \
		   WHERE status = 'unconfirmed'")
for row in c.fetchall():
	c.execute("DELETE FROM awfy_regression_breakdown                        \
			   WHERE build_id = %s", row[1])
	c.execute("DELETE FROM awfy_regression_score                            \
			   WHERE build_id = %s", row[1])
	c.execute("DELETE FROM awfy_regression_status                           \
			   WHERE regression_id = %s", row[0])
	c.execute("DELETE FROM awfy_regression                                  \
			   WHERE id = %s", row[0])
	c.execute("UPDATE awfy_run                                              \
               LEFT JOIN awfy_build ON awfy_run.id = awfy_build.run_id      \
               SET detector = 0                                             \
			   WHERE awfy_build.id = %s", row[1])
    
	print row[0]
awfy.db.commit()

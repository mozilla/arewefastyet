AreWeFastYet
============

AreWeFastYet is a set of tools used for benchmarking the major browser's
JavaScript virtual machines against each other, as well as reporting the
results on a website as insightful graphs showing the evolution of performance
over time.

A public instance is hosted by Mozilla and running at
[https://arewefastyet.com](https://arewefastyet.com).

Full Documentation
==================

See the [Wiki](https://github.com/h4writer/arewefastyet/wiki/) for full documentation, examples, operational details and other information.

Installation
============

Database
--------
Put `/server/awfy-server.config` in `/etc`, and edit it to point at your
database. Afterwards just run `php migrate.php` to create the tables and run
the migrations.  (Note: sometimes the database layout changes a bit. After
pulling it is recommanded to run `php migrate.php` again. That will incremental
adjust the database to the new layout, transforming existing entries.)

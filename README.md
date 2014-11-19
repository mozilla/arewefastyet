Components
==========

1. Database: MySQL database that stores statistics.
2. Collector: Hidden PHP script on the webserver, where stats get sent.
3. Driver: Python driver that runs on each benchmark computer, and submits stats.
4. Processor: Python aggregator that builds JSON data from the DB.
5. Website: Static HTML as the frontpage, that queries JSON via XHR.

Components (2), (3), and (5) must be on the same webserver, otherwise timestamps might not be computed correctly.

Keep in mind, most of this documentation is for posterity. AWFY was never intended to be a drag-and-drop all-in-one released product, so the procedures and scripts may be pretty rough.

Installation
============

Database
--------
Create a database and import/run `database/schema.sql`.

Data Collector
--------------
Drop `website/UPDATE.PHP` and `website/internals.php` somewhere, and rename `UPDATE.PHP` to something secret. Make sure you don't have directory listings enabled.

Benchmark Computers
-------------------

Clone the AWFY repo and check out each vendor's source code. Typically this looks something like:

       git clone http://github.com/dvander/arewefastyet awfy
       cd awfy
       mkdir repos
       cd repos

       # Get V8
       git clone https://chromium.googlesource.com/v8/v8.git v8

       # Get Mozilla
       hg clone http://hg.mozilla.org/integration/mozilla-inbound

       # Get WebKit - Mac/Linux only
       svn checkout https://svn.webkit.org/repository/webkit/trunk WebKit

       cd ../driver
       cp awfy.config.sample awfy.config

Then,

1. Add a database entry for the machine configuration.
2. Edit `awfy.config` to match the build architecture you want, and to have the correct machine database number.
3. Set up a cronjob, service, or screen to run dostuff.py periodically. Mozilla uses `run.sh` which will run continuously, since a cronjob could run overlapping jobs. `run.sh` also lets you configure lock files in `/tmp`.

Note, interrupting `dostuff.py` can cause problems with subversion, for example, the WebKit repository may become stuck and need an `svn cleanup` or an `rm -rf` and clean checkout. For sanity, the helper script `run.sh` will pause its next run if it sees a `/tmp/awfy` lock in place, and this can be used to wait.

Note, it is not safe to share multiple AWFY instances from the same repository, since C++ object files are generally re-used and may not correctly link depending on build flags. Also, only one instance of AWFY should ever be running at a given time. For best benchmark results, no other programs should be running.
   
Data Processor
--------------
Put `awfy-server.config` in `/etc`, and edit it to point at your database and website/data folder. Then put `update.py` in a cronjob. It will dump files where appropriate. AWFY.com does this every 15min. It is not safe to run two instance at once. A sample wrapper script is provided as `run-update.sh`.

update.py generates various JSON files:

1. "raw" and "metadata" files cache database queries from run to run, so we don't have to make expensive database queries.
2. "aggregate" files are used for the front page.
3. "condensed" files are used for one level of zooming, so users don't have to download the raw data set right away.
   
The metadata and raw JSON files are updated as needed. The aggregate and condensed files are always re-generated from the raw data.

There is also a `monitor.py` script provided in the server folder. You can run this regularly to send e-mails for benchmarking machines that haven't sent results in a certain amount of time (this time is specified in awfy-server.config). It will send e-mail through the local SMTP server, using the "contact" field for each machine in the database. This field should be a comma-delimited list of e-mail addresses (i.e. "egg@yam.com,bob@egg.com").

Website
-------
Put the files somewhere. Currently php is needed for data.php, which pulls the data from the correct location. You need to update that file to refer the 'data' folder that contains the json/js files dumped by update.py.

Don't forget to replace the default machine number in website/awfy.js, which is the one that will show up in the first place. Note that AWFY's flot is slightly modified, so it might not work to just replace it with upstream flot.

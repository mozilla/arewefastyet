# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

import json
import logging
import os
import socket
import time
from urlparse import urljoin
import uuid

try:
    from thclient import TreeherderClient, TreeherderJob, TreeherderJobCollection
except:
    print "run 'sudo pip install treeherder-client' to install the needed libraries"
    exit()

JOB_FRAGMENT = '/#/jobs?repo={repository}&revision={revision}'
BUILD_STATES = ['running', 'completed']

logging.basicConfig(format='%(asctime)s %(levelname)s | %(message)s', datefmt='%H:%M:%S')
logger = logging.getLogger('arewefastyet')
logger.setLevel(logging.INFO)

class Submission(object):
    """Class for submitting reports to Treeherder."""

    def __init__(self, repository, revision, settings,
                 treeherder_url=None, treeherder_client_id=None, treeherder_secret=None):
        """Creates new instance of the submission class.

        :param repository: Name of the repository the build has been built from.
        :param revision: Changeset of the repository the build has been built from.
        :param settings: Settings for the Treeherder job as retrieved from the config file.
        :param treeherder_url: URL of the Treeherder instance.
        :param treeherder_client_id: The client ID necessary for the Hawk authentication.
        :param treeherder_secret: The secret key necessary for the Hawk authentication.

        """
        self.repository = repository
        self.revision = revision
        self.settings = settings

        self._job_details = []

        self.url = treeherder_url
        self.client_id = treeherder_client_id
        self.secret = treeherder_secret

        if not self.client_id or not self.secret and self.url != "mock":
            raise ValueError('The client_id and secret for Treeherder must be set.')

    def create_job(self, data=None, **kwargs):
        """Creates a new instance of a Treeherder job for submission.

        :param data: Job data to use for initilization, e.g. from a previous submission, optional
        :param kwargs: Dictionary of necessary values to build the job details. The
            properties correlate to the placeholders in config.py.

        """
        data = data or {}

        job = TreeherderJob(data=data)

        # If no data is available we have to set all properties
        if not data:
            job.add_job_guid(str(uuid.uuid4()))
            job.add_tier(self.settings['treeherder']['tier'])

            job.add_product_name('firefox')

            job.add_project(self.repository)
            job.add_revision(self.revision)

            # Add platform and build information
            job.add_machine(socket.getfqdn())
            platform = self.settings["treeherder"]["platform"]
            job.add_machine_info(*platform)
            job.add_build_info(*platform)

            # TODO debug or others?
            job.add_option_collection({'opt': True})

            # TODO: Add e10s group once we run those tests
            job.add_group_name(self.settings['treeherder']['group_name'].format(**kwargs))
            job.add_group_symbol(self.settings['treeherder']['group_symbol'].format(**kwargs))

            # Bug 1174973 - for now we need unique job names even in different groups
            job.add_job_name(self.settings['treeherder']['job_name'].format(**kwargs))
            job.add_job_symbol(self.settings['treeherder']['job_symbol'].format(**kwargs))

            job.add_start_timestamp(int(time.time()))

            # Bug 1175559 - Workaround for HTTP Error
            job.add_end_timestamp(0)

        return job

    def submit(self, job):
        """Submit the job to treeherder.

        :param job: Treeherder job instance to use for submission.

        """
        job.add_submit_timestamp(int(time.time()))

        # We can only submit job info once, so it has to be done in completed
        if self._job_details:
            job.add_artifact('Job Info', 'json', {'job_details': self._job_details})

        job_collection = TreeherderJobCollection()
        job_collection.add(job)

        logger.info('Sending results to Treeherder: {}'.format(job_collection.to_json()))
        if self.url == 'mock':
            logger.info('Pretending to submit job')
            return

        client = TreeherderClient(server_url=self.url,
                                  client_id=self.client_id,
                                  secret=self.secret)
        client.post_collection(self.repository, job_collection)

        logger.info('Results are available to view at: {}'.format(
                    urljoin(self.url,
                            JOB_FRAGMENT.format(repository=self.repository,
                                                revision=self.revision))))

    def submit_running_job(self, job):
        """Submit job as state running.

        :param job: Treeherder job instance to use for submission.

        """
        job.add_state('running')
        self.submit(job)

    def submit_completed_job(self, job, perfdata, state="success", loglink=None, retriggerlink=None):
        """Submit job as state completed.

        :param job: Treeherder job instance to use for submission.
        :param state: success, testfailed, busted, skipped, exception, retry, usercancel 
        :param uploaded_logs: List of uploaded logs to reference in the job.

        """
        job.add_state('completed')
        job.add_result(state)

        jsondata = json.dumps({'performance_data': perfdata})
        job.add_artifact('performance_data', 'json', jsondata)

        if retriggerlink:
            self._job_details.append({
                                'url': retriggerlink,
                                'value': "Retrigger",
                                'content_type': 'link',
                                'title': 'retrigger revision on AWFY'})

        if loglink:
            job.add_log_reference('buildbot_text', loglink, parse_status='parsed')

        job.add_end_timestamp(int(time.time()))

        self.submit(job)


def upload_log_files(guid, logs,
                     bucket_name=None, access_key_id=None, access_secret_key=None):
    """Upload all specified logs to Amazon S3.

    :param guid: Unique ID which is used as subfolder name for all log files.
    :param logs: List of log files to upload.
    :param bucket_name: Name of the S3 bucket.
    :param access_key_id: Client ID used for authentication.
    :param access_secret_key: Secret key for authentication.

    """
    # If no AWS credentials are given we don't upload anything.
    if not bucket_name:
        logger.info('No AWS Bucket name specified - skipping upload of artifacts.')
        return {}

    s3_bucket = S3Bucket(bucket_name, access_key_id=access_key_id,
                         access_secret_key=access_secret_key)

    uploaded_logs = {}

    for log in logs:
        try:
            if os.path.isfile(logs[log]):
                remote_path = '{dir}/{filename}'.format(dir=str(guid),
                                                        filename=os.path.basename(log))
                url = s3_bucket.upload(logs[log], remote_path)

                uploaded_logs.update({log: {'path': logs[log], 'url': url}})
                logger.info('Uploaded {path} to {url}'.format(path=logs[log], url=url))

        except Exception:
            logger.exception('Failure uploading "{path}" to S3'.format(path=logs[log]))

    return uploaded_logs


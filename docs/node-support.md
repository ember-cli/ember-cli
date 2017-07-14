# Node Support

* original proposal/discussion: https://github.com/ember-cli/rfcs/pull/47

# Design

Commits to the `HEAD` of the master branch will provide support for any Active
(not Maintenance Mode) Node.js LTS and the current stable Node.js version(s).
This will be enforced via CI, preventing us from landing code which won't work
with versions which we support. This means that our schedule for support is
tied to the [LTS release schedule for
Node.js](https://github.com/nodejs/LTS#lts_schedule).

For our currently existing support of 0.10 and 0.12 we should drop support at
the end of their Maintenance Mode–their official end-of-life from Node.js. This
gives time for our community to migrate off of those environments which we
presently support.

## Legacy Support

* v0.10: LTS Maintenance Mode ends on 2016-10-01. We drop all support on that date.
* v0.12: LTS Maintenance Mode ends on 2017-04-01. We drop all support on that date.

## Ongoing support per this RFC:

These examples assume major version bumps. This is not required per Node.js
policy in order to become an LTS.

* v4.2: LTS Maintenance Mode begins on 2017-04-01. We drop support on that date
  for new commits to `master`. _We must have an Ember CLI LTS strategy
    specified by this date._
* v5: Stable release, never LTS. Began support 2015-10-01. All support expires
  on 2016-07-01.
* v6: Released as Stable approximately 2016-04-01, converted to LTS Active
  Support 2016-10-01. Begin support on 2016-04-01. Active support ends on
  2018-04-01 at which point we drop support on that date for new commits to
  `master`.
* v7: Stable release, never LTS. Begin support upon release 2016-10-01. All
  support expires on 2017-07-01.

# Release Process and Support Policy

The Ember CLI release process and support policy is presently `undefined`. We
are currently specifying a release process in RFC #46. We must specify a
support policy no later than 2017-04-01. The support policy doesn't have to be
complete before then as we will continue to 100% support all Node.js supported
releases until that date under this RFC.

This RFC is distinct from providing guarantees that some version of Ember CLI
will run securely on each Node.js LTS release. Currently we provide no
guarantees of support for any previously released version of Ember CLI–which is
a gap we wish to correct and are working toward.


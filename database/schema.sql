-- phpMyAdmin SQL Dump
-- version 3.3.9
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: Nov 29, 2012 at 11:13 PM
-- Server version: 5.1.41
-- PHP Version: 5.3.5

SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";

--
-- Database: `dvander`
--

-- --------------------------------------------------------

--
-- Table structure for table `awfy_breakdown`
--

CREATE TABLE IF NOT EXISTS `awfy_breakdown` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `run_id` int(11) DEFAULT NULL,
  `suite_id` int(11) DEFAULT NULL,
  `mode_id` int(11) DEFAULT NULL,
  `test` varchar(45) DEFAULT NULL,
  `score` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `run_id` (`run_id`),
  KEY `suite_id` (`suite_id`),
  KEY `mode_id` (`mode_id`)
) ENGINE=MyISAM  DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `awfy_build`
--

CREATE TABLE IF NOT EXISTS `awfy_build` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `run_id` int(10) unsigned NOT NULL,
  `mode_id` int(10) unsigned NOT NULL,
  `cset` varchar(256) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `index2` (`run_id`,`mode_id`)
) ENGINE=MyISAM  DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `awfy_config`
--

CREATE TABLE IF NOT EXISTS `awfy_config` (
  `key` varchar(64) NOT NULL,
  `value` varchar(255) NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `awfy_machine`
--

CREATE TABLE IF NOT EXISTS `awfy_machine` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `os` varchar(30) NOT NULL,
  `cpu` varchar(30) NOT NULL,
  `description` varchar(255) NOT NULL,
  `active` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM  DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `awfy_mode`
--

CREATE TABLE IF NOT EXISTS `awfy_mode` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `vendor_id` int(10) unsigned NOT NULL,
  `mode` varchar(12) NOT NULL,
  `name` varchar(255) NOT NULL,
  `color` varchar(45) DEFAULT NULL,
  `level` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `mode` (`mode`),
  UNIQUE KEY `index3` (`vendor_id`,`mode`)
) ENGINE=MyISAM  DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `awfy_score`
--

CREATE TABLE IF NOT EXISTS `awfy_score` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `run_id` int(11) DEFAULT NULL,
  `suite_id` int(11) DEFAULT NULL,
  `mode_id` int(11) DEFAULT NULL,
  `score` double DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `run_id` (`run_id`),
  KEY `mode_id` (`mode_id`)
) ENGINE=MyISAM  DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `awfy_suite`
--

CREATE TABLE IF NOT EXISTS `awfy_suite` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(45) DEFAULT NULL,
  `description` varchar(45) DEFAULT NULL,
  `better_direction` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name_UNIQUE` (`name`)
) ENGINE=MyISAM  DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `awfy_vendor`
--

CREATE TABLE IF NOT EXISTS `awfy_vendor` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(20) NOT NULL,
  `vendor` varchar(30) NOT NULL,
  `csetURL` varchar(255) NOT NULL,
  `browser` varchar(30) NOT NULL,
  `rangeURL` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM  DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `fast_run`
--

CREATE TABLE IF NOT EXISTS `fast_run` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `machine` int(10) unsigned NOT NULL,
  `stamp` int(10) unsigned NOT NULL,
  `cset` varchar(160) NOT NULL,
  `status` int(11) NOT NULL,
  `error` mediumtext NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM  DEFAULT CHARSET=latin1;

SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";

INSERT INTO awfy_config (`key`, `value`) VALUES
('version', '3');

INSERT INTO awfy_mode (id, vendor_id, `mode`, `name`, color, level) VALUES
(1, 2, 'moom', 'JM', '#000000', 20),
(2, 2, 'mooj', 'TM+JM', '#6f0a93', 20),
(3, 1, 'v8', 'v8', '#4DA74D', 1),
(4, 3, 'jsc', 'jsc', '#0099FF', 1),
(5, 3, 'jsci', 'no JIT', '#ef8b8b', 20),
(6, 2, 'j', 'TM', '#ffa451', 20),
(7, 2, 'm', 'JM', '#000000', 20),
(8, 2, 'i', 'no JIT', '#bbbbbb', 20),
(9, 2, 'mj', 'TM+JM', '#6f0a93', 20),
(11, 2, 'tm', '', '', 20),
(12, 4, 'ti', 'JM+TI', '#D64203', 1),
(13, 5, 'im', 'Ion', '#666666', 20),
(14, 5, 'jmim', 'JM+TI+Ion', '#9900CC', 1);

INSERT INTO awfy_suite (id, `name`, description, better_direction) VALUES
(1, 'ss', 'SunSpider', -1),
(2, 'v8', 'V8 (SS harness)', -1),
(3, 'v8real', 'V8 Benchmark', 1),
(4, 'kraken', 'Kraken', -1),
(5, 'misc', 'Assorted tests', -1);

INSERT INTO `awfy_vendor` (`id`, `name`, `vendor`, `csetURL`, `browser`, `rangeURL`) VALUES
(1, 'V8', 'Google', 'http://code.google.com/p/v8/source/detail?r=', 'Chrome', 'http://code.google.com/p/v8/source/list?num=25&start={to}'),
(2, 'SpiderMonkey', 'Mozilla', 'http://hg.mozilla.org/integration/mozilla-inbound/rev/', 'Firefox', 'http://hg.mozilla.org/integration/mozilla-inbound/pushloghtml?fromchange={from}&tochange={to}'),
(3, 'Nitro', 'Apple', 'http://trac.webkit.org/changeset/', 'Safari', 'http://trac.webkit.org/log/?action=stop_on_copy&mode=stop_on_copy&rev={to}&stop_rev={from}&limit=100'),
(4, 'SpiderMonkey', 'Mozilla', 'http://hg.mozilla.org/integration/mozilla-inbound/rev/', 'Firefox', 'http://hg.mozilla.org/integration/mozilla-inbound/pushloghtml?fromchange={from}&tochange={to}'),
(5, 'SpiderMonkey', 'Mozilla', 'http://hg.mozilla.org/integration/mozilla-inbound/rev/', 'Firefox', 'http://hg.mozilla.org/integration/mozilla-inbound/pushloghtml?fromchange={from}&tochange={to}');


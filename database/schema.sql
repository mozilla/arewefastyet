-- phpMyAdmin SQL Dump
-- version 3.3.9
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: Jun 21, 2013 at 09:37 PM
-- Server version: 5.1.69
-- PHP Version: 5.3.5

SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";

--
-- Table structure for table `awfy_config`
--

CREATE TABLE `awfy_config` (
  `key` varchar(64) NOT NULL,
  `value` varchar(255) NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

--
-- Dumping data for table `awfy_config`
--

INSERT INTO `awfy_config` (`key`, `value`) VALUES
('version', '3');

-- --------------------------------------------------------

--
-- Table structure for table `awfy_mode`
--

CREATE TABLE `awfy_mode` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `vendor_id` int(10) unsigned NOT NULL,
  `mode` varchar(24) NOT NULL,
  `name` varchar(255) NOT NULL,
  `color` varchar(45) DEFAULT NULL,
  `level` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `mode` (`mode`),
  UNIQUE KEY `index3` (`vendor_id`,`mode`)
) ENGINE=MyISAM  DEFAULT CHARSET=latin1 AUTO_INCREMENT=22 ;

--
-- Dumping data for table `awfy_mode`
--

INSERT INTO `awfy_mode` (`id`, `vendor_id`, `mode`, `name`, `color`, `level`) VALUES
(1, 2, 'moom', 'JM', '#000000', 20),
(2, 2, 'mooj', 'TM+JM', '#6f0a93', 20),
(3, 1, 'v8', 'v8', '#009933', 1),
(4, 3, 'jsc', 'jsc', '#0088DD', 1),
(5, 3, 'jsci', 'no JIT', '#ef8b8b', 20),
(6, 2, 'j', 'TM', '#ffa451', 20),
(7, 2, 'm', 'JM', '#000000', 20),
(8, 2, 'i', 'no JIT', '#bbbbbb', 20),
(9, 2, 'mj', 'TM+JM', '#6f0a93', 20),
(11, 2, 'tm', '', '', 20),
(12, 4, 'ti', 'JM+TI', '#000000', 20),
(13, 5, 'im', 'Ion', '#666666', 20),
(14, 5, 'jmim', 'Ion+BC+TI', '#FF6600', 1),
(15, 4, 'bc', 'BC+Ion+TI', '#000000', 20),
(16, 6, 'browser_im_bc', 'Ion+BC+TI', '#FF6600', 1),
(17, 0, 'native', 'Native C++', '#cccccc', 1),
(18, 7, 'clang', 'Clang', '#cccccc', 1),
(19, 8, 'gcc', 'gcc', '#cccccc', 1),
(20, 5, 'noasmjs', 'no asmjs', '#666666', 1),
(21, 5, 'ggc', 'Ion+BC+TI+GGC', '#FF0000', 1);

-- --------------------------------------------------------

--
-- Table structure for table `awfy_suite`
--

CREATE TABLE `awfy_suite` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(45) DEFAULT NULL,
  `description` varchar(45) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `better_direction` int(11) DEFAULT NULL,
  `sort_order` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name_UNIQUE` (`name`)
) ENGINE=MyISAM  DEFAULT CHARSET=latin1 AUTO_INCREMENT=9 ;

CREATE TABLE IF NOT EXISTS `awfy_suite_test` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `suite_version_id` int(11) NOT NULL,
  `name` varchar(128) NOT NULL,
  `visible` int(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `suite_id` (`suite_version_id`,`name`)
) ENGINE=MyISAM  DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

CREATE TABLE IF NOT EXISTS `awfy_suite_version` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `suite_id` int(10) unsigned NOT NULL,
  `name` varchar(45) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM  DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

--
-- Dumping data for table `awfy_suite`
--

INSERT INTO `awfy_suite` (`id`, `name`, `description`, `better_direction`, `sort_order`) VALUES
(1, 'ss', 'SunSpider', -1, 10),
(2, 'v8', 'V8 (SS harness)', -1, 0),
(3, 'v8real', 'V8 Benchmark', 1, 0),
(4, 'kraken', 'Kraken', -1, 30),
(5, 'misc', 'Assorted tests', -1, 40),
(6, 'octane', 'Octane', 1, 50),
(7, 'asmjs-ubench', 'asm.js µbench', -1, 60),
(8, 'asmjs-apps', 'asm.js apps', -1, 70);

-- --------------------------------------------------------

--
-- Table structure for table `awfy_vendor`
--

CREATE TABLE `awfy_vendor` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(20) NOT NULL,
  `vendor` varchar(30) NOT NULL,
  `csetURL` varchar(255) NOT NULL,
  `browser` varchar(30) NOT NULL,
  `rangeURL` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM  DEFAULT CHARSET=latin1 AUTO_INCREMENT=9 ;

--
-- Dumping data for table `awfy_vendor`
--

INSERT INTO `awfy_vendor` (`id`, `name`, `vendor`, `csetURL`, `browser`, `rangeURL`) VALUES
(1, 'V8', 'Google', 'http://code.google.com/p/v8/source/detail?r=', 'Chrome', 'http://code.google.com/p/v8/source/list?num=25&start={to}'),
(2, 'SpiderMonkey', 'Mozilla', 'http://hg.mozilla.org/integration/mozilla-inbound/rev/', 'Firefox', 'http://hg.mozilla.org/integration/mozilla-inbound/pushloghtml?fromchange={from}&tochange={to}'),
(3, 'Nitro', 'Apple', 'http://trac.webkit.org/changeset/', 'Safari', 'http://trac.webkit.org/log/?action=stop_on_copy&mode=stop_on_copy&rev={to}&stop_rev={from}&limit=100'),
(4, 'SpiderMonkey', 'Mozilla', 'http://hg.mozilla.org/projects/ionmonkey/rev/', 'Firefox', 'http://hg.mozilla.org/projects/ionmonkey/pushloghtml?fromchange={from}&tochange={to}'),
(5, 'SpiderMonkey', 'Mozilla', 'http://hg.mozilla.org/integration/mozilla-inbound/rev/', 'Firefox', 'http://hg.mozilla.org/integration/mozilla-inbound/pushloghtml?fromchange={from}&tochange={to}'),
(6, 'SpiderMonkey', 'Mozilla', 'http://hg.mozilla.org/integration/mozilla-inbound/rev/', 'Firefox OS Browser', 'http://hg.mozilla.org/integration/mozilla-inbound/pushloghtml?fromchange={from}&tochange={to}'),
(7, 'clang', 'Apple', '', 'Native C++', ''),
(8, 'gcc', 'GNU', '', 'Native C++', '');

-- phpMyAdmin SQL Dump
-- version 3.3.9
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: Jun 21, 2013 at 09:38 PM
-- Server version: 5.1.69
-- PHP Version: 5.3.5

SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";

--
-- Database: `dvander`
--

-- --------------------------------------------------------

--
-- Table structure for table `awfy_breakdown`
--

CREATE TABLE `awfy_breakdown` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `build_id` int(11) DEFAULT NULL,
  `suite_test_id` int(10) DEFAULT NULL,
  `score` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `build_id` (`build_id`),
  KEY `suite_test_id` (`suite_test_id`),
) ENGINE=MyISAM  DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `awfy_build`
--

CREATE TABLE `awfy_build` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `run_id` int(10) unsigned NOT NULL,
  `mode_id` int(10) unsigned NOT NULL,
  `cset` varchar(256) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `index2` (`run_id`,`mode_id`)
) ENGINE=MyISAM  DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `awfy_machine`
--

CREATE TABLE `awfy_machine` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `os` varchar(30) NOT NULL,
  `cpu` varchar(30) NOT NULL,
  `description` varchar(255) NOT NULL,
  `active` tinyint(1) NOT NULL,
  `frontpage` tinyint(1) NOT NULL DEFAULT '1',
  `last_checked` int(10) unsigned NOT NULL,
  `timeout` int(11) unsigned NOT NULL,
  `contact` mediumtext NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM  DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `awfy_score`
--

CREATE TABLE `awfy_score` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `build_id` int(11) DEFAULT NULL,
  `suite_version_id` int(11) DEFAULT NULL,
  `score` double DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `build_id` (`build_id`),
  KEY `suite_id` (`suite_version_id`)
) ENGINE=MyISAM  DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `awfy_run`
--

CREATE TABLE `awfy_run` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `machine` int(10) unsigned NOT NULL,
  `stamp` int(10) unsigned NOT NULL,
  `status` int(11) NOT NULL,
  `error` mediumtext NOT NULL,
  PRIMARY KEY (`id`),
  KEY `machine` (`machine`),
  KEY `status` (`status`)
) ENGINE=MyISAM  DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;


-- phpMyAdmin SQL Dump
-- version 3.4.10.1deb1
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: Oct 12, 2015 at 01:32 AM
-- Server version: 5.5.44
-- PHP Version: 5.3.10-1ubuntu3.19

SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

--
-- Database: `awfy`
--

-- --------------------------------------------------------

--
-- Table structure for table `awfy_breakdown`
--

CREATE TABLE IF NOT EXISTS `awfy_breakdown` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `score_id` int(10) unsigned NOT NULL,
  `score` double DEFAULT NULL,
  `suite_test_id` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `score_id_2` (`score_id`,`suite_test_id`),
  KEY `test_id` (`suite_test_id`),
  KEY `score_id` (`score_id`)
) ENGINE=MyISAM  DEFAULT CHARSET=latin1 AUTO_INCREMENT=33641206 ;

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
) ENGINE=MyISAM  DEFAULT CHARSET=latin1 AUTO_INCREMENT=702563 ;

-- --------------------------------------------------------

--
-- Table structure for table `awfy_config`
--

CREATE TABLE IF NOT EXISTS `awfy_config` (
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
-- Table structure for table `awfy_machine`
--

CREATE TABLE IF NOT EXISTS `awfy_machine` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `os` varchar(30) NOT NULL,
  `cpu` varchar(30) NOT NULL,
  `description` varchar(255) NOT NULL,
  `active` tinyint(1) NOT NULL,
  `frontpage` tinyint(1) NOT NULL DEFAULT '1',
  `pushed_separate` tinyint(1) NOT NULL,
  `last_checked` int(11) unsigned NOT NULL,
  `timeout` int(11) unsigned NOT NULL,
  `contact` text NOT NULL,
  `message` text NOT NULL,
  `confidence_runs` tinyint(4) NOT NULL DEFAULT '5',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM  DEFAULT CHARSET=latin1 AUTO_INCREMENT=32 ;

-- --------------------------------------------------------

--
-- Table structure for table `awfy_mode`
--

CREATE TABLE IF NOT EXISTS `awfy_mode` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `vendor_id` int(10) unsigned NOT NULL,
  `mode` varchar(24) NOT NULL,
  `name` varchar(255) NOT NULL,
  `color` varchar(45) DEFAULT NULL,
  `level` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `mode` (`mode`),
  UNIQUE KEY `index3` (`vendor_id`,`mode`)
) ENGINE=MyISAM  DEFAULT CHARSET=latin1 AUTO_INCREMENT=46 ;

--
-- Dumping data for table `awfy_mode`
--

INSERT INTO `awfy_mode` (`id`, `vendor_id`, `mode`, `name`, `color`, `level`) VALUES
(1, 2, 'moom', 'JM', '#000000', 20),
(2, 2, 'mooj', 'TM+JM', '#6f0a93', 20),
(3, 1, 'v8', 'v8', '#009933', 1),
(4, 3, 'jsc', 'jsc', '#0088DD', 10),
(5, 3, 'jsci', 'no JIT', '#ef8b8b', 20),
(6, 2, 'j', 'TM', '#ffa451', 20),
(7, 2, 'm', 'JM', '#000000', 20),
(8, 2, 'i', 'no JIT', '#bbbbbb', 20),
(9, 2, 'mj', 'TM+JM', '#6f0a93', 20),
(11, 2, 'tm', '', '', 20),
(12, 4, 'ti', 'JM+TI', '#000000', 20),
(13, 5, 'im', 'Ion', '#666666', 20),
(14, 5, 'jmim', 'Ion', '#FF6600', 10),
(15, 4, 'bc', '', '#000000', 20),
(16, 6, 'browser_im_bc', 'Ion', '#FF6600', 10),
(22, 5, 'browser_ggc', 'Firefox GGC', '#FF0000', 10),
(17, 0, 'native', 'Native C++', '#cccccc', 10),
(18, 7, 'clang', 'Clang', '#cccccc', 1),
(19, 8, 'gcc', 'gcc', '#cccccc', 1),
(20, 5, 'noasmjs', 'no asmjs', '#666666', 10),
(21, 5, 'ggc', 'Ion, GGC old', '#FF0000', 10),
(23, 9, 'browser_aurora', 'Ion', '#b8860b', 1),
(24, 5, 'test', 'Ion2', '#666666', 20),
(25, 10, 'flame_beta', 'Beta', '#b8860b', 0),
(26, 11, 'flame_1gb', '1GB', '#FF6600', 0),
(27, 12, 'flame_512mb', '512MB', '#ffa451', 0),
(28, 5, 'mozshell', 'Shell', '#666666', 1),
(29, 13, 'flame_256mb', '256MB', '#ffd051', 0),
(30, 1, 'v8-turbofan', 'Full turbofan, no crankshaft', '#A9DB1F', 2),
(31, 5, 'browser_cgc', 'Compacting GC', '#FF0000', 10),
(32, 12, 'flame_cgc', 'Compacting GC', '#ffa451', 0),
(33, 5, 'pgo', 'Ion, PGO', '#6f0a93', 10),
(35, 5, 'backtracking', 'Ion, backtracking', '#FF0000', 10),
(36, 5, 'unboxedobjects', 'Ion, unboxed objects', '#A35C00', 10),
(37, 3, 'jsc_shumway_interp', 'jsc, Shumway Interpreter', '#0088DD', 10),
(38, 1, 'v8_shumway_interp', 'v8,  Shumway interpreter', '#009933', 1),
(39, 5, 'jmim_shumway_interp', 'Ion,  Shumway Interpreter', '#FF6600', 10),
(40, 5, 'testbed', 'Ion, testbed regalloc', '#FF0000', 10),
(41, 5, 'browser_osx', 'OSX', '#FF0000', 10),
(42, 5, 'browser_win8', 'Windows 8', '#FFDD00', 10),
(43, 5, 'browser_linux', 'Ubuntu', '#A35C00', 10),
(44, 5, 'browser_win10', 'Windows 10', '#FFDD00', 10),
(45, 10, 'flame_b2g_inbound', 'b2g-inbound', '#b8860b', 0);

-- --------------------------------------------------------

--
-- Table structure for table `awfy_regression`
--

CREATE TABLE IF NOT EXISTS `awfy_regression` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `build_id` int(11) unsigned NOT NULL,
  `prev_build_id` int(10) unsigned NOT NULL,
  `bug` int(11) NOT NULL DEFAULT '0',
  `status` enum('unconfirmed','confirmed','improvement','fixed','wontfix','infrastructure','noise','triage') NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `build_id` (`build_id`,`prev_build_id`),
  KEY `prev_build_id` (`prev_build_id`),
  KEY `build_id_2` (`build_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=1798486 ;

-- --------------------------------------------------------

--
-- Table structure for table `awfy_regression_breakdown`
--

CREATE TABLE IF NOT EXISTS `awfy_regression_breakdown` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `regression_id` int(10) unsigned NOT NULL,
  `breakdown_id` int(10) unsigned NOT NULL,
  `noise` tinyint(1) NOT NULL DEFAULT '0',
  `fixed` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `build_id` (`regression_id`,`breakdown_id`),
  KEY `regression_id` (`regression_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=2393449 ;

-- --------------------------------------------------------

--
-- Table structure for table `awfy_regression_breakdown_noise`
--

CREATE TABLE IF NOT EXISTS `awfy_regression_breakdown_noise` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `machine_id` int(10) unsigned NOT NULL,
  `mode_id` int(10) unsigned NOT NULL,
  `suite_test_id` int(10) unsigned NOT NULL,
  `noise` double NOT NULL,
  `disabled` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `machine_id` (`machine_id`,`mode_id`,`suite_test_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 COMMENT='avg_consequent_diff' AUTO_INCREMENT=8792 ;

-- --------------------------------------------------------

--
-- Table structure for table `awfy_regression_score`
--

CREATE TABLE IF NOT EXISTS `awfy_regression_score` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `regression_id` int(10) unsigned NOT NULL,
  `score_id` int(10) unsigned NOT NULL,
  `noise` tinyint(1) NOT NULL DEFAULT '0',
  `fixed` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `build_id` (`regression_id`,`score_id`),
  KEY `regression_id` (`regression_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=233979 ;

-- --------------------------------------------------------

--
-- Table structure for table `awfy_regression_score_noise`
--

CREATE TABLE IF NOT EXISTS `awfy_regression_score_noise` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `machine_id` int(10) unsigned NOT NULL,
  `mode_id` int(10) unsigned NOT NULL,
  `suite_version_id` int(10) unsigned NOT NULL,
  `noise` double NOT NULL,
  `disabled` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `machine_id` (`machine_id`),
  KEY `mode_id` (`mode_id`),
  KEY `suite_version_id` (`suite_version_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 COMMENT='avg_consequent_diff' AUTO_INCREMENT=766 ;

-- --------------------------------------------------------

--
-- Table structure for table `awfy_regression_status`
--

CREATE TABLE IF NOT EXISTS `awfy_regression_status` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `regression_id` int(11) unsigned NOT NULL,
  `name` varchar(50) NOT NULL,
  `extra` text NOT NULL,
  `stamp` int(11) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `regression_id` (`regression_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=55865 ;

-- --------------------------------------------------------

--
-- Table structure for table `awfy_request`
--

CREATE TABLE IF NOT EXISTS `awfy_request` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `machine` int(10) unsigned NOT NULL,
  `stamp` int(10) unsigned NOT NULL,
  `cset` varchar(255) NOT NULL,
  `finished` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=56 ;

-- --------------------------------------------------------

--
-- Table structure for table `awfy_run`
--

CREATE TABLE IF NOT EXISTS `awfy_run` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `machine` int(10) unsigned NOT NULL,
  `stamp` int(10) unsigned NOT NULL,
  `finish_stamp` int(10) unsigned NOT NULL,
  `status` int(1) NOT NULL,
  `error` mediumtext NOT NULL,
  `detector` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `machine` (`machine`),
  KEY `status` (`status`),
  KEY `stamp` (`stamp`),
  KEY `finish_stamp` (`finish_stamp`)
) ENGINE=MyISAM  DEFAULT CHARSET=latin1 AUTO_INCREMENT=325675 ;

-- --------------------------------------------------------

--
-- Table structure for table `awfy_score`
--

CREATE TABLE IF NOT EXISTS `awfy_score` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `build_id` int(10) unsigned NOT NULL,
  `suite_version_id` int(11) unsigned DEFAULT NULL,
  `score` double DEFAULT NULL,
  `extra_info` text NOT NULL,
  PRIMARY KEY (`id`),
  KEY `suite_id` (`suite_version_id`),
  KEY `build_id` (`build_id`)
) ENGINE=MyISAM  DEFAULT CHARSET=latin1 AUTO_INCREMENT=2127702 ;

-- --------------------------------------------------------

--
-- Table structure for table `awfy_suite`
--

CREATE TABLE IF NOT EXISTS `awfy_suite` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(45) DEFAULT NULL,
  `description` varchar(45) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT NULL,
  `better_direction` int(11) DEFAULT NULL,
  `sort_order` int(11) NOT NULL,
  `visible` int(2) NOT NULL,
  `confidence_factor` float NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `name_UNIQUE` (`name`)
) ENGINE=MyISAM  DEFAULT CHARSET=latin1 AUTO_INCREMENT=18 ;


--
-- Dumping data for table `awfy_suite`
--

INSERT INTO `awfy_suite` (`id`, `name`, `description`, `better_direction`, `sort_order`, `visible`, `confidence_factor`) VALUES
(1, 'ss', 'SunSpider', -1, 10, 1, 1),
(2, 'v8', 'V8 (SS harness)', -1, 0, 0, 1),
(3, 'v8real', 'V8 Benchmark', 1, 0, 0, 1),
(4, 'kraken', 'Kraken', -1, 30, 1, 1),
(5, 'misc', 'Assorted tests', -1, 40, 1, 1),
(6, 'octane', 'Octane', 1, 50, 1, 1),
(7, 'asmjs-ubench', 'asm.js µbench', -1, 60, 1, 1),
(8, 'asmjs-apps', 'asm.js apps', -1, 70, 1, 1),
(9, 'webglsamples', 'webglsamples', -1, 80, 1, 1),
(10, 'dromaeo', 'Dromaeo', 1, 90, 1, 1),
(11, 'massive', 'Massive', 1, 100, 1, 1),
(12, 'jetstream', 'JetStream', 1, 110, 1, 1),
(13, 'speedometer', 'Speedometer', 1, 120, 1, 1),
(15, 'shumway', 'Shumway', 1, 140, 1, 1.3),
(14, 'browsermark', 'Browsermark', 1, 150, 2, 1),
(16, 'assorteddom', 'Assorted DOM', -1, 160, 1, 1),
(17, 'dart', 'Dart2js', -1, 170, 1, 1);

-- --------------------------------------------------------

--
-- Table structure for table `awfy_suite_test`
--

CREATE TABLE IF NOT EXISTS `awfy_suite_test` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `suite_version_id` int(11) NOT NULL,
  `name` varchar(128) NOT NULL,
  `visible` int(1) NOT NULL DEFAULT '1',
  `confidence_factor` float NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `suite_version_id` (`suite_version_id`,`name`),
  KEY `name` (`name`),
  KEY `suite_version_id_2` (`suite_version_id`)
) ENGINE=MyISAM  DEFAULT CHARSET=latin1 AUTO_INCREMENT=923 ;

-- --------------------------------------------------------

--
-- Table structure for table `awfy_suite_version`
--

CREATE TABLE IF NOT EXISTS `awfy_suite_version` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `suite_id` int(10) unsigned NOT NULL,
  `name` varchar(45) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `suite_id` (`suite_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=41 ;

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
) ENGINE=MyISAM  DEFAULT CHARSET=latin1 AUTO_INCREMENT=15 ;

--
-- Dumping data for table `awfy_vendor`
--

INSERT INTO `awfy_vendor` (`id`, `name`, `vendor`, `csetURL`, `browser`, `rangeURL`) VALUES
(1, 'V8', 'Google', 'https://chromium.googlesource.com/v8/v8/+/', 'Chrome', 'https://chromium.googlesource.com/v8/v8/+log/{from}..{to}'),
(2, 'SpiderMonkey', 'Mozilla', 'http://hg.mozilla.org/integration/mozilla-inbound/rev/', 'Firefox', 'http://hg.mozilla.org/integration/mozilla-inbound/pushloghtml?fromchange={from}&tochange={to}'),
(3, 'Nitro', 'Apple', 'http://trac.webkit.org/changeset/', 'Safari', 'http://trac.webkit.org/log/?action=stop_on_copy&mode=stop_on_copy&rev={to}&stop_rev={from}&limit=100'),
(4, 'SpiderMonkey', 'Mozilla', 'http://hg.mozilla.org/projects/ionmonkey/rev/', 'Firefox', 'http://hg.mozilla.org/projects/ionmonkey/pushloghtml?fromchange={from}&tochange={to}'),
(5, 'SpiderMonkey', 'Mozilla', 'http://hg.mozilla.org/integration/mozilla-inbound/rev/', 'Firefox', 'http://hg.mozilla.org/integration/mozilla-inbound/pushloghtml?fromchange={from}&tochange={to}'),
(6, 'SpiderMonkey', 'Mozilla', 'http://hg.mozilla.org/integration/mozilla-inbound/rev/', 'Firefox OS (Nightly)', 'http://hg.mozilla.org/integration/mozilla-inbound/pushloghtml?fromchange={from}&tochange={to}'),
(7, 'clang', 'Apple', '', 'Native C++', ''),
(8, 'gcc', 'GNU', '', 'Native C++', ''),
(9, 'SpiderMonkey', 'Mozilla', 'http://hg.mozilla.org/releases/mozilla-aurora/rev/', 'Firefox OS (Aurora)', 'http://hg.mozilla.org/releases/mozilla-aurora/pushloghtml?fromchange={from}&tochange={to}'),
(10, 'SpiderMonkey', 'Beta', '', 'Firefox OS', ''),
(11, 'SpiderMonkey', '1GB inbound', 'http://hg.mozilla.org/integration/mozilla-inbound/rev/', 'Firefox OS', 'http://hg.mozilla.org/integration/mozilla-inbound/pushloghtml?fromchange={from}&tochange={to}'),
(12, 'SpiderMonkey', '512MB inbound', 'http://hg.mozilla.org/integration/mozilla-inbound/rev/', 'Firefox OS', 'http://hg.mozilla.org/integration/mozilla-inbound/pushloghtml?fromchange={from}&tochange={to}'),
(13, 'SpiderMonkey', '256MB inbound', 'http://hg.mozilla.org/integration/mozilla-inbound/rev/', 'Firefox OS', 'http://hg.mozilla.org/integration/mozilla-inbound/pushloghtml?fromchange={from}&tochange={to}'),
(14, 'V8', 'Google', 'https://chromium.googlesource.com/v8/v8/+/', 'Chrome', 'http://code.google.com/p/v8/source/list?num={num}&start={to}');


-- --------------------------------------------------------

--
-- Table structure for table `control_machine`
--

CREATE TABLE IF NOT EXISTS `control_machine` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `description` text NOT NULL,
  `empty_task` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=3 ;

-- --------------------------------------------------------

--
-- Table structure for table `control_tasks`
--

CREATE TABLE IF NOT EXISTS `control_tasks` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `control_machine_id` int(10) unsigned NOT NULL,
  `busy` tinyint(1) NOT NULL,
  `task` text NOT NULL,
  `start` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `control_machine_id` (`control_machine_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=914 ;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

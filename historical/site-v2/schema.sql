-- phpMyAdmin SQL Dump
-- version 3.3.9
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: Feb 03, 2011 at 12:53 AM
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
) ENGINE=MyISAM  DEFAULT CHARSET=latin1 AUTO_INCREMENT=329903 ;

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
) ENGINE=MyISAM  DEFAULT CHARSET=latin1 AUTO_INCREMENT=12680 ;

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
) ENGINE=MyISAM  DEFAULT CHARSET=latin1 AUTO_INCREMENT=24486 ;

-- --------------------------------------------------------

--
-- Table structure for table `fast_run`
--

CREATE TABLE IF NOT EXISTS `fast_run` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `cpu` varchar(20) NOT NULL,
  `os` varchar(20) NOT NULL,
  `machine` int(10) unsigned NOT NULL,
  `stamp` int(10) unsigned NOT NULL,
  `cset` varchar(160) NOT NULL,
  `status` int(11) NOT NULL,
  `error` mediumtext NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM  DEFAULT CHARSET=latin1 AUTO_INCREMENT=3502 ;

-- phpMyAdmin SQL Dump
-- version 3.3.9
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: Feb 03, 2011 at 12:53 AM
-- Server version: 5.1.41
-- PHP Version: 5.3.5

SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";

--
-- Database: `dvander`
--

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
) ENGINE=MyISAM  DEFAULT CHARSET=latin1 AUTO_INCREMENT=12 ;

--
-- Dumping data for table `awfy_mode`
--

INSERT INTO `awfy_mode` (`id`, `vendor_id`, `mode`, `name`, `color`, `level`) VALUES
(1, 2, 'moom', 'JM', '#000000', 10),
(2, 2, 'mooj', 'TM+JM', '#6f0a93', 1),
(3, 1, 'v8', 'v8', '#4DA74D', 1),
(4, 3, 'jsc', 'jsc', '#cf4b4b', 1),
(5, 3, 'jsci', 'no JIT', '#ef8b8b', 10),
(6, 2, 'j', 'TM', '#ffa451', 10),
(7, 2, 'm', 'JM', '#000000', 10),
(8, 2, 'i', 'no JIT', '#bbbbbb', 10),
(9, 2, 'mj', 'TM+JM', '#6f0a93', 10),
(11, 2, 'tm', '', '', 10);

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
) ENGINE=MyISAM  DEFAULT CHARSET=latin1 AUTO_INCREMENT=5 ;

--
-- Dumping data for table `awfy_suite`
--

INSERT INTO `awfy_suite` (`id`, `name`, `description`, `better_direction`) VALUES
(1, 'ss', 'SunSpider', -1),
(2, 'v8', 'V8 (SS harness)', -1),
(3, 'v8real', 'V8 Benchmark', 1),
(4, 'kraken', 'Kraken', -1);

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
  PRIMARY KEY (`id`)
) ENGINE=MyISAM  DEFAULT CHARSET=latin1 AUTO_INCREMENT=4 ;

--
-- Dumping data for table `awfy_vendor`
--

INSERT INTO `awfy_vendor` (`id`, `name`, `vendor`, `csetURL`, `browser`) VALUES
(1, 'V8', 'Google', 'http://code.google.com/p/v8/source/detail?r=', 'Chrome'),
(2, 'SpiderMonkey', 'Mozilla', 'http://hg.mozilla.org/tracemonkey/rev/', 'Firefox'),
(3, 'Nitro', 'Apple', 'http://trac.webkit.org/changeset/', 'Safari');


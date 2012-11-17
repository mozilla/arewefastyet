-- phpMyAdmin SQL Dump
-- version 3.1.3
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: Apr 23, 2010 at 03:53 AM
-- Server version: 5.1.41
-- PHP Version: 5.2.9

SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";

--
-- Database: `dvander`
--

-- --------------------------------------------------------

--
-- Table structure for table `fast_engine`
--

CREATE TABLE IF NOT EXISTS `fast_engine` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `run` int(10) unsigned NOT NULL,
  `name` varchar(32) NOT NULL,
  `cset` varchar(256) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM  DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

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
) ENGINE=MyISAM  DEFAULT CHARSET=latin1 AUTO_INCREMENT=1;

-- --------------------------------------------------------

--
-- Table structure for table `fast_test`
--

CREATE TABLE IF NOT EXISTS `fast_test` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `run` int(10) unsigned NOT NULL,
  `name` varchar(50) NOT NULL,
  `time_ms` float NOT NULL,
  `suite` varchar(50) NOT NULL,
  `mode` varchar(12) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM  DEFAULT CHARSET=latin1 AUTO_INCREMENT=1;


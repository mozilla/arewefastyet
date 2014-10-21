#!/usr/bin/perl
# Dromaeo Test Suite
# Copyright (c) 2010 John Resig
#
# Permission is hereby granted, free of charge, to any person
# obtaining a copy of this software and associated documentation
# files (the "Software"), to deal in the Software without
# restriction, including without limitation the rights to use,
# copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the
# Software is furnished to do so, subject to the following
# conditions:
#
# The above copyright notice and this permission notice shall be
# included in all copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
# EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
# OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
# NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
# HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
# WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
# FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
# OTHER DEALINGS IN THE SOFTWARE.

my $cur = "", $num = 0;

open(M, "> perf-single/perf-single.manifest");

while (<>) {
	if ( /__start_report:(.*)/ ) {
		$cur = $1;
		$num = 0;
	}

	if ( !/^__/ ) {
		my @parts = split(/:/, $_);
	
		if ( $#parts > 0 ) {
			my $name = $parts[0], $n = $parts[1];
			my $file = `cat dep/run-head.html` . "var onlyName = '$name', onlyNum = $n;\n\n" .
				`cat tests/$cur\.js dep/run-tail.html`;
	
			open(F, "> perf-single/$cur\-$num\.html");
			print F $file;
			close(F);

			print M "% $cur\-$num\.html\n";
		}
	}

	$num++;
}

close(M);

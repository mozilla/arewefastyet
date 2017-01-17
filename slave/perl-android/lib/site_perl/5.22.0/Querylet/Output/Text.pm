use strict;
use warnings;
package Querylet::Output::Text;
{
  $Querylet::Output::Text::VERSION = '0.113';
}
use parent qw(Querylet::Output);
# ABSTRACT: output querylet results to text tables

use Text::Table;


sub default_type { 'text' }


sub handler      { \&_as_text_table }
sub _as_text_table {
	my ($query) = @_;
	my $results = $query->results;
	my $columns = $query->columns;

	my $table = Text::Table->new(map { $query->header($_) } @$columns);
	   $table->load(map { [ @$_{@$columns} ] }  @$results);
	return "$table";
}

1;

__END__

=pod

=head1 NAME

Querylet::Output::Text - output querylet results to text tables

=head1 VERSION

version 0.113

=head1 SYNOPSIS

 use Querylet;
 use Querylet::Output::Text;

 database: dbi:SQLite2:dbname=cpants.db

 query:
   SELECT kwalitee.dist,kwalitee.kwalitee
   FROM   kwalitee
   JOIN   dist ON kwalitee.distid = dist.id
   WHERE  dist.author = 'RJBS'
   ORDER BY kwalitee.dist;

 output format: text

=head1 DESCRIPTION

This module registers an output handler to produce plaintext tables, using
Text::Table.

=head1 METHODS

=head2 default_type

The default type for Querylet::Output::Text is "text"

=head2 handler

The output handler uses Text::Table to print a simple table, suitable for
reading at the console.

=head1 AUTHOR

Ricardo SIGNES <rjbs@cpan.org>

=head1 COPYRIGHT AND LICENSE

This software is copyright (c) 2004 by Ricardo SIGNES.

This is free software; you can redistribute it and/or modify it under
the same terms as the Perl 5 programming language system itself.

=cut

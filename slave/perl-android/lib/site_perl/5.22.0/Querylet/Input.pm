use strict;
use warnings;
package Querylet::Input;
{
  $Querylet::Input::VERSION = '0.401';
}
# ABSTRACT: generic input handler for Querlet::Query

use Carp;


sub import {
	my ($class, $type) = @_;
	$type = $class->default_type unless $type;

	my $handler = $class->handler;

	Querylet::Query->register_input_handler($type => $handler);
}


sub default_type { croak "default_type method unimplemented" }


sub handler { croak "handler method unimplemented" }


"I do endeavor to give satisfaction, sir.";

__END__

=pod

=head1 NAME

Querylet::Input - generic input handler for Querlet::Query

=head1 VERSION

version 0.401

=head1 SYNOPSIS

This is an abstract base class, meant for subclassing.

 package Querylet::Input::Term;
 use base qw(Querylet::Input);

 sub default_type { 'term' }
 sub handler      { \&from_term }  

 sub from_term {
   my ($query, $parameter) = @_;

   print "$parameter: ";
   my $input = <STDIN>;
   chomp $input;
   $query->{input}->{$parameter} = $input;
 }

 1;

Then, in a querylet:

 use Querylet::Input::Term

 query: SELECT * FROM users WHERE userid = ?
 
 input: userid

Or, to override the registered type:

 use Querylet::Input::Term 'stdin';

 output format: stdin

=head1 DESCRIPTION

This class provides a simple way to write input handlers for Querylet, mostly
by providing an import routine that will register the handler with the
type-name requested by the using script.

The methods C<default_type> and C<handler> must exist, as described below.

=head1 IMPORT

Querylet::Input provides an C<import> method that will register the handler
when the module is imported.  If an argument is given, it will be used as the
type name to register.  Otherwise, the result of C<default_type> is used.

=head1 METHODS

=over 4

=item default_type

This method returns the name of the type for which the input handler will be
registered if no override is given.

=item handler

This method returns a reference to the handler, which will be used to register
the handler.

=back

=head1 AUTHOR

Ricardo SIGNES <rjbs@cpan.org>

=head1 COPYRIGHT AND LICENSE

This software is copyright (c) 2004 by Ricardo SIGNES.

This is free software; you can redistribute it and/or modify it under
the same terms as the Perl 5 programming language system itself.

=cut

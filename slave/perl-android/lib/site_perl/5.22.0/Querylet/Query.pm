use strict;
use warnings;
package Querylet::Query;
{
  $Querylet::Query::VERSION = '0.401';
}
# ABSTRACT: renders and performs queries for Querylet

## no critic RequireCarping

use Carp ();


sub new {
	bless {
		bind_parameters => [],
		output_type => 'csv',
		input_type  => 'term'
	} => (shift);
}


sub set_dbh {
	my $self = shift;
	my $dbh = shift;
	$self->{dbh} = $dbh;
}


sub set_query {
	my ($self, $sql) = @_;

	$self->{query} = $sql;
}


sub bind { ## no critic Homonym
	my ($self, @parameters) = @_;
	$self->{bind_parameters} = [ @parameters ];
}


sub bind_more {
	my ($self, @parameters) = @_;
	push @{$self->{bind_parameters}}, @parameters;
}


sub set_query_vars {
	my ($self, $vars) = @_;

	$self->{query_vars} ||= {};
	$self->{query_vars} = { %{$self->{query_vars}}, %$vars };
}


sub render_query {
	my $self = shift;
	my $rendered_query;

	require Template;
	my $tt = new Template;
	$tt->process(\($self->{query}), $self->{query_vars}, \$rendered_query);

	return $rendered_query;
}


sub run {
	my $self = shift;

	$self->{query} = $self->render_query if $self->{query_vars};

	my $sth = $self->{dbh}->prepare($self->{query});
	   $sth->execute(@{$self->{bind_parameters}});

	$self->{columns} = $sth->{NAME};

	$self->{results} = $sth->fetchall_arrayref({});
}


sub results {
	my $self = shift;
	return $self->{results} if $self->{results};
	$self->run;
}


sub set_results {
	my $self = shift;
	$self->{results} = shift;
}


sub columns {
	my $self = shift;
	return $self->{columns} if $self->{columns};
	$self->run;
	return $self->{columns};
}


sub set_columns {
	my $self = shift;
	$self->{columns} = shift;
}


sub header {
	my $self   = shift;
	my $column = shift;
	return exists $self->{headers}{$column}
		? $self->{headers}{$column}
		: $column;
}


sub set_headers {
	my $self    = shift;
	my $headers = shift;
	while (my ($column, $header) = each %$headers) {
		$self->{headers}{$column} = $header;
	}
}


sub option {
	my ($self, $option_name) = @_;
	return $self->scratchpad->{$option_name} unless @_ > 2;
	return $self->scratchpad->{$option_name} = $_[2];
}


sub scratchpad {
	my $self = shift;
	$self->{scratchpad} = {} unless $self->{scratchpad};
	return $self->{scratchpad};
}


my %input_handler;

sub input_type {
	my $self = shift;
	return $self->{input_type} unless @_;
	return $self->{input_type} = shift;
}


sub input {
	my ($self, $parameter) = @_;

	$self->{input} = {} unless $self->{input};
	return $self->{input}->{$parameter} if exists $self->{input}->{$parameter};

	unless ($input_handler{$self->input_type}) {
		warn "unknown input type: ", $self->input_type," \n";
		return;
	} else {
		$input_handler{$self->input_type}->($self, $parameter);
	}
}


sub register_input_handler {
	shift;
	my ($type, $handler) = @_;
	$input_handler{$type} = $handler;
}


sub output_filename {
	my $self = shift;
	return $self->{output_filename} unless @_;

	my $filename = shift;

	$self->write_type($filename ? 'file' : undef);
	return $self->{output_filename} = $filename;
}


my %write_handler;

sub write_type {
	my $self = shift;
	return $self->{write_type} unless @_;
	return $self->{write_type} = shift;
}


my %output_handler;

sub output_type {
	my $self = shift;
	return $self->{output_type} unless @_;
	return $self->{output_type} = shift;
}


sub output {
	my $self = shift;

	return $self->{output} if exists $self->{output};

	unless ($output_handler{$self->output_type}) {
		warn "unknown output type: ", $self->output_type," \n";
		return;
	} else {
		$self->{output} = $output_handler{$self->output_type}->($self);
		unless ($self->{output}) {
			warn "no output received from output handler!\n";
			return;
		}
		return $self->{output};
	}
}


sub write { ## no critic Homonym
	my ($self) = @_;

	$self->write_type('stdout') unless $self->write_type;

	unless ($write_handler{$self->write_type}) {
		warn "unknown write type: ", $self->write_type," \n";
		return;
	} else {
		$write_handler{$self->write_type}->($self);
	}
}


sub write_output {
	my ($self) = @_;
	my $output = $self->output;

	if (ref $output eq 'CODE') {
		warn "using coderef output, but write_type set\n" if $self->write_type;
		$output->($self->output_filename);
	} else {
		$self->write($self);
	}
}


sub register_output_handler {
	shift;
	my ($type, $handler) = @_;
	$output_handler{$type} = $handler;
}


__PACKAGE__->register_output_handler(csv   => \&as_csv);
sub as_csv {
	my $q = shift;
	my $csv;
	my $results = $q->results;
	my $columns = $q->columns;
	$csv = join(q{,}, map { $q->header($_) } @$columns) . "\n";
	foreach my $row (@$results) {
		$csv .= join(q{,},
              map { (my $v = defined $_ ? $_ : q{}) =~ s/"/\\"/g; qq!"$v"! }
              @$row{@$columns}
            )
         .  "\n";
	}

	return $csv;
}


__PACKAGE__->register_output_handler(template => \&as_template);
__PACKAGE__->register_output_handler(html     => \&as_template);
sub as_template {
	my $query = shift;
	my $output;
	my $template = $query->option('template_file');
	unless ($template) {
		$template = \(<<'END')
<html>
  <head>
    <title>results of query</title>
  </head>
  <body>
    <table>
      <tr>
      [% FOREACH column = query.columns %]
        <th>[% query.header(column) %]</th>
      [% END %]
      </tr>
      [% FOREACH row = query.results %]
      <tr>[% FOREACH column = query.columns -%]<td>[%- row.$column -%]</td>[%- END %]</tr>[% END %]
    </table>
  </body>
</html>
END
	}

	require Template;
	my $tt = new Template({ RELATIVE => 1});
	$tt->process($template, { query => $query }, \$output);
	return $output;
}


sub register_write_handler {
	shift;
	my ($type, $handler) = @_;
	$write_handler{$type} = $handler;
}


__PACKAGE__->register_write_handler(file => \&to_file);
sub to_file {
	my ($query) = @_;

	if ($query->output_filename) {
		if (open(my $output_file, '>', $query->output_filename)) {
			binmode $output_file;
			print $output_file $query->output;
			close $output_file;
		} else {
			warn "can't open " . $query->output_filename . " for output\n";
			return;
		}
	}
}


__PACKAGE__->register_write_handler(stdout => \&to_stdout);
sub to_stdout {
	my ($query) = @_;
	print $query->output || '';
}


__PACKAGE__->register_input_handler(term => \&from_term);
sub from_term {
	my ($q, $parameter) = @_;

	print "enter $parameter: ";
	my $value = <STDIN>;
	chomp $value;
	$q->{input}->{$parameter} = $value;
}


"I do endeavor to give satisfaction, sir.";

__END__

=pod

=head1 NAME

Querylet::Query - renders and performs queries for Querylet

=head1 VERSION

version 0.401

=head1 SYNOPSIS

 use DBI;
 my $dbh = DBI->connect('dbi:Pg:dbname=drinks');
 
 use Querylet::Query;
 # Why am I using this package?  I'm a human, not Querylet!

 my $q = new Querylet::Query;

 $q->set_dbh($dbh);

 $q->set_query("
   SELECT *
   FROM   drinks d
   WHERE  abv > [% min_abv %]
     AND  ? IN (
            SELECT liquor FROM ingredients WHERE i i.drink_id = d.drink_id
          )
   ORDER BY d.name
 ");

 $q->set_query_vars({ min_abv => 25 });

 $q->bind("rum");

 $q->run;

 $q->output_type('html');

 $q->output;

=head1 DESCRIPTION

Querylet::Query is used by Querylet-generated code to make that code go.  It
renders templatized queries, executes them, and hangs on to the results until
they're ready to go to output.

This module is probably not particularly useful outside of its use in code
written by Querylet, but there you have it.

=head1 METHODS

=over 4

=item new

  Querylet::Query->new;

This creates and returns a new Querylet::Query.

=item set_dbh

  $q->set_dbh($dbh);

This method sets the database handle to be used for running the query.

=item set_query

  $q->set_query($query);

This method sets the query to run.  The query may be a plain SQL query or a
template to be rendered later.

=item bind

  $q->bind(@parameters);

This method sets the bind parameters, overwriting any existing parameters.

=item bind_more

  $q->bind_more(@parameters);

This method pushes the given parameters onto the list of bind parameters to use
when executing the query.

=item set_query_vars

  $q->set_query_vars(\%variables);

This method sets the given variables, to be used when rendering the query.
It also indicates that the query that was given is a template, and should be
rendered.  (In other words, if this method is called at least once, even with
an empty hashref, the query will be considered a template, and rendered.)

Note that if query variables are set, but the template rendering engine can't
be loaded, the program will die.

=item render_query

  $q->render_query;

This method renders the query using a templating engine (Template Toolkit, by
default) and returns the result.  This method is called internally by the run
method, if query variables have been set.

Normal Querylet code will not need to call this method.

=item run

  $q->run;

This method runs the query and sets up the results.  It is called internally by
the results method, if the query has not yet been run.

Normal Querylet code will not need to call this method.

=item results

  $q->results;

This method returns the results of the query, first running the query (by
calling C<run>) if needed.

The results are returned as a reference to an array of rows, each row a
reference to a hash.  These are not copies, and may be altered in place.

=item set_results

  $q->set_results( \@new_results );

This method replaces the result set with the provided results.  This method
does not call the results method, so if the query has not been run, it will not
be run by this method.

=item columns

  $q->columns;

This method returns the column names (as an arrayref) for the query's results.
The query will first be run (by calling C<run>) if needed.

=item set_columns

  $q->set_columns( \@new_columns );

This method replaces the list of column names for the current query result.  It
does not call the columns method, so if the query has not been run, it will not
be run by this method.

=item header

  $q->header( $column );

This method returns the header name for the given column, or the column name,
if none is defined.

=item set_headers

  $q->set_headers( \%headers );

This method sets up header names for columns.  It's passed a list of
column-header pairs, which it stores for lookup with the C<header> method.

=item option

  $q->option($option_name);

This method returns the named option's value.  At present, this just retrieves
a scratchpad entry.

=item scratchpad

  $q->scratchpad;

This method returns a reference to a hash for general-purpose note-taking.
I've put this here for really simple, mediocre communication between handlers.
I'm tempted to warn you that it might go away, but I think it's unlikely.  

=item input_type

  $q->input_type($type);

This method sets or retrieves the input type, which is used to find the input
handler.

=item input

  $q->input($parameter);

This method tells the Query to ask the current input handler to request that
the named parameter be received from input.

=item register_input_handler

  Querylet::Query->register_input_handler($type => \&handler);

This method registers an input handler routine for the given type.

If a type is registered that already has a handler, the old handler is quietly
replaced.  (This makes replacing the built-in, naive handlers quite painless.)

=item output_filename

  $q->output_filename($filename);

This method sets a filename to which output should be directed.

If called with no arguments, it returns the name.  If called with C<undef>, it
unassigns the currently assigned filename.

=item write_type

  $q->write_type($type);

This method sets or retrieves the write-out method for the query.

=item output_type

  $q->output_type($type);

This method sets or retrieves the format of the output to be generated.

=item output

  $q->output;

This method tells the Query to send the current results to the proper output
handler and return them.  If the outputs have already been generated, they are
not re-generated.

=item write

  $q->write;

This method tells the Query to send its formatted output to the writing handler
and return them.

=item write_output

  $q->write_output;

This method tells the Query to write the query output.  If no filename has been
set for output, the results are just printed.

If the result of the output method is a coderef, the coderef will be evaluated
and nothing will be printed.

=item register_output_handler

  Querylet::Query->register_output_handler($type => \&handler);

This method registers an output handler routine for the given type.  (The
prototype sort of documents itself, doesn't it?)

It can be called on an instance, too.  It doesn't mind.

If a type is registered that already has a handler, the old handler is quietly
replaced.  (This makes replacing the built-in, naive handlers quite painless.)

=item as_csv

  as_csv($q);

This is the default, built-in output handler.  It outputs the results of the
query as a CSV file.  That is, a series of comma-delimited fields, with each
record separated by a newline.

If a output filename was specified, the output is sent to that file (unless it
exists).  Otherwise, it's printed standard output.

=item as_template

  as_template($q);

This is the default, built-in output handler.  It outputs the results of the
query by rendering a template using Template Toolkit.  If the option
"template_file" is set, the file named in that option is used as the template.
If no template_file is set, a built-in template is used, generating a simple
HTML document.

This handler is by default registered to the types "template" and "html".

=item register_write_handler

  Querylet::Query->register_write_handler($type => \&handler);

This method registers a write handler routine for the given type.

If a type is registered that already has a handler, the old handler is quietly
replaced.

=item to_file

This write handler sends the output to a file on the disk.

=item to_stdout

This write handler sends the output to the currently selected output stream.

=item from_term($q, $parameter)

This is a simple built-in input handler to prompt the user interactively for
parameter inputs.  It is the default input handler.

=back

=head1 SEE ALSO

L<Querylet>, L<Querylet::Input>, L<Querylet::Output>

=head1 AUTHOR

Ricardo SIGNES <rjbs@cpan.org>

=head1 COPYRIGHT AND LICENSE

This software is copyright (c) 2004 by Ricardo SIGNES.

This is free software; you can redistribute it and/or modify it under
the same terms as the Perl 5 programming language system itself.

=cut

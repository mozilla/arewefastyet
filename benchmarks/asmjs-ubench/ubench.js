// vim: set ts=2 sw=2 tw=99 et:

var __BENCHMARK__;
var __ARGV__ = (function (argv) {
  var i = 0;
  if (argv[i] == '--')
    i++;
  if (argv.length > i)
    __BENCHMARK__ = argv[i++];
  return argv.slice(i, argv.length);
})(arguments || scriptArgs);

var scriptArgs = __ARGV__;
var arguments = __ARGV__;

function RunBenchmark(file)
{
  var begin = Date.now();
  load(file);
  return Date.now() - begin;
}

function main(argv)
{
  if (!__BENCHMARK__) {
    print('No file given!');
    return quit();
  }

  var file = __BENCHMARK__.replace('.js', '');

  print(RunBenchmark(file + '.js'));
}

main(arguments);


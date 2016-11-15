#!/bin/bash

echo -e "copy - \c"
$1 ubench.js -- copy.js 4
echo -e "corrections - \c"
$1 ubench.js -- corrections.js 4
echo -e "fannkuch - \c"
$1 ubench.js -- fannkuch.js 4
echo -e "fasta - \c"
$1 ubench.js -- fasta.js 4
echo -e "life - \c"
$1 ubench.js -- life.js 4
echo -e "memops - \c"
$1 ubench.js -- memops.js 4
echo -e "primes- \c"
$1 ubench.js -- primes.js 4
echo -e "skinning - \c"
$1 ubench.js -- skinning.js 4
echo -e "mandelbrot-native - \c"
$1 ubench.js -- mandelbrot-native.js 4
echo -e "mandelbrot-polyfill - \c"
$1 ubench.js -- mandelbrot-polyfill.js 4
echo -e "fbirds-native - \c"
$1 ubench.js -- fbirds-native.js 4
echo -e "fbirds-polyfill - \c"
$1 ubench.js -- fbirds-polyfill.js 4

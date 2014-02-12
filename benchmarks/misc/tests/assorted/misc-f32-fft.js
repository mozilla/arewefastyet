Math.fround = Math.fround || function(x) { return x };

var ITERATIONS = 2000;
var SIZE = Math.pow(2, 11);

// Float32
/**
* FFT is a class for calculating the Discrete Fourier Transform of a signal
* with the Fast Fourier Transform algorithm.
*
* Source: github.com/corbanbrook/dsp.js; License: MIT; Copyright: Corban Brook
*
* @param {Number} bufferSize The size of the sample buffer to be computed. Must be power of 2
* @param {Number} sampleRate The sampleRate of the buffer (eg. 44100)
*
* @constructor
*/
FFT32 = function(bufferSize, sampleRate) {
  var f32 = Math.fround;
  this.bufferSize = bufferSize;
  this.sampleRate = sampleRate;
  this.spectrum = new Float32Array(bufferSize/2);
  this.real = new Float32Array(bufferSize);
  this.imag = new Float32Array(bufferSize);

  this.sinTable = new Float32Array(bufferSize);
  this.cosTable = new Float32Array(bufferSize);

  this.reverseTable = new Uint32Array(bufferSize);

  var limit = 1;
  var bit = bufferSize >> 1;

  while ( limit < bufferSize ) {
    for ( var i = 0; i < limit; i++ ) {
      this.reverseTable[i + limit] = this.reverseTable[i] + bit;
    }
    limit = limit << 1;
    bit = bit >> 1;
  }

  var minusPi = -f32(Math.PI);
  for ( var i = 0; i < bufferSize; i++ ) {
    var j = f32(i), minusPi = f32(minusPi);
    this.sinTable[i] = Math.sin(f32(minusPi/j));
    this.cosTable[i] = Math.cos(f32(minusPi/j));
  }
};

/**
* Performs a forward tranform on the sample buffer.
* Converts a time domain signal to frequency domain spectra.
*
* @param {Array} buffer The sample buffer. Buffer Length must be power of 2
*
* @returns The frequency spectrum array
*/
FFT32.prototype.forward = function(buffer) {
  // Locally scope variables for speed up
  var f32 = Math.fround;
  var bufferSize = this.bufferSize,
      cosTable = this.cosTable,
      sinTable = this.sinTable,
      reverseTable = this.reverseTable,
      real = this.real,
      imag = this.imag,
      spectrum = this.spectrum;

  var k = Math.floor(Math.log(bufferSize) / Math.LN2);
  if ( Math.pow(2, k) !== bufferSize ) {
    throw "Invalid buffer size, must be a power of 2.";
  }
  if ( bufferSize !== buffer.length ) {
    throw "Supplied buffer is not the same size as defined FFT. FFT Size: " + bufferSize + " Buffer Size: " + buffer.length;
  }

  for ( var i = 0; i < bufferSize; i++ ) {
    real[i] = buffer[reverseTable[i]];
    imag[i] = 0;
  }

  var halfSize = 1,
      phaseShiftStepReal,       // Float32
      phaseShiftStepImag,       // Float32
      currentPhaseShiftReal,    // Float32
      currentPhaseShiftImag,    // Float32
      off,                      // Integer
      tr,                       // Float32
      ti,                       // Float32
      tmpReal,                  // Float32
      i;                        // Integer

  while ( halfSize < bufferSize ) {
    phaseShiftStepReal = cosTable[halfSize];
    phaseShiftStepImag = sinTable[halfSize];
    currentPhaseShiftReal = 1;
    currentPhaseShiftImag = 0;

    for ( var fftStep = 0; fftStep < halfSize; fftStep++ ) {
      i = fftStep;

      while ( i < bufferSize ) {
        off = i + halfSize;
        tr = f32(f32(currentPhaseShiftReal * real[off]) - f32(currentPhaseShiftImag * imag[off]));
        ti = f32(f32(currentPhaseShiftReal * imag[off]) + f32(currentPhaseShiftImag * real[off]));

        real[off] = real[i] - tr;
        imag[off] = imag[i] - ti;
        real[i] = real[i] + tr;
        imag[i] = imag[i] + ti;

        i += halfSize << 1;
      }

      tmpReal = currentPhaseShiftReal;
      currentPhaseShiftReal = f32(f32(tmpReal * phaseShiftStepReal) - f32(currentPhaseShiftImag * phaseShiftStepImag));
      currentPhaseShiftImag = f32(f32(tmpReal * phaseShiftStepImag) + f32(currentPhaseShiftImag * phaseShiftStepReal));
    }

    halfSize = halfSize << 1;
  }

  i = bufferSize/2;
  while(i--) {
    spectrum[i] = f32(2 * f32(Math.sqrt(f32(f32(real[i] * real[i]) + f32(imag[i] * imag[i]))))) / f32(bufferSize);
  }

  return spectrum;
};
/* end of FFT */

var spectrumMaxs= [];
var isTimePropertyValid= true;

var fft32 = new FFT32(SIZE, 44100);

function audioAvailable32(e) {
  fft32.forward(e.frameBuffer);
  var spectrum = fft32.spectrum;
  // Finding pick frequency
  var maxValue = spectrum[0];
  for(var i=0;i<spectrum.length;i++) {
    maxValue = Math.fround(maxValue);
    if(maxValue < spectrum[i]) {
      maxValue = spectrum[i];
    }
  }
}

function compute() {
    var frameBuffer = new Float32Array(SIZE);

    var e = {
        frameBuffer: frameBuffer,
    };
    for (var i = 0; i < SIZE; ++i) {
        e.frameBuffer[i] = (i / SIZE) * 2 - 1;
    }

    for (var n = ITERATIONS; n--; ) {
        audioAvailable32(e);
    }
}

function runBenchmark() {
    for (var n = 5; n; --n) {
        compute();
    }
}
runBenchmark();


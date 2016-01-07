
var benchmarks = ['Mandelbrot GPU', 'Mandelbrot Script',
  'Instantiate & Destroy', 'CryptoHash Script', 'Animation & Skinning',
  'Asteroid Field', 'Particles', 'Physics Meshes', 'Physics Cubes',
  'Physics Spheres', '2D Physics Spheres', '2D Physics Boxes', 'AI Agents'];

var results = [];
var product_of_results = 1.0;

function processText(text) {
  var test = text.split(':');

  if (test[0] === 'Overall') {
    // Add Overall result to results
    results.push({
      benchmark: 'Overall',
      result: parseFloat(test[1])
    });

    // Post results back to Mozbench
    postResults();
    return;
  }

  // We haven't reach the end. Let's check if we have a possible result.
  for (var i = 0 ; i < benchmarks.length; i++) {
    if (test[0] === benchmarks[i]) {
      // Add benchmark result to results
      results.push({
        benchmark: test[0],
        result: parseFloat(test[1])
      });
      product_of_results *= parseFloat(test[1]);
      break;
    }
  }
}

function postResults() {

  results.push({
    benchmark: "Geometric Mean",
    result: Math.round(Math.pow(product_of_results, 1.0/results.length))
  });

  var xmlHttp = new XMLHttpRequest();
  xmlHttp.open("POST", "/results", true);
  xmlHttp.setRequestHeader("Content-type",
                            "application/x-www-form-urlencoded");
  // We need to use encodeURIComponent because of the '&' in benchmark names.
  xmlHttp.send("results=" + encodeURIComponent(JSON.stringify(results)));
}


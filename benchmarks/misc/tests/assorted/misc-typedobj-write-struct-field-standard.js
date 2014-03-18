// Paired with misc-typedobj-write-struct-field-typedobj.js

function write(out, v0) {
  out.pos[0] = v0[0];
  out.pos[1] = v0[1];
  out.pos[2] = v0[2];

  out.nor[0] += v0[0];
  out.nor[1] += v0[1];
  out.nor[2] += v0[2];
}

function main() {
  var start_time, end_time;

  var p = { pos: [0, 0, 0],
            nor: [0, 0, 0] };
  var v = [1, 2, 3];
  var len = 192 * 10 * 1024;

  if (typeof TIME !== "undefined")
    start_time = Date.now();

  for (var i = 0; i < len; i++) {
    v[0] = i+0.5;
    v[1] = i+1.5;
    v[2] = i+2.5;
    write(p, v);
  }

  if (typeof TIME !== "undefined") {
    end_time = Date.now();
    print("Elapsed:", (end_time - start_time));
  }
}

main();

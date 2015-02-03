// only run this test in spidermonkey. V8 and JSC are really bad at this.
if (typeof snarf === "undefined")
    shouldrun = false;

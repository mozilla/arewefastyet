RUNNER = dep/run/runner.js
TESTS = tests/*.js
HTMLTESTS = tests/*.html
RESULTS = results
PERF = perf
WEB = web
TALOS = talos
PERFSINGLE = perf-single

all: spidermonkey rhino tamarin jscore

talos: web
	@@ rm -rf ${TALOS}
	@@ mv ${WEB} ${TALOS}
	@@ echo "Generating talos tests..."
	@@ for i in talos/tests/*.html; do \
		TEST=`echo "$${i}" | sed s/.html// | sed s/talos.tests.//`; \
		echo "Converting $${TEST} to talos test..."; \
		sed "s/<head>/<head><!-- MOZ_INSERT_CONTENT_HOOK --><script>var limitSearch='$${TEST}';<\/script>/" talos/index.html > \
			"talos/$${TEST}.html"; \
		echo "% $${TEST}.html" >> talos/dromaeo.manifest; \
	done

web: ${TESTS}
	@@ rm -rf ${WEB}
	@@ cp -fR dep/web ${WEB}
	@@ mkdir ${WEB}/tests
	@@ cp -f tests/MANIFEST.json ${WEB}/tests/MANIFEST.json
	@@ for i in ${TESTS}; do \
		echo "Converting $${i} to web test..."; \
		cat dep/web/test-head.html "$${i}" dep/web/test-tail.html | \
			sed "s/startTest.\(.*\).;/startTest\(\1, '`crc32 $${i}`'\);/" | \
			sed "s/startTest/window.onload = function(){ startTest/" | \
			sed "s/endTest..;/endTest(); };/" > \
			${WEB}/`echo "$${i}"|sed s/.js//`.html; \
	done
	@@ for i in ${HTMLTESTS}; do \
		echo "Converting $${i} to web test..."; \
		cat "$${i}" | \
			sed "s/startTest.\(.*\).;/startTest\(\1, '`crc32 "$${i}"`'\);/" > ${WEB}"/$${i}"; \
	done

perf: ${TESTS}
	@@ mkdir -p ${PERF}
	@@ cp -f ${RUNNER} ${PERF}/
	@@ for i in ${TESTS}; do \
		echo "Converting $${i} to perf test..."; \
		cat dep/perf/head.html "$${i}" dep/perf/tail.html > \
			${PERF}/`echo "$${i}"|sed s/.js//|sed s/tests.//`.html; \
	done

perf-single: ${TESTS}
	@@ mkdir -p ${PERFSINGLE}
	@@ cp -f ${RUNNER} ${PERFSINGLE}/
	@@ echo "Generating single perf tests..."
	@@ perl dep/perf/single.pl ${RESULTS}/spidermonkey.txt

results: ${TESTS}
	@@ mkdir -p ${RESULTS}
	@@ cp -f dep/results/* ${RESULTS}/
	@@ mkdir -p ${RESULTS}/spidermonkey
	@@ mkdir -p ${RESULTS}/spidermonkey-patch
	@@ mkdir -p ${RESULTS}/rhino
	@@ mkdir -p ${RESULTS}/tamarin
	@@ mkdir -p ${RESULTS}/jscore

spidermonkey: results ${TESTS}
	@@ echo "" > ${RESULTS}/spidermonkey.txt
	@@ for i in ${TESTS}; do \
		echo "Testing $${i} in Spidermonkey"; \
		cat ${RUNNER} "$${i}" | ./dep/run/js >> \
			${RESULTS}/spidermonkey.txt; \
	done

rhino: results ${TESTS}
	@@ echo "" > ${RESULTS}/rhino.txt
	@@ for i in ${TESTS}; do \
		echo "Testing $${i} in Rhino"; \
		cat ${RUNNER} "$${i}" > "$${i}.tmp"; \
		java -server -jar dep/run/js.jar -opt 9 "$${i}.tmp" >> \
			${RESULTS}/rhino.txt; \
		rm -f "$${i}.tmp"; \
	done

tamarin: results ${TESTS}
	@@ echo "" > ${RESULTS}/tamarin.txt
	@@ for i in ${TESTS}; do \
		echo "Testing $${i} in Tamarin"; \
		java -jar dep/run/asc.jar -import dep/run/builtin.abc -in ${RUNNER} "$${i}" &> /dev/null; \
		./dep/run/shell `echo "$${i}"|sed s/.js//`.abc >> \
			${RESULTS}/tamarin.txt; \
		rm `echo "$${i}"|sed s/.js//`.abc; \
	done

jscore: results ${TESTS}
	@@ echo "" > ${RESULTS}/jscore.txt
	@@ for i in ${TESTS}; do \
		echo "Testing $${i} in JavaScriptCore"; \
		cat ${RUNNER} "$${i}" > "$${i}.tmp"; \
		./dep/run/testkjs "$${i}.tmp" 2> /dev/null | sed s/--\>.//g >> \
			${RESULTS}/jscore.txt; \
		rm -f "$${i}.tmp"; \
	done

clean:
	@@ rm -rf ${PERF}
	@@ rm -rf ${PERFSINGLE}
	@@ rm -rf ${RESULTS}
	@@ rm -rf ${WEB}

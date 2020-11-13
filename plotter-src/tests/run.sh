#!/bin/bash

files=`ls *.json`

echo "Checking how plotter works with json input"
for i in $files; do
    echo -n "Try $i ... "
    ../build/plotter -j $i -o $i 1>/dev/null || exit 1
    echo "OK"
done

echo "Checking how plotter works with web API"
echo -n "Chart ... "
../build/plotter -i 12 1>/dev/null || exit 1
echo OK

echo -n "Chart (2 plots) ... "
../build/plotter -i 12 13 1>/dev/null || exit 1
echo OK

echo -n "Chart ratio ... "
../build/plotter -i 12 13 -r 12 1>/dev/null || exit 1
echo OK

echo -n "Histogram ... "
../build/plotter -i 133907 1>/dev/null || exit 1
echo OK

echo -n "Histogram (2 plots) ... "
../build/plotter -i 133907 183754 1>/dev/null || exit 1
echo OK

echo -n "Histogram ratio ... "
../build/plotter -i 133907 183754 -r 133907 1>/dev/null || exit 1
echo OK

echo -n "Labelled histograms ... "
../build/plotter -i 257463 1>/dev/null || exit 1
echo OK

echo -n "Labelled histograms (2 plots) ... "
../build/plotter -i 257463 257559 1>/dev/null || exit 1
echo OK

echo -n "Labelled histograms ratio ... "
../build/plotter -i 257463 257559 -r 257463 1>/dev/null || exit 1
echo OK
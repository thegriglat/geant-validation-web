## About

Produce scientific quality plots for [GeantValidationPortal](https://gitlab.cern.ch/GeantValidation/GVP) using ROOT6

## Requirements

* compiler with supporting C++11
* ROOT6
* libcurl
* cmake (build only)
* make (build only)
* libcurl-devel (build only)

## Build

```
git clone https://gitlab.cern.ch/GeantValidation/plotter.git
cd plotter
mkdir build
cd build
cmake ..  # to build plotter with curl interface
make
```

## Usage

```
plotter
    [--reference REFERENCE]
    [--ids IDS [IDS...]]
    [--yaxis YAXIS]
    [--xaxis XAXIS]
    [--xmin XMIN]
    [--xmax XMAX]
    [--ymin YMIN]
    [--ymax YMAX]
    [--output OUTPUT]
```

```
getchi2 id0 id1
```
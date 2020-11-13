cmake_minimum_required(VERSION 2.8.9 FATAL_ERROR)
project(plotter CXX)

set(CMAKE_BUILD_TYPE "Release")

set(CMAKE_CXX_FLAGS                "${CMAKE_CXX_FLAGS} -fPIC -Wall -Werror")
if ("${CMAKE_CXX_COMPILER_ID}" STREQUAL "Clang")
  set(CMAKE_CXX_FLAGS                "${CMAKE_CXX_FLAGS} -Wextra")
endif()
set(CMAKE_CXX_FLAGS_RELEASE        "-O3 -DNDEBUG -Wall ")
SET(CMAKE_EXE_LINKER_FLAGS "-Wl,--as-needed" CACHE STRING "LINKER FLAGS" FORCE)
set(HOST "https://geant-val.cern.ch" CACHE STRING "Site host with http/https prefix")
set(STDCPP_STATIC OFF CACHE BOOL "link libstdc++.a statically")
set(CURL_SSLNOVERIFY OFF CACHE BOOL "Should curl verify certificates")

include(CheckCXXCompilerFlag)

CHECK_CXX_COMPILER_FLAG("-std=c++1y" COMPILER_SUPPORTS_CXX1Y)
CHECK_CXX_COMPILER_FLAG("-std=c++11" COMPILER_SUPPORTS_CXX11)
CHECK_CXX_COMPILER_FLAG("-std=c++0x" COMPILER_SUPPORTS_CXX0X)

if(COMPILER_SUPPORTS_CXX11)
  set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -std=c++11")
else()
  message(FATAL_ERROR "The compiler ${CMAKE_CXX_COMPILER} has no C++11 support.")
endif()

set(CMAKE_MODULE_PATH ${PROJECT_SOURCE_DIR}/modules ${CMAKE_MODULE_PATH})

message(STATUS ${CMAKE_MODULE_PATH})
#find_package(CURL REQUIRED NO_DEFAULT_PATH)


set (CURL_DIR $ENV{CURL_DIR})
find_package(CURL REQUIRED)

if(CURL_FOUND)
    message(STATUS "Curl library is found")
else()
    message(STATUS "Curl package is not found")
endif()

set (ROOTSYS $ENV{ROOTSYS})
set (ROOT_FIND_COMPONENTS Core RIO Tree)
  # usage of ROOTConfig.cmake is disabled for the moment.
find_file(ROOT_CONFIG ROOTConfig.cmake HINTS $ENV{ROOTSYS} ${ROOTSYS} ${ROOT_DIR} NO_DEFAULT_PATH PATH_SUFFIXES cmake)
if (ROOT_CONFIG)
       message(STATUS "ROOTConfig.cmake found and will be used: ${ROOT_CONFIG}")
       include(${ROOT_CONFIG})
       message(STATUS "ROOT use file: ${ROOT_USE_FILE}")
       include(${ROOT_USE_FILE})
       if(ROOT_LIBRARIES AND ROOT_INCLUDE_DIRS)
         set(ROOT_FOUND TRUE)
       endif()
else()
       message(STATUS "ROOTConfig.cmake not found, trying to use FindROOT.cmake...")
       find_package(ROOT QUIET REQUIRED COMPONENTS Core Cint RIO Tree)
    endif()

message(STATUS "ROOT includes: ${ROOT_INCLUDE_DIRS}")
message(STATUS "ROOT libraries: ${ROOT_LIBRARIES}")
message(STATUS "ROOT_FOUND: ${ROOT_FOUND}")
message (STATUS "HOST: ${HOST}")
add_definitions("-DHOST=\"${HOST}\"")

set (stdcppa)
if (STDCPP_STATIC)
  add_definitions("-static-libgcc")
  execute_process(COMMAND g++ -print-file-name=libstdc++.a OUTPUT_VARIABLE stdcppa OUTPUT_STRIP_TRAILING_WHITESPACE)
  message (STATUS "Static stdc++: ${stdcppa}")
endif()

if (CURL_SSLNOVERIFY)
  add_definitions("-DCURL_SSLNOVERIFY")
  message(STATUS "CURL certificate verification is disabled")
endif()

file(GLOB libgvp_sources ${PROJECT_SOURCE_DIR}/src/GVP/*.cc)
file(GLOB plotter_sources ${PROJECT_SOURCE_DIR}/src/plotter.cc)
file(GLOB plotter_headers ${PROJECT_SOURCE_DIR}/src/include/*.h*)

set(exec_link GVP ${ROOT_LIBRARIES} ${CURL_LIBRARIES} ${stdcppa})

add_library(GVP STATIC ${libgvp_sources})

include_directories(${CMAKE_CURRENT_SOURCE_DIR}/src/include ${ROOT_INCLUDE_DIRS} ${CURL_INCLUDE_DIRS})
link_directories(${ROOT_LIBRARY_DIRS} ${CURL_LIBRARY_DIRS})

add_executable(plotter ${plotter_sources})
target_link_libraries(plotter ${exec_link})
install(TARGETS plotter DESTINATION bin)

install(TARGETS GVP DESTINATION lib)
install(FILES ${plotter_headers} DESTINATION include)

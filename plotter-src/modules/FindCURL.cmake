# - Find curl
# Find the native CURL headers and libraries.
#
#  CURL_INCLUDE_DIRS   - where to find curl/curl.h, etc.
#  CURL_LIBRARIES      - List of libraries when using curl.
#  CURL_FOUND          - True if curl found.
#  CURL_VERSION_STRING - the version of curl found (since CMake 2.8.8)

#=============================================================================
# Copyright 2006-2009 Kitware, Inc.
# Copyright 2012 Rolf Eike Beer <eike@sf-mail.de>
#
# Distributed under the OSI-approved BSD License (the "License");
# see accompanying file Copyright.txt for details.
#
# This software is distributed WITHOUT ANY WARRANTY; without even the
# implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
# See the License for more information.
#=============================================================================
# (To distribute this file outside of CMake, substitute the full
#  License text for the above reference.)

# Look for the header file.
message(STATUS "CURL_ROOT_DIR = " ${CURL_ROOT_DIR})
message(STATUS "CURL_DIR = " ${CURL_DIR})

find_path(CURL_INCLUDE_DIR NAMES curl/curl.h PATHS ${CURL_ROOT_DIR}/include ${CURL_DIR}/include /usr/include/ NO_DEFAULT_PATH)
mark_as_advanced(CURL_INCLUDE_DIR)
message(STATUS "CURL_INCLUDE_DIR " ${CURL_INCLUDE_DIR} )


# Look for the library (sorted from most current/relevant entry to least).
find_library(CURL_LIBRARY NAMES
    curl
  # Windows MSVC prebuilts:
    curllib
    libcurl_imp
    curllib_static
  # Windows older "Win32 - MSVC" prebuilts (libcurl.lib, e.g. libcurl-7.15.5-win32-msvc.zip):
    libcurl
    PATHS ${CURL_ROOT_DIR}/lib ${CURL_DIR}/lib /usr/lib/ /usr/lib/x86_64-linux-gnu/ NO_DEFAULT_PATH  
)
mark_as_advanced(CURL_LIBRARY)

# handle the QUIETLY and REQUIRED arguments and set CURL_FOUND to TRUE if
# all listed variables are TRUE
INCLUDE(FindPackageHandleStandardArgs)
FIND_PACKAGE_HANDLE_STANDARD_ARGS(CURL
                                  REQUIRED_VARS CURL_LIBRARY CURL_INCLUDE_DIR
                                  VERSION_VAR)

if(CURL_FOUND)
  set(CURL_LIBRARIES ${CURL_LIBRARY})
  set(CURL_INCLUDE_DIRS ${CURL_INCLUDE_DIR})
endif()

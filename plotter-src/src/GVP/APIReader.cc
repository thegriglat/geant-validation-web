
#include <iostream>
#include <string>
#include <vector>
#include <cmath>

#include <stdlib.h>
#include <stdio.h>

#include <sstream>

#include <json.hpp>

#include <curl/curl.h>

#include <APIReader.h>

using std::vector;
using std::string;
using std::cout;
using std::endl;
using json = nlohmann::json;


#ifndef HOST
#define HOST "https://geant-val.cern.ch";
#endif


static size_t curl_write(void *contents, size_t size, size_t nmemb, std::string *s)
{
    size_t newLength = size * nmemb;
    size_t oldLength = s->size();
    try {
        s->resize(oldLength + newLength);
    } catch (std::bad_alloc &e) {
        //handle memory problem
        return 0;
    }

    std::copy((char *) contents, (char *) contents + newLength, s->begin() + oldLength);
    return size * nmemb;
}

Record APIReader::getDataByID(const int recordId)
{
    return Record(getJSON("/api/get/" + std::to_string(recordId)));
}

json APIReader::getJSON(const string query)
{
    CURL *curl;

    std::string dbresponse;

    curl = curl_easy_init();
    if (curl) {
#ifdef CURL_SSLNOVERIFY
        curl_easy_setopt(curl, CURLOPT_SSL_VERIFYPEER, false);
#endif
        curl_easy_setopt(curl, CURLOPT_URL, (HOST + query).c_str());
        curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, curl_write);
        curl_easy_setopt(curl, CURLOPT_WRITEDATA, &dbresponse);
        curl_easy_perform(curl);
        /* always cleanup */
        curl_easy_cleanup(curl);
    }
    return json::parse(dbresponse.c_str());
}







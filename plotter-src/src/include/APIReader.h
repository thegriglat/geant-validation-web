#ifndef DBACCESS_H
#define DBACCESS_H

#include "Record.h"
#include <json.hpp>

namespace APIReader
{
    Record getDataByID(const int recordId);
    nlohmann::json getJSON (const std::string query);
};

#endif


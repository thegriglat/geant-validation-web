#include <fstream>
#include <iostream>
#include <algorithm>

#include "Record.h"

using std::cout;
using std::endl;
using std::map;
using std::ofstream;
using std::string;
using std::vector;
using json = nlohmann::json;

void RG::InitTH1F(const char *name, const char *title, Int_t nbinsx, const Float_t *xbins)
{
    _th1f = new TH1F(name, title, nbinsx, xbins);
}

void RG::InitTH1FLabel(const char *name, const char *title, Int_t nbinsx)
{
    _th1f = new TH1F(name, title, nbinsx, 1, nbinsx + 1);
}

void RG::InitTGraphAsymmErrors(Int_t n, const Float_t *x, const Float_t *y, const Float_t *exl,
                               const Float_t *exh, const Float_t *eyl, const Float_t *eyh)
{
    _tgae = new TGraphAsymmErrors(n, x, y, exl, exh, eyl, eyh);
    _tgae->SetEditable(0);
}

Int_t RG::GetN() const
{
    if (IsTH1F())
    {
        return GetTH1F()->GetXaxis()->GetNbins();
    };
    if (IsTGraphAsymmErrors())
    {
        return GetTGraphAsymmErrors()->GetN();
    }
    return 0;
}

TObject *RG::Get() const
{
    if (IsTH1F())
    {
        return GetTH1F();
    };
    if (IsTGraphAsymmErrors())
    {
        return GetTGraphAsymmErrors();
    }
    return new TObject();
}

vector<Double_t> RG::GetX() const
{
    vector<Double_t> xvals;
    if (IsTH1F())
    {
        for (Int_t i = 1; i < GetN() + 1; i++)
        {
            xvals.push_back(GetTH1F()->GetBinCenter(i));
        }
    };
    if (IsTGraphAsymmErrors())
    {
        Double_t *x = GetTGraphAsymmErrors()->GetX();
        for (Int_t i = 0; i < GetN(); ++i)
        {
            xvals.push_back(x[i]);
        }
    }
    return xvals;
}

vector<Double_t> RG::GetY() const
{
    vector<Double_t> yvals;
    if (IsTH1F())
    {
        for (Int_t i = 1; i < GetN() + 1; i++)
        {
            yvals.push_back(GetTH1F()->GetBinContent(i));
        }
    };
    if (IsTGraphAsymmErrors())
    {
        Double_t *y = GetTGraphAsymmErrors()->GetY();
        for (Int_t i = 0; i < GetN(); ++i)
        {
            yvals.push_back(y[i]);
        }
    }
    return yvals;
}

vector<Double_t> RG::GetErrorsY() const
{
    vector<Double_t> val;
    for (int i = 0; i < GetN(); ++i)
    {
        val.push_back(GetErrorY(i));
    }
    return val;
}

Double_t RG::GetErrorY(Int_t id) const
{
    if (IsTH1F())
    {
        return GetTH1F()->GetBinError(id + 1);
    };
    if (IsTGraphAsymmErrors())
    {
        return GetTGraphAsymmErrors()->GetErrorY(id);
    }
    return 0;
}

vector<Double_t> RG::GetErrorsX() const
{
    vector<Double_t> val;
    for (int i = 0; i < GetN(); ++i)
    {
        val.push_back(GetErrorX(i));
    }
    return val;
}

Double_t RG::GetErrorX(Int_t id) const
{
    if (IsTH1F())
    {
        return GetTH1F()->GetBinCenter(id + 1) - GetTH1F()->GetBinLowEdge(id + 1);
    };
    if (IsTGraphAsymmErrors())
    {
        return GetTGraphAsymmErrors()->GetErrorX(id);
    }
    return 0;
}

Double_t RG::GetXMin() const
{
    Double_t min = GetX()[0];
    for (auto n : GetX())
        if (n < min)
            min = n;
    return min;
}
Double_t RG::GetXMax() const
{
    Double_t max = GetX()[0];
    for (auto n : GetX())
        if (n > max)
            max = n;
    return max;
}

Double_t RG::GetYMin() const
{
    if (IsTH1F())
        return GetTH1F()->GetMinimum();
    if (IsTGraphAsymmErrors())
        return GetTGraphAsymmErrors()->GetMinimum();
    return std::numeric_limits<double>::min();
}
Double_t RG::GetYMax() const
{
    if (IsTH1F())
        return GetTH1F()->GetMaximum();
    if (IsTGraphAsymmErrors())
        return GetTGraphAsymmErrors()->GetMaximum();
    return std::numeric_limits<double>::max();
}

int RG::GetNPointsInArea(const double x1, const double y1, const double x2, const double y2) const
{
    int N = 0;
    vector<Double_t> yvals = GetY();
    vector<Double_t> xvals = GetX();
    Double_t x, y;
    for (size_t i = 0; i < yvals.size(); ++i)
    {
        x = xvals[i];
        y = yvals[i];
        if ((x >= x1 && x < x2) && (y >= y1 && y < y2))
            N++;
    }
    return N;
}

template <typename T>
static vector<T> json2iterable(json v)
{
    vector<T> result;
    for (size_t i = 0; i != v.size(); i++)
        result.push_back(v[i].get<T>());
    return result;
}

void Record::initializeTH1F()
{
    const bool labels_enable = hasLabels();
    vector<string> labels;
    if (labels_enable)
        labels = data["histogram"]["binLabel"].get<vector<string>>();
    vector<float> v_binMin;
    size_t nBins = 0;
    if (!labels_enable)
    {
        v_binMin = json2iterable<float>(data["histogram"]["binEdgeLow"]);
        const auto v_binMax = json2iterable<float>(data["histogram"]["binEdgeHigh"]);
        std::vector<float> xbins = v_binMin;
        for (auto xbin : v_binMax)
        {
            if (std::find(xbins.begin(), xbins.end(), xbin) == xbins.end())
                xbins.push_back(xbin);
        }
        std::sort(xbins.begin(), xbins.end());
        for (auto e : xbins)
        {
            std::cout << "bin: " << e << std::endl;
        }
        // for (size_t i = 0; i < v_binMax.size(); i++)
        // x_val.push_back((v_binMax[i] + v_binMin[i]) / 2.f);
        // v_binMin.push_back(v_binMax[v_binMax.size() - 1]);
        InitTH1F("TH1F", "TH1F", xbins.size() - 1, &xbins[0]);
        nBins = xbins.size();
    }
    else
    {
        InitTH1FLabel("TH1F", "TH1F", labels.size());
        nBins = labels.size();
    };
    auto y_val = json2iterable<float>(data["histogram"]["binContent"]);
    auto yerrp = mergeErrors(data["histogram"], "y", "Plus");

    if (!labels_enable)
    {
        for (size_t i = 0; i < v_binMin.size(); ++i)
        {
            auto ibin = GetTH1F()->FindBin(v_binMin.at(i));
            GetTH1F()->SetBinContent(ibin, y_val[i]);
            GetTH1F()->SetBinError(ibin, yerrp[i]);
        }
    }
    else
    {
        for (size_t i = 0; i < nBins; ++i)
        {
            GetTH1F()->SetBinContent(i + 1, y_val[i]);
            if (labels_enable)
            {
                if (i < labels.size())
                    GetTH1F()->GetXaxis()->SetBinLabel(i + 1, labels[i].c_str());
            }
            if (i < yerrp.size())
            {
                GetTH1F()->SetBinError(i + 1, yerrp[i]);
            }
        };
    }
}

bool Record::hasLabels() const
{
    if (data.find("histogram") == data.end())
        return false;
    const json j = data["histogram"];
    if (j.find("binLabel") == j.end())
        return false;
    const json l = j["binLabel"];
    if (l.empty())
        return false;
    return true;
}

void Record::initializeTGraphAsymmErrors()
{
    auto x_val = json2iterable<float>(data["chart"]["xValues"]);
    auto y_val = json2iterable<float>(data["chart"]["yValues"]);
    auto xerrp = mergeErrors(data["chart"], "x", "Plus");
    auto xerrm = mergeErrors(data["chart"], "x", "Minus");
    auto yerrp = mergeErrors(data["chart"], "y", "Plus");
    auto yerrm = mergeErrors(data["chart"], "y", "Minus");

    InitTGraphAsymmErrors((int)x_val.size(), &x_val[0], &y_val[0], &xerrm[0], &xerrp[0], &yerrm[0], &yerrp[0]);
}

vector<float> Record::mergeErrors(const json &obj, const string axis, const string dir) const
{
    const string estat = axis + "StatErrors" + dir;
    const string esys = axis + "SysErrors" + dir;
    const auto eesys = json2iterable<float>(obj[esys]);
    const auto eestat = json2iterable<float>(obj[estat]);
    if (eesys.size() == 0)
        return eestat;
    if (eestat.size() == 0)
        return eesys;
    if (eestat.size() != eesys.size())
    {
        vector<float> dummy;
        return dummy;
    }
    vector<float> errors;
    for (size_t i = 0; i < eesys.size(); ++i)
    {
        errors.push_back(
            sqrt(
                (eesys[i] * eesys[i] + eestat[i] * eestat[i])));
    }
    return errors;
}

Record::Record(json data_)
{
    data = data_;
    string type = data["plotType"].get<string>();
    string histo_container_name;
    if (type.compare("TH1") == 0)
    {
        initializeTH1F();
        histo_container_name = "histogram";
    }
    else if (type.compare("SCATTER2D") == 0)
    {
        initializeTGraphAsymmErrors();
        histo_container_name = "chart";
    }
    _version = data["mctool"]["version"];
    _xAxisName = data[histo_container_name]["xAxisName"];
    _yAxisName = data[histo_container_name]["yAxisName"];
    _observable = data["metadata"]["observableName"].get<string>();
    _reaction = data["metadata"]["reaction"].get<string>();
    _target = data["metadata"]["targetName"].get<string>();
    _beamParticle = data["metadata"]["beamParticle"].get<string>();
    _secondaryParticle = data["metadata"]["secondaryParticle"].get<string>();
    _mcmodel = data["mctool"]["model"].get<string>();
    _mcname = data["mctool"]["name"].get<string>();
    _beam_energies = json2iterable<float>(data["metadata"]["beamEnergies"]);

    const json j_parameters = data["metadata"]["parameters"];
    for (size_t i = 0; i < j_parameters.size(); ++i)
    {
        _parameters[j_parameters[(int)i]["names"].get<string>()] = j_parameters[(int)i]["values"].get<string>();
    };
    _inspireId = data["article"]["inspireId"].get<int>();
    if (data.find("id") != data.end())
        _id = data["id"].get<int>();
};

string Record::GetParameterByName(string name) const
{
    auto parameters = GetParameters();
    auto it = parameters.find(name);
    if (it != parameters.end())
    {
        return it->second;
    }
    else
    {
        return "";
    }
}

void Record::TH1F_to_TGraphAsymmErrors()
{
    _tgae = new TGraphAsymmErrors(_th1f);
    data["chart"] = data["histogram"];
    _th1f = 0;
}

void Record::dumpField(std::ofstream &file, PointField field, std::string prefix)
{
    vector<double> data;
    string varname;
    switch (field)
    {
    case X:
        data = GetX();
        varname = "x";
        break;
    case Y:
        data = GetY();
        varname = "y";
        break;
    case XERROR:
        data = GetErrorsX();
        varname = "xerrors";
        break;
    case YERROR:
        data = GetErrorsY();
        varname = "yerrors";
        break;
    };
    const auto len = data.size();
    file << "double " << prefix << "_" << varname << "[" << len << "] = {" << endl;
    for (size_t i = 0; i < len; ++i)
    {
        file << "  " << data[i];
        if (i != len - 1)
            file << ",";
        file << endl;
    }
    file << "};" << endl;
};

bool Record::dumpPoints(string filename, string prefix)
{
    ofstream file;
    file.open(filename, std::ios::app);
    if (!file.is_open())
    {
        cout << "Cannot open file " << filename << " for writing.";
        return false;
    };
    if (IsTH1F())
        TH1F_to_TGraphAsymmErrors();
    // add some header
    if (GetId() != -1)
    {
        // show only available data
        file << "// Link: https://geant-val.cern.ch/records/" << GetId() << endl
             << "// Id:                 " << ((_id != -1) ? std::to_string(_id) : "---") << endl;
    }
    // end header
    file << "// Tool:               " << _mcname << endl
         << "// Version:            " << _version << endl
         << "// Model:              " << _mcmodel << endl
         << "// Observable:         " << _observable << endl
         << "// Target:             " << _target << endl
         << "// Beam Particle:      " << _beamParticle << endl
         << "// Secondary Particle: " << _secondaryParticle << endl;
    if (_parameters.size() != 0)
        file << "// Parameters:" << endl;
    for (auto it = _parameters.begin(); it != _parameters.end(); it++)
    {
        file << "//   " << it->first << " = " << it->second << endl;
    };
    file << endl;
    dumpField(file, X, prefix);
    dumpField(file, Y, prefix);
    dumpField(file, XERROR, prefix);
    dumpField(file, YERROR, prefix);
    file.close();
    return true;
};
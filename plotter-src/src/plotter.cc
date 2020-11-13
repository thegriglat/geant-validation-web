// c++

#include <iostream>
#include <fstream>
#include <sstream>
#include <iomanip>
#include <string>
#include <vector>
#include <map>
#include <set>
#include <cmath>
#include "math.h"
#include <algorithm>
#include <time.h>
#include <regex>

// ROOT
#include <TCanvas.h>
#include <TGraphAsymmErrors.h>
#include <TROOT.h>
#include <TError.h>
#include <TStyle.h>
#include <TMultiGraph.h>
#include <THStack.h>
#include <TLegend.h>
#include <TPave.h>
#include <TPaveText.h>
#include <TH1F.h>
#include <TLatex.h>
#include <TPad.h>
#include <TColor.h>
#include <TPRegexp.h>
#include <TGaxis.h>

#include <Record.h>

#include <cstdlib>
#include "colors.hpp"
#include "chi2.hpp"
#include "argparse.hpp"

#include <APIReader.h>

using namespace std;

Int_t gErrorIgnoreLevel = kError;

#define DEFAULT_RATIO_X_LIMIT 0.1

#define LEGEND_YPERCENT_PER_ROW  0.04
#define LEGEND_BOTTOM_PADDING 0.02
#define DETAILBOX_TOP_PADDING 0.955

#define RATIO_PAD_HEIGHT 0.25
#define MAX_RATIO_DIFF 2.0

// emphyrical constant to increase ratio font
#define RESOLUTION_DEFAULT 2.0

#define DEFAULT_MARKER_SIZE RESOLUTION_DEFAULT
#define DEFAULT_MARKER_STYLE 20

#define DEFAULT_LINE_STYLE 1
#define DEFAULT_LINE_WIDTH ((RESOLUTION_DEFAULT > 1) ? RESOLUTION_DEFAULT : 1)

#define AXIS_TITLE_SIZE 0.04
#define AXIS_TITLE_OFFSET 1.5

#define LABEL_SIZE 0.038
#define LABEL_OFFSET 0.013

#define LEGEND_TEXT_SIZE 0.025
#define LOGO_TEXT_SIZE 0.02
#define TITLE_SIZE 0.030

#define RATIO_FONT_CONSTANT 2.2

#define RATIO_HIST_XLEFT 0.91

enum RatioType {RATIO, DIFF};

int color_index = 0;
int GetNextColor()
{
    int c = TColor::GetColor(CSSCOLORS[color_index][0], CSSCOLORS[color_index][1], CSSCOLORS[color_index][2]);
    color_index++;
    return c;
}

void _initColors()
{
    for (auto i: CSSCOLORS) {
        TColor::GetColor(i[0], i[1], i[2]);
    }
}

struct PlotStyle {
    PlotStyle()
        : markerColor(0)
        , markerStyle(DEFAULT_MARKER_STYLE)
        , markerSize(DEFAULT_MARKER_SIZE)
        , lineStyle(DEFAULT_LINE_STYLE)
        , lineWidth(DEFAULT_LINE_WIDTH)
        , lineColor(0)
    {
    }
    int markerColor;
    int markerStyle;
    float markerSize;
    int lineStyle;
    float lineWidth;
    int lineColor;
};

static string toROOTLaTeX(const string &s)
{
    return regex_replace(s, regex("\\\\"), "#");
}

static double getLegendHeight(const int nrecords, const int ncolumns = 2)
{
    if (nrecords <= ncolumns)
        return LEGEND_YPERCENT_PER_ROW;
    else
        return LEGEND_YPERCENT_PER_ROW * div(nrecords - 1, ncolumns).quot;
}

static double getRatio(const double value, const double reference, const RatioType type)
{
    return (type == RATIO) ? value / reference : ((value - reference) / reference);
}

static void setPadStyle(TPad *pad)
{
    pad->SetGrid(1, 1);
    pad->SetBorderMode(0);
    pad->SetFillStyle(0);
    pad->SetTopMargin(0.065);
    pad->SetRightMargin(0.045);
    pad->SetLeftMargin(0.125);
    pad->SetBottomMargin(0.11);
    pad->SetTickx();
    pad->SetTicky();
}



template <typename T>
static std::string to_string_with_precision(const T a_value, const int n = 6)
{
    std::ostringstream out;
    out << std::setprecision(n) << a_value;
    return out.str();
}


static string getExperimentName(const int inspireId)
{
    const json expname = APIReader::getJSON("/api/inspire?id=" + std::to_string(inspireId))[0]["expname"];
    if (expname.is_null()) {
        return "exp. data";
    } else {
        return expname.get<string>();
    }
}

static Double_t getEps(const vector<Double_t> &xvector, const double limit = DEFAULT_RATIO_X_LIMIT)
{
    if (xvector.size() < 1) return limit;
    Double_t eps = std::fabs(xvector[1] - xvector[0]);
    if (xvector.size() == 2) return eps * limit;
    for (size_t i = 2; i < xvector.size(); ++i)
        if (std::fabs(xvector[i] - xvector[i - 1]) < eps)
            eps = std::fabs(xvector[i] - xvector[i - 1]);
    return eps * limit;
}

static Double_t getMinAbsElement(vector<Double_t> &vec)
{
    Double_t minidx = 0;
    Double_t min = vec[0];
    for (size_t i = 1; i < vec.size(); ++i)
        if (std::fabs(vec[i]) < std::fabs(min)) {
            min = vec[i];
            minidx = i;
        }
    return vec[minidx];
}

static vector <pair<Double_t, Double_t>> getVectorIntersection(const vector<Double_t> &v1, const vector<Double_t> &v2)
{
    const Double_t eps = getEps(v1, 0.1);
    vector<pair<Double_t, Double_t>> result;
    for (auto& i: v1) {
        vector<Double_t> diffs;
        for (auto &j: v2)
            if (std::fabs(i - j) < eps)
                diffs.push_back(j - i);
        if (diffs.size() != 0)
            result.push_back(
                make_pair(i, i + getMinAbsElement(diffs))
            );
    };
    return result;
}

static Double_t getRatioError(const Double_t y, const Double_t yerr, const Double_t ry, const Double_t ryerr)
{
    if (y * ry == 0) return 0;
    // max difference ratio
    return y / ry * (yerr / y + ryerr / ry);
}

static void updateTAxisStyle(TAxis* axis, const string type, const string title, const bool isRatio = false)
{
    const double coeff = (isRatio) ? RATIO_FONT_CONSTANT : 1.;
    axis->SetTitle(toROOTLaTeX(title).c_str());
    axis->SetLabelSize(LABEL_SIZE * coeff);
    axis->SetTitleSize(AXIS_TITLE_SIZE * coeff);
    if (type == "X") {
        // axis->SetNdivisions(20505);
    } else {
        axis->CenterTitle();
        axis->SetLabelOffset(LABEL_OFFSET);
        if (isRatio)
            axis->SetTitleOffset(1.3 / RATIO_FONT_CONSTANT);
        else
            axis->SetTitleOffset(AXIS_TITLE_OFFSET);
    }
}

enum AUTOLOG {AUTO, LOG, LIN};

static clock_t tStart;

static void timestamp(const string str)
{
    clock_t now = clock();
    cout << "TIMER [" << str << "]: " << (double)(now - tStart)/CLOCKS_PER_SEC << " seconds" << endl;
    tStart = now;
}


int main(int argc, const char* argv[])
{
    _initColors();
    tStart = clock();

    // command line parser

    ArgumentParser parser;

    // add some arguments to search for
    parser.addArgument("-j", "--json", '+');
    parser.addArgument("-i", "--ids", '+');
    parser.addArgument("-r", "--reference", 1);
    parser.addArgument("-y", "--yaxis", 1);
    parser.addArgument("-x", "--xaxis", 1);
    parser.addArgument("--xmin", 1);
    parser.addArgument("--xmax", 1);
    parser.addArgument("--ymin", 1);
    parser.addArgument("--ymax", 1);
    parser.addArgument("--only-ratio", 1);
    parser.addArgument("--ratio-type", 1);
    parser.addArgument("-f", "--formats", '*');
    parser.addArgument("-s", "--style", '*');
    parser.addArgument("-o", "--output", 1);
    parser.addArgument("--ratiohist", 1);
    parser.addArgument("-h", "--help");

    parser.parse(argc, argv);
    vector<int> ids;
    vector<Record> myrecords;
    int reference_id = -1;
    string fname = "";
    string stdin_text = "";
    bool isReadedFromStdin = false;
    bool isReadedFromJSON = false;
    vector<string> output_ext = {};
    RatioType rtype = DIFF;
    if (parser.retrieve< vector<string> >("ids").size() == 0 && parser.retrieve< vector<string> >("json").size() == 0) {
        cout <<
             "Usage: plotter\n"
             "  -j, --json JSON [JSON...]]            # Paths for plottings from JSON files.\n"
             "  -i, --ids IDS [IDS...]                # Plot Ids from GeantValidation database. \n"
             "  -r, --reference REFERENCE             # Reference Id. Supported only with --ids option.\n"
             "  --only-ratio 0|1                      # Plot ratio and nothing else.\n"
             "  --ratio-type ratio|diff               # Type of ratio plot.\n"
             "  -x, --xaxis XAXIS                     # Type of X axis. Supported types: auto, lin, log.\n"
             "  -y, --yaxis YAXIS                     # Type of Y axis. Supported types: auto, lin, log.\n"
             "  --xmin XMIN                           # Value of X axis minimum.\n"
             "  --xmax XMAX                           # Value of X axis maximum.\n"
             "  --ymin YMIN                           # Value of Y axis minimum.\n"
             "  --ymax YMAX                           # Value of Y axis maximum.\n"
             "  -f, --formats [FORMATS FORMATS...]    # Output formats (ROOT-based): root, png, pdf, eps, svg ...\n"
             "                                        # Default is root and png.\n"
             "  -s, --style [STYLE STYLE...]          # Plot style properties in key=value format.\n"
             "                                        # Supported keys are markerSize, markerStyle, lineStyle, lineWidth.\n"
             "                                        # Value should be float.\n"
             "  -o, --output OUTPUT                   # Output prefix for files.\n"
             "  --ratiohist 0|1                       # Output ratio histogram on plot.\n"
             "  -h, --help                            # This help"
             << endl;
    }
    if (parser.retrieve< vector<string> >("formats").size() != 0) {
        for (auto f: parser.retrieve< vector<string> >("formats")) {
            if (find(output_ext.begin(), output_ext.end(), f) == output_ext.end()) {
                output_ext.push_back(f);
            }
        }
    }
    if (parser.retrieve<string>("reference").size() != 0) {
        reference_id = atoi(parser.retrieve<string>("reference").c_str());
        cout << "Reference id = " << reference_id << endl;
    }

    if (parser.retrieve<string>("ratio-type").size() != 0) {
        rtype = (parser.retrieve<string>("ratio-type") == "diff") ? DIFF : RATIO;
    }

    bool only_ratio = false;

    if (parser.retrieve<string>("only-ratio").size() != 0) {
        only_ratio = (bool) atoi(parser.retrieve<string>("only-ratio").c_str());
    }
    bool ratio_histogram_enable = false;
    if (parser.retrieve<string>("ratiohist").size() != 0) {
        ratio_histogram_enable = (bool) atoi(parser.retrieve<string>("ratiohist").c_str());
    }

    if (parser.retrieve< vector<string> >("ids").size() != 0) {
        for (auto id_str: parser.retrieve< vector<string> >("ids")) ids.push_back(atoi(id_str.c_str()));
        for (size_t id_idx = 0; id_idx < ids.size(); ++id_idx) {
            cout << "Id " << ids[id_idx] << " requested for plotting" << endl;
            fname += std::to_string(ids[id_idx]);
            if (id_idx != ids.size() - 1)
                fname += "_";
            myrecords.push_back(APIReader::getDataByID(ids[id_idx]));
        }
        timestamp("finished HTTP API requests for data");
    } else if (parser.retrieve< vector<string> >("json").size() != 0) {
        vector<string> jargs = parser.retrieve< vector<string> >("json");
        for (auto jsonfilename: jargs) {
            // check file exists
            ifstream i(jsonfilename);
            if (!i.good()) {
                // file not exists
                cout << "File " << jsonfilename << " does not exists. Exit." << endl;
                return 0;
            }
            cout << "JSON file " << jsonfilename << " requested for plotting" << endl;
            fname += jsonfilename + "_" ;
            json j;
            // read json
            i >> j;
            myrecords.push_back(Record(j));
        }
        fname = fname.substr(0, fname.back());
        isReadedFromJSON = true;
        timestamp("finished reading JSON from files");
    } else {
        cout << "Reading from stdin ..." << endl;
        string line;
        while (getline(cin, line)) stdin_text += line;
        json j = json::parse(stdin_text);
        for (auto& elem : j) myrecords.push_back(Record(elem));
        fname = "output";
        isReadedFromStdin = true;
        timestamp("finished reading JSON from stdin");
    }
    AUTOLOG arg_yaxis = AUTO;
    AUTOLOG arg_xaxis = AUTO;
    if (parser.retrieve<string>("yaxis").size() != 0) {
        const auto s = parser.retrieve<string>("yaxis");
        if (s.compare("log") == 0) {
            arg_yaxis = LOG;
        } else if(s.compare("lin") == 0) {
            arg_yaxis = LIN;
        } else {
            arg_yaxis = AUTO;
        }
    } else {
        arg_yaxis = AUTO;
    }

    if (parser.retrieve<string>("xaxis").size() != 0) {
        const auto s = parser.retrieve<string>("xaxis");
        if (s.compare("log") == 0) {
            arg_xaxis = LOG;
        } else if(s.compare("lin") == 0) {
            arg_xaxis = LIN;
        } else {
            arg_xaxis = AUTO;
        }
    } else {
        arg_xaxis = AUTO;
    }
    cout << "X axis: " << ((arg_xaxis == AUTO) ? "AUTO" : ((arg_xaxis == LIN) ? "LIN" : "LOG")) << endl;
    cout << "Y axis: " << ((arg_yaxis == AUTO) ? "AUTO" : ((arg_yaxis == LIN) ? "LIN" : "LOG")) << endl;
    string output;
    if (parser.retrieve<string>("output").size() != 0) {
        output = parser.retrieve<string>("output");
    } else {
        output = "";
    }
    double xmin = 0, xmax = 0, ymin = 0, ymax = 0;
    bool xmin_set = false, xmax_set = false, ymin_set = false, ymax_set = false;
    if (parser.count("xmin") == 1) {
        xmin = stod(parser.retrieve<string>("xmin"));
        xmin_set = true;
    }
    if (parser.count("xmax") == 1) {
        xmax = stod(parser.retrieve<string>("xmax"));
        xmax_set = true;
    }
    if (parser.count("ymin") == 1) {
        ymin = stod(parser.retrieve<string>("ymin"));
        ymin_set = true;
    }
    if (parser.count("ymax") == 1) {
        ymax = stod(parser.retrieve<string>("ymax"));
        ymax_set = true;
    }
    PlotStyle mystyle;
    if (parser.retrieve< vector<string> >("style").size() != 0) {
        for (auto keyval: parser.retrieve< vector<string> >("style")) {
            string key = keyval.substr(0, keyval.find("="));
            string val = keyval.substr(keyval.find("=") + 1);
            if (key.compare("markerSize") == 0) {
                mystyle.markerSize = stof(val) * RESOLUTION_DEFAULT;
            }
            if (key.compare("markerStyle") == 0) {
                mystyle.markerStyle = stof(val);
            }
            if (key.compare("lineStyle") == 0) {
                mystyle.lineStyle = stof(val);
            }
            if (key.compare("lineWidth") == 0) {
                mystyle.lineWidth = stof(val) * RESOLUTION_DEFAULT;
            }
        }
    }
    timestamp("finished cli interface. starts ROOT stuff");
    // end command line parser

    const double legendTopY = LEGEND_BOTTOM_PADDING + getLegendHeight(myrecords.size());


    // TMultiGraph* mg = new TMultiGraph;
    TLegend* legend = new TLegend(0., LEGEND_BOTTOM_PADDING, 1.0, legendTopY);

    //for (auto i: myrecords) cout << "ids: " << i.GetJSON()["id"].get<int>() << endl;

    TMultiGraph* mg = new TMultiGraph();
    THStack* thstack = new THStack();

    bool haslabels = false;
    for (size_t i = 0; i < myrecords.size(); ++i) {
        if (myrecords[i].hasLabels()) {
            haslabels = true;
            break;
        }
    }

    // filter records by haslabels
    myrecords.erase(remove_if(
                        myrecords.begin(),
                        myrecords.end(),
    [haslabels](const Record r) {
        return r.hasLabels() != haslabels;
    }
                    ), myrecords.end()
                   );

    const string observable_name = myrecords[0].GetObservable();
    double glob_min_x = 10000000;
    double glob_max_x = -10000000;
    double glob_min_y = 10000000;
    double glob_max_y = -10000000;

    set<string> targets;
    for (size_t i = 0; i < myrecords.size(); ++i) {
        targets.insert(myrecords[i].GetTarget());
    }
    bool headertarget = targets.size() == 1 ? true : false;

    set<string> models;
    for (size_t i = 0; i < myrecords.size(); ++i) {
        models.insert(myrecords[i].GetMCModel());
    }
    bool headermodel = models.size() == 1 ? true : false;

    set<string> tools;
    for (size_t i = 0; i < myrecords.size(); ++i) {
        tools.insert(myrecords[i].GetMCName());
    }
    bool headertool = tools.size() == 1 ? true : false;
    Double_t local_min_x = 0, local_max_x = 0;
    for (size_t i = 0; i < myrecords.size(); ++i) {
        local_min_x = myrecords[i].GetXMin();
        local_max_x = myrecords[i].GetXMax();
        auto local_min_y = myrecords[i].GetYMin();
        auto local_max_y = myrecords[i].GetYMax();

        if (arg_xaxis == AUTO) {
            if (local_min_x < glob_min_x)
                glob_min_x = local_min_x;
            if (local_max_x > glob_max_x)
                glob_max_x = local_max_x;
        }
        if (arg_yaxis == AUTO) {
            if (local_min_y < glob_min_y)
                glob_min_y = local_min_y;
            if (local_max_y > glob_max_y)
                glob_max_y = local_max_y;
        }

        std::cout << myrecords[i].GetTarget() << "  " << myrecords[i].GetYAxisName()
                  << std::endl;
        // attach new color
        if (myrecords[i].GetMCModel().compare("experiment") == 0) {
            mystyle.markerColor = TColor::GetColor(0, 0, 0); // black color for experiment data
        } else {
            mystyle.markerColor = GetNextColor();
        }
        bool converted = false;
        if (myrecords[i].IsTH1F() and !haslabels) {
            myrecords[i].TH1F_to_TGraphAsymmErrors();
            converted = true;
        }
        if (!haslabels) {
            myrecords[i].GetTGraphAsymmErrors()->SetMarkerStyle(mystyle.markerStyle);
            myrecords[i].GetTGraphAsymmErrors()->SetMarkerColor(mystyle.markerColor);
            myrecords[i].GetTGraphAsymmErrors()->SetLineColor(mystyle.markerColor);
            if (myrecords[i].GetMCModel().compare("experiment") != 0)
                myrecords[i].GetTGraphAsymmErrors()->SetMarkerSize(mystyle.markerSize);
            else
                myrecords[i].GetTGraphAsymmErrors()->SetMarkerSize(DEFAULT_MARKER_SIZE);
            myrecords[i].GetTGraphAsymmErrors()->SetLineWidth(mystyle.lineWidth);
            myrecords[i].GetTGraphAsymmErrors()->SetLineStyle(mystyle.lineStyle);
        } else {
            myrecords[i].GetTH1F()->SetMarkerStyle(mystyle.markerStyle);
            myrecords[i].GetTH1F()->SetMarkerColor(mystyle.markerColor);
            myrecords[i].GetTH1F()->SetLineColor(mystyle.markerColor);
            if (myrecords[i].GetMCModel().compare("experiment") != 0)
                myrecords[i].GetTH1F()->SetMarkerSize(mystyle.markerSize);
            else
                myrecords[i].GetTH1F()->SetMarkerSize(DEFAULT_MARKER_SIZE);
            myrecords[i].GetTH1F()->SetLineWidth(mystyle.lineWidth);
            myrecords[i].GetTH1F()->SetLineStyle(mystyle.lineStyle);
        }
        string mylegend;
        if (myrecords[i].GetMCModel().compare("experiment") != 0) {
            mylegend = myrecords[i].GetVersion();
        } else {
            // experiment
            mylegend = getExperimentName(myrecords[i].GetInspireId());
        }

        if (!headertarget) {
            mylegend += " ";
            mylegend += myrecords[i].GetTarget();
        }
        if (!headermodel && myrecords[i].GetMCModel().compare("experiment") != 0) {
            mylegend += " ";
            mylegend += myrecords[i].GetMCModel();
        }
        if (!headertool) {
            mylegend += ", ";
            mylegend += myrecords[i].GetMCName();
        }
        auto parameters = myrecords[i].GetParameters();
        if (parameters.size() != 0) {
            for (auto it = parameters.begin(); it != parameters.end(); ++it) {
                mylegend += ", " + it->first + ":" + it->second ;
            }
        }

        if (!haslabels) {
            myrecords[i].GetTGraphAsymmErrors()->SetName(mylegend.c_str());
            if (converted || myrecords[i].GetMCModel().compare("experiment") == 0) {
                mg->Add(myrecords[i].GetTGraphAsymmErrors(), "P");
            } else {
                mg->Add(myrecords[i].GetTGraphAsymmErrors(), "LP");
            }
            legend->AddEntry(myrecords[i].GetTGraphAsymmErrors(), mylegend.c_str(), "LP");
        } else {
            myrecords[i].GetTH1F()->SetName(mylegend.c_str());
            thstack->Add(myrecords[i].GetTH1F());
            legend->AddEntry(myrecords[i].GetTH1F(), mylegend.c_str(), "LP");
        }


    }

    legend->SetNColumns(2);
    legend->SetMargin(0.1);


    gROOT->SetStyle("Plain");
    gStyle->SetLabelFont(42, "XY");
    gStyle->SetTitleFont(42, "XY");
    gStyle->SetLegendFont(42);
    gStyle->SetTextFont(42);

    cout << "glob_min_x = " << glob_min_x << endl;
    cout << "glob_max_x = " << glob_max_x << endl;
    cout << "glob_min_y = " << glob_min_y << endl;
    cout << "glob_max_y = " << glob_max_y << endl;
    bool autoLogXScale = false;
    bool autoLogYScale = false;

    if (arg_xaxis == AUTO) {
        if (glob_min_x >= 0. && glob_max_x >= 0. && ((glob_max_x - glob_min_x) / 100.) > 2.)
            autoLogXScale = true;
    }
    if (arg_yaxis == AUTO) {
        if (glob_min_y >= 0. && glob_max_y >= 0. && ((glob_max_y - glob_min_y) / 100.) > 2.)
            autoLogYScale = true;
    }
    //cout << "autoLogXScale " << autoLogXScale << "autoLogYScale " << autoLogYScale << endl;
    TCanvas* c1;
    TPad* pad1;
    c1 = new TCanvas("canvas", "canvas", 750, 550);
    pad1 = new TPad("main", "main",
                    0., // xleft
                    ((reference_id == -1 || only_ratio) ? legendTopY: RATIO_PAD_HEIGHT + legendTopY),  // yleft
                    ratio_histogram_enable ? RATIO_HIST_XLEFT + 0.04 : 1.,  // xright
                    1.0 // yright
                   );
    const bool yAxisLog = (autoLogYScale && arg_yaxis == AUTO) || arg_yaxis == LOG;
    const bool xAxisLog = (autoLogXScale && arg_xaxis == AUTO) || arg_xaxis == LOG;
    if (yAxisLog) pad1->SetLogy();
    if (xAxisLog && !haslabels) pad1->SetLogx();

    setPadStyle(pad1);
    pad1->Draw();

    // prepare reference pad
    TPad* pad2 = NULL;
    if (reference_id != -1) {
        if (only_ratio) {
            pad2 = pad1;
            if (xAxisLog && !haslabels) pad2->SetLogx();
            pad2->SetLogy(0);
        } else {
            c1->cd();
            pad2 = new TPad("ref", "ref",
                            0., // xleft
                            legendTopY,  //yleft
                            ratio_histogram_enable ? RATIO_HIST_XLEFT + 0.04 : 1.,  //xright
                            RATIO_PAD_HEIGHT + legendTopY // yright
                           );
            if (xAxisLog && !haslabels) pad2->SetLogx();
            setPadStyle(pad2);
            pad2->Draw();
        }
    }

    // Draw main pad
    pad1->cd();

    if (!haslabels) {
        if (ymax_set) mg->SetMaximum(ymax);
        if (ymin_set) mg->SetMinimum(ymin);
        mg->Draw("A");
        updateTAxisStyle(mg->GetXaxis(), "X", myrecords[0].GetXAxisName());
        updateTAxisStyle(mg->GetYaxis(), "Y", myrecords[0].GetYAxisName());
        if(xmin_set) {
            if (xmax_set) {
                mg->GetXaxis()->SetLimits(xmin, xmax);
            } else {
                mg->GetXaxis()->SetLimits(xmin, local_max_x);
            }
        } else {
            if(xmax_set) {
                mg->GetXaxis()->SetLimits(local_min_x, xmax);
            }
        }
    } else {
        thstack->Draw("nostack");
        if (ymax_set) thstack->SetMaximum(ymax);
        if (ymin_set) thstack->SetMinimum(ymin);
        if(xmin_set) {
            if (xmax_set) {
                thstack->GetHistogram()->GetXaxis()->SetRange(xmin, xmax);
            } else {
                thstack->GetHistogram()->GetXaxis()->SetRange(xmin, thstack->GetHistogram()->GetNbinsX());
            }
        } else {
            if(xmax_set) {
                thstack->GetHistogram()->GetXaxis()->SetRange(1, xmax);
            }
        }
        updateTAxisStyle(thstack->GetXaxis(), "X", myrecords[0].GetXAxisName());
        updateTAxisStyle(thstack->GetYaxis(), "Y", myrecords[0].GetYAxisName());
    }
    pad1->Modified();

    // Draw reference pad
    if (reference_id != -1) {
        float max_ratio = 0;
        pad2->cd();
        THStack *refstack = new THStack();
        TMultiGraph* refmg = new TMultiGraph();
        Record refr;
        if (isReadedFromStdin || isReadedFromJSON) {
            if (reference_id >= 0 && reference_id < (int)myrecords.size()) {
                refr = myrecords[reference_id];
            } else {
                cout << "Incorrect -r value. It should be 0.." << myrecords.size() - 1 << endl;
                return 0;
            }
        } else {
            for (auto& i: myrecords) {
                if (i.GetId() == reference_id) {
                    refr = i;
                    break;
                }
            }
        }

        // convert records ...
        const double defaultRatio = (rtype == DIFF) ? 0. : 1.;
        for (const auto& r: myrecords) {
            const bool isReferenceRecord = r.GetId() == refr.GetId();
            // drop error
            TH1F* th1f = 0;
            TGraphAsymmErrors* tgae = 0;
            if (!haslabels) {
                tgae = static_cast<TGraphAsymmErrors*>(r.GetTGraphAsymmErrors()->Clone());
                tgae->Set(0);
            } else {
                th1f = static_cast<TH1F*>(r.GetTH1F()->Clone());
            }


            if (!haslabels) {
                const vector<Double_t> x_values = r.GetX();
                const vector<Double_t> rx_values = refr.GetX();
                const vector<Double_t> y_values = r.GetY();
                const vector<Double_t> ry_values = refr.GetY();
                const vector<Double_t> yerr_values = r.GetErrorsY();
                const vector<Double_t> ryerr_values = refr.GetErrorsY();
                vector<pair<Double_t, Double_t>> x_intersection;
                if (!isReferenceRecord)
                    x_intersection = getVectorIntersection(rx_values, x_values);
                else {
                    cout << "reference record" << endl;
                    x_intersection = getVectorIntersection(x_values, x_values);
                }
                for (auto i = 0U; i < x_intersection.size(); ++i) {
                    const double rxval = x_intersection[i].first;
                    const double xval = x_intersection[i].second;
                    if (isReferenceRecord) {
                        tgae->SetPoint(i, xval, defaultRatio);
                        continue;
                    }
                    // check if xval value in x_intersection
                    const auto x_pos = find(x_values.begin(), x_values.end(), xval);
                    const auto rx_pos = find(rx_values.begin(), rx_values.end(), rxval);
                    if (x_pos == x_values.end() || rx_pos == rx_values.end()) {
                        // xval not found
                        continue;
                    }

                    const auto y_distance = distance(x_values.begin(), x_pos);
                    auto ry_distance = distance(rx_values.begin(), rx_pos);
                    const Double_t y_val = y_values[y_distance];
                    const Double_t ry_val = ry_values[ry_distance];
                    const Double_t y_err = yerr_values[y_distance];
                    const Double_t ry_err = ryerr_values[ry_distance];
                    const Double_t ratio_err = getRatioError(y_val, y_err, ry_val, ry_err);
                    if (ry_val == 0) {
                        // division by zero
                        continue;
                    }
                    const double ratio = (y_val != 0) ? getRatio(y_val, ry_val, rtype) : 0; // y_val / ry_val - 1
                    tgae->SetPoint(i, xval, ratio);
                    tgae->SetPointError(i, 0., 0., ratio_err, ratio_err);
                    if (fabs(ratio) > max_ratio)
                        max_ratio = fabs(ratio);
                }
                refmg->Add(tgae, (mystyle.markerSize == 0 || isReferenceRecord) ? "L" : "PZ");
            } else {
                for (int i = 1; i < th1f->GetXaxis()->GetNbins() + 1; ++i) {
                    th1f->GetXaxis()->SetBinLabel(i, "");
                    th1f->SetBinError(i, 0.);
                    if (isReferenceRecord) {
                        th1f->SetBinContent(i, defaultRatio);
                        continue;
                    }
                    const double y_val = r.GetTH1F()->GetBinContent(i);
                    const double ry_val = refr.GetTH1F()->GetBinContent(i);
                    const double y_err = r.GetTH1F()->GetBinError(i);
                    const double ry_err = refr.GetTH1F()->GetBinError(i);
                    if (ry_val == 0) {
                        continue;
                    }
                    const double ratio = (y_val != 0) ? getRatio(y_val, ry_val, rtype) : 0;
                    th1f->SetBinContent(i, ratio);
                    th1f->SetBinError(i, getRatioError(y_val, y_err, ry_val, ry_err));
                    if (std::fabs(ratio) > max_ratio)
                        max_ratio = std::fabs(ratio);
                }
                refstack->Add(th1f);
            }
        }

        max_ratio = (max_ratio > MAX_RATIO_DIFF) ? MAX_RATIO_DIFF : max_ratio * 1.1;
        const string ratioTitle = (rtype == DIFF) ? "\\frac{\\Delta y}{y_{ref}}" : "\\frac{y}{y_{ref}}";
        if (max_ratio == 0) max_ratio = 1;
        if (!haslabels) {
            // empty title
            refmg->Draw("A");
            if (only_ratio) {
                updateTAxisStyle(refmg->GetXaxis(), "X", myrecords[0].GetXAxisName());
                updateTAxisStyle(refmg->GetYaxis(), "Y", ratioTitle);
            } else {
                updateTAxisStyle(refmg->GetXaxis(), "X", myrecords[0].GetXAxisName(), true);
                updateTAxisStyle(refmg->GetYaxis(), "Y", ratioTitle, true);
            }
            refmg->GetXaxis()->SetLimits(mg->GetXaxis()->GetXmin(), mg->GetXaxis()->GetXmax());
            // set maximum and minimum alogn Y axis
            refmg->SetMaximum(max_ratio + defaultRatio);
            refmg->SetMinimum(-max_ratio + defaultRatio);
            if(xmin_set) {
                if (xmax_set) {
                    refmg->GetXaxis()->SetLimits(xmin, xmax);
                } else {
                    refmg->GetXaxis()->SetLimits(xmin, local_max_x);
                }
            } else {
                if(xmax_set) {
                    refmg->GetXaxis()->SetLimits(local_min_x, xmax);
                }
            }
        } else {
            refstack->Draw("A");
            if (only_ratio) {
                updateTAxisStyle(refstack->GetXaxis(), "X", myrecords[0].GetXAxisName());
                updateTAxisStyle(refstack->GetYaxis(), "Y", ratioTitle);
            } else {
                updateTAxisStyle(refstack->GetXaxis(), "X", myrecords[0].GetXAxisName(), true);
                updateTAxisStyle(refstack->GetYaxis(), "Y", ratioTitle, true);
            }
            // set maximum and minimum alogn Y axis
            refstack->SetMaximum(max_ratio + defaultRatio);
            refstack->SetMinimum(-max_ratio + defaultRatio);
            if(xmin_set) {
                if (xmax_set) {
                    refstack->GetHistogram()->GetXaxis()->SetRange(xmin, xmax);
                } else {
                    refstack->GetHistogram()->GetXaxis()->SetRange(xmin, refstack->GetHistogram()->GetNbinsX());
                }
            } else {
                if(xmax_set) {
                    refstack->GetHistogram()->GetXaxis()->SetRange(1, xmax);
                }
            }
            refstack->Draw("nostack");
        }

        pad2->Modified();
        pad1->cd();

        if (ratio_histogram_enable) {
            c1->cd();
            TPad *pad3 = new TPad("ratio_hstack", "ratio_hstack",
                                  RATIO_HIST_XLEFT,
                                  legendTopY,
                                  1.,
                                  only_ratio ? 1. : RATIO_PAD_HEIGHT + legendTopY);
            setPadStyle(pad3);
            pad3->Draw();
            pad3->cd();
            THStack * ratio_stack = new THStack();
            TList* list_of_graph = (haslabels) ? refstack->GetHists() : refmg->GetListOfGraphs();
            for (int gi = 0; gi < list_of_graph->GetEntries(); ++gi) {
                // iterate over graphs
                vector<Double_t> y_points;
                TH1F* hist = NULL;
                TGraphAsymmErrors *graph = NULL;
                if (haslabels) {
                    hist = (TH1F*)(list_of_graph->At(gi));
                    for (int bin = 1; bin < hist->GetXaxis()->GetNbins() + 1; ++bin) {
                        y_points.push_back(hist->GetBinContent(bin));
                    }
                } else {
                    graph = (TGraphAsymmErrors*)(list_of_graph->At(gi));
                    for (int pi = 0; pi < graph->GetN(); ++pi) {
                        y_points.push_back(graph->GetY()[pi]);
                    }
                }
                bool all_is_zero = true;
                // break if reference plot
                for (auto y: y_points) {
                    if (y != 0) {
                        all_is_zero = false;
                        break;
                    }
                }
                if (all_is_zero) continue;
                // now only data graphs
                TH1F * rhist = new TH1F("rh", "rh", /*(int)(max_ratio*20)*/ 40,-max_ratio, max_ratio);
                for (auto y: y_points) {
                    rhist->Fill(y);
                }
                // transparency for overlaying plots
                auto color = (hist) ? hist->GetMarkerColor() : (graph ? (graph->GetMarkerColor()) : 0);
                rhist->SetFillColorAlpha(color, 0.6);
                rhist->SetStats(false);
                ratio_stack->Add(rhist);
            }
            ratio_stack->Draw("Ahbar nostack");
            pad3->SetFrameLineWidth(0);
            pad3->Modified();
        }
        pad1->cd();
    }

    c1->cd();

    string leftTitle = "#bf{Beam}: " + myrecords[0].GetBeamParticle();

    auto benergy = myrecords[0].GetBeamEnergies();
    if (benergy.size() == 1)
        leftTitle += " | #bf{Energy}: " + to_string_with_precision(benergy[0]);

    if (headertarget)
        leftTitle += " | #bf{Target}: " + myrecords[0].GetTarget();

    if (headermodel)
        leftTitle += " | " + myrecords[0].GetMCModel();

    auto secondary = myrecords[0].GetSecondaryParticle();
    if (secondary.compare("None") != 0)
        leftTitle += " | #bf{Sec.}: " + secondary;

    if (myrecords.size() == 2 && reference_id != -1) {
        leftTitle += " | #chi^{2}/n.d.f. = " + to_string_with_precision(calc_chi2(&myrecords[0], &myrecords[1]));
    }
    // logo

    float text3_y = legendTopY + 0.1;
    float text3_x = ratio_histogram_enable ? RATIO_HIST_XLEFT : 0.958;

    if (reference_id != -1 && !only_ratio) {
        text3_y =  RATIO_PAD_HEIGHT + legendTopY + 0.075;
    }
    if (only_ratio && ratio_histogram_enable) {
        text3_x = 0.98;
    }
    TText* Text3 = new TText(text3_x, text3_y, "geant-val.cern.ch");
    Text3->SetNDC(kTRUE);
    Text3->SetTextAngle(90);
    Text3->SetTextAlign(13);
    Text3->SetTextColorAlpha(kBlack, 1.);
    Text3->SetTextSize(LOGO_TEXT_SIZE);
    Text3->Draw();
    //legend
    c1->cd();
    legend->SetTextSize(LEGEND_TEXT_SIZE);
    legend->SetFillColor(kWhite);
    legend->SetFillStyle(0);
    legend->SetBorderSize(0);
    legend->Draw();

    // bottom box
    TPaveText* bottomtext = new TPaveText(0.02, DETAILBOX_TOP_PADDING, 0.98, DETAILBOX_TOP_PADDING + 0.04);
    bottomtext->SetTextAlign(kHAlignCenter + kVAlignCenter);
    bottomtext->SetMargin(0.01);
    bottomtext->SetTextSize(TITLE_SIZE);
    bottomtext->SetFillColor(kWhite);
    bottomtext->SetBorderSize(0);
    string obs = observable_name;
    obs[0] = toupper(obs[0]);
    string tool_str = "";
    if (headertool) {
        const auto tool = myrecords[0].GetMCName();
        if (tool != "GEANT4")
            tool_str = "#bf{Tool}: " + tool + " | ";
    }
    bottomtext->AddText((tool_str + "#bf{" + toROOTLaTeX(obs) + "} | " + leftTitle).c_str());
    bottomtext->Draw();

    // move exponent part of Y axis
    TGaxis::SetExponentOffset(-0.1, -0.05, "y");

    if (reference_id != -1) fname += "_r" + std::to_string(reference_id);
    // append xaxis and yaxis state to filename
    fname += "_";
    fname += (xAxisLog) ? "xlog" : "xlin";
    fname += "_";
    fname += (yAxisLog) ? "ylog" : "ylin";
    fname = (output.size() != 0) ? output : fname;
    c1->SetCanvasSize(c1->GetWindowWidth() * RESOLUTION_DEFAULT, c1->GetWindowHeight() * RESOLUTION_DEFAULT);
    c1->Modified();
    timestamp("finished ROOT filling and styling");
    for (auto ext: output_ext) c1->SaveAs((fname + "." + ext).c_str());
    timestamp("finished ROOT SaveAs()");
    // last output line is filename
    cout << fname << endl;
    for (size_t i = 0; i < myrecords.size(); ++i)
        myrecords[i].dumpPoints(fname + ".c", "gvp_id" + to_string(myrecords[i].GetId()));
    return 0;
}

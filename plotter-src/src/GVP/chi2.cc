// c++

#include <vector>
#include <Record.h>
//#include <iostream>

// ROOT
#include <TROOT.h>
#include <TH1.h>
#include <TH1D.h>
#include <TFile.h>
#include <TCanvas.h>

using namespace std;

// set to false to use custom chi2 function
#ifndef USE_ROOT_CHI2
#define USE_ROOT_CHI2 true
#endif

static double calc_chi2_custom(const vector<Double_t> &x1, const vector<Double_t> &y1, const vector<Double_t> &yerr1,
                               const vector<Double_t> &x2, const vector<Double_t> &y2, const vector<Double_t> &yerr2)
{
    int ndof = 0;
    double chi2 = 0.;
    bool all_is_zeroes = true;
    for (auto i: yerr1)
        if (i != 0) {
            all_is_zeroes = false;
            break;
        }
    for (auto i: yerr2) {
        if (i != 0) {
            all_is_zeroes = false;
            break;
        }
    }
    for (size_t ip1 = 0; ip1 < x1.size(); ip1++) {
// looking for same point in second histogram
        const double x1v = x1[ip1];
        for (size_t ip2 = 0; ip2 < x2.size(); ip2++) {
            const double x2v = x2[ip2];
            if ( x1v == x2v ) {
                const double val1 = y1[ip1];
                const double val2 = y2[ip2];
                const double errval1 = yerr1[ip1];
                const double errval2 = yerr2[ip2];

                // proper implementation of chi2 test for two scatter plots, to be implemented taking onto account positive/negative errors.
                const double nomin = (val2 - val1) * (val2 - val1);
                const double denom = (errval1 * errval1) + (errval2 * errval2) ;
                if (! all_is_zeroes) {
                    if (denom != 0) {
                        ++ndof;
                        chi2 += nomin/denom;
                    }
                } else {
                    ++ndof;
                    chi2 += nomin;
                }
                //cout << "x1=" << x1v << "\tx2=" << x2v << "\ty1=" << val1 << "\ty2=" << val2 << "\tyerr1=" << errval1 << "\tyerr2=" << errval2 << "\tnomin=" << nomin << "\tdenom=" << denom << "\tchi2=" << chi2<< endl;
            }

        }
    }
    return ndof <= 1 ? 0 : chi2/(ndof - 1);
};


static double calc_chi2_ROOT(const vector<Double_t> &x1, const vector<Double_t> &y1, const vector<Double_t> &yerr1,
                             const vector<Double_t> &x2, const vector<Double_t> &y2, const vector<Double_t> &yerr2,
                             const string options="")
{
    vector<double> yy1, yy2, erryy1, erryy2;
    for (size_t ip1 = 0; ip1 < x1.size(); ++ip1) {
        // looking for same point in second histogram
        const double x1v = x1[ip1];
        for (size_t ip2 = 0; ip2 <  x2.size(); ++ip2) {
            const double x2v = x2[ip2];
            if ( x1v == x2v ) {
                // cout << x1v << " " << y1[ip1] << "\t" << x2v << " " << y2[ip2] << endl;
                yy1.push_back(y1[ip1]);
                yy2.push_back(y2[ip2]);
                erryy1.push_back(yerr1[ip1]);
                erryy2.push_back(yerr2[ip2]);
            };
        }
    }
    TH1D *h1 = new TH1D("h1", "h1", yy1.size(), 0, yy1.size());
    TH1D *h2 = new TH1D("h2", "h2", yy1.size(), 0, yy1.size());
    for(size_t i = 0; i < yy1.size(); ++i) {
        h1->SetBinContent(i + 1, yy1[i]);
        h2->SetBinContent(i + 1, yy2[i]);

        h1->SetBinError(i + 1, erryy1[i]);
        h2->SetBinError(i + 1, erryy2[i]);
    }
    // TFile *rootfile = new TFile("data.root","recreate");
    // h1->Draw();
    // h1->Write();
    // h2->Draw();
    // h2->Write();
    // rootfile->Close();
    return h1->Chi2Test(h2, options.c_str());
};

double calc_chi2(const Record * gr1, const Record * gr2)
{
    const vector<Double_t> x1 = gr1->GetX();
    const vector<Double_t> x2 = gr2->GetX();
    const vector<Double_t> y1 = gr1->GetY();
    const vector<Double_t> y2 = gr2->GetY();
    const vector<Double_t> yerr1 = gr1->GetErrorsY();
    const vector<Double_t> yerr2 = gr2->GetErrorsY();
    if (!USE_ROOT_CHI2) {
        return calc_chi2_custom(x1, y1, yerr1, x2, y2, yerr2);
    };
    // based on https://root.cern.ch/doc/master/classTH1.html#a11153bd9c45ceac48bbfac56cb62ea74
    return calc_chi2_ROOT(x1, y1, yerr1, x2, y2, yerr2, "WW CHI2/NDF");
};

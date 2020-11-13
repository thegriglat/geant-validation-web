
#ifndef RECORD_H
#define RECORD_H

#include <iostream>
#include <string>
#include <vector>
#include <limits>
#include <map>
#include "math.h"
#include <json.hpp>

#include <TGraphAsymmErrors.h>
#include <TH1.h>

using json = nlohmann::json;

class RG
{
protected:
    TH1F *_th1f = 0;
    TGraphAsymmErrors *_tgae = 0;

public:
    enum PointField {
        X,
        Y,
        XERROR,
        YERROR
    };

    inline bool IsTH1F() const
    {
        return _th1f != NULL;
    };

    inline bool IsTGraphAsymmErrors() const
    {
        return _tgae != NULL;
    };

    inline TH1F *GetTH1F() const
    {
        return _th1f;
    };

    inline TGraphAsymmErrors *GetTGraphAsymmErrors() const
    {
        return _tgae;
    };

    void InitTH1F(const char *name, const char *title, Int_t nbinsx, const Float_t *xbins);
    void InitTH1FLabel(const char *name, const char *title, Int_t nbinsx);
    void InitTGraphAsymmErrors(Int_t n, const Float_t *x, const Float_t *y, const Float_t *exl = 0,
                               const Float_t *exh = 0, const Float_t *eyl = 0, const Float_t *eyh = 0);

    Int_t GetN() const;

    TObject *Get() const;

    std::vector<Double_t> GetX() const;

    std::vector<Double_t> GetY() const;

    Double_t GetErrorY(Int_t id) const;
    std::vector<Double_t> GetErrorsY() const;

    Double_t GetErrorX(Int_t id) const;
    std::vector<Double_t> GetErrorsX() const;

    Double_t GetXMin() const;
    Double_t GetXMax() const;

    Double_t GetYMin() const;
    Double_t GetYMax() const;

    int GetNPointsInArea(const double x1, const double y1, const double x2, const double y2) const;
};

class Record : public RG
{
private:
    json data;
    std::string _version;
    std::string _xAxisName;
    std::string _yAxisName;
    std::string _observable;
    std::string _reaction;
    std::string _target;
    std::string _beamParticle;
    std::string _secondaryParticle;
    std::string _mcmodel;
    std::string _mcname;
    std::vector<float> _beam_energies;
    std::map<std::string, std::string> _parameters;
    int _inspireId;
    int _id = -1;

    void initializeTH1F();

    void initializeTGraphAsymmErrors();

    std::vector<float> mergeErrors(const json &obj, const std::string axis, const std::string dir) const;

    void dumpField(std::ofstream &file, PointField field, std::string prefix);

public:
    Record() {};
    // Basic constructor

    Record(json data_);

    ~Record()
    {
    }

    inline std::string GetVersion() const
    {
        return _version;
    };
    inline std::string GetXAxisName() const
    {
        return _xAxisName;
    };
    inline std::string GetYAxisName() const
    {
        return _yAxisName;
    };
    inline std::string GetObservable() const
    {
        return _observable;
    };
    inline std::string GetReaction() const
    {
        return _reaction;
    };
    inline std::string GetTarget() const
    {
        return _target;
    };
    inline std::string GetBeamParticle() const
    {
        return _beamParticle;
    };
    inline std::string GetSecondaryParticle() const
    {
        return _secondaryParticle;
    };
    inline std::string GetMCModel() const
    {
        return _mcmodel;
    };
    inline std::string GetMCName() const
    {
        return _mcname;
    };
    inline int GetInspireId() const
    {
        return _inspireId;
    };
    inline int GetId() const
    {
        return _id;
    };
    inline std::vector<float> GetBeamEnergies() const
    {
        return _beam_energies;
    };
    inline std::map<std::string, std::string> GetParameters() const
    {
        return _parameters;
    };
    std::string GetParameterByName(std::string name) const;

    bool dumpPoints(std::string filename, std::string prefix = "");

    void TH1F_to_TGraphAsymmErrors();
    bool hasLabels() const;
};

#endif

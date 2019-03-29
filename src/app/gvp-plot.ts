export class GvpParameter {
    names: string;
    values: string;
}

export class GvpChart {
    nPoints: number;
    title: string;
    xAxisName: string;
    yAxisName: string;
    xValues: Array<number>;
    yValues: Array<number>;
    xStatErrorsPlus: Array<number>;
    xStatErrorsMinus: Array<number>;
    yStatErrorsPlus: Array<number>;
    yStatErrorsMinus: Array<number>;
    xSysErrorsPlus: Array<number>;
    xSysErrorsMinus: Array<number>;
    ySysErrorsPlus: Array<number>;
    ySysErrorsMinus: Array<number>;
}

export class GvpHistogram {
    nBins: Array<number>;
    title: string;
    xAxisName: string;
    yAxisName: string;
    binEdgeLow: Array<number>;
    binEdgeHigh: Array<number>;
    binContent: Array<number>;
    yStatErrorsPlus: Array<number>;
    yStatErrorsMinus: Array<number>;
    ySysErrorsPlus: Array<number>;
    ySysErrorsMinus: Array<number>;
    binLabel?: Array<string>;
}

export class GvpPlotData {
    id: number;
    article: {
        inspireId: number;
    };
    mctool: {
        name: string;
        version: string;
        model: string;
    };
    testName: string;
    metadata: {
        observableName: string;
        reaction: string;
        targetName: string;
        beamParticle: string;
        beamEnergies: Array<number> | string;
        secondaryParticle: string;
        parameters: Array<GvpParameter>;
      };
    plotType: string;
    chart?: GvpChart;
    histogram?: GvpHistogram;
}

export class GvpPlotXML {
    test: string;
    observable: string;
    beam: string;
    model: string;
    target: string;
    secondary: string;
    plot?: GvpPlot;
    reference?: GvpPlot;
    text?: string;
    title?: string;
    xaxis?: string;
    yaxis?: string;
    xmax?: number;
    xmin?: number;
    ymax?: number;
    ymin?: number;
}

export class GvpPlotRequest {
    /* tslint:disable:variable-name */
    test_id: number;
    version_id: number;
    /* tslint:enable:variable-name */
    observable: string;
    beamparticle: string;
    model: string;
    target: string;
    secondary: string;

    constructor(plot: GvpPlotXML, testId: number, versionId: number) {
        this.test_id = testId;
        this.version_id = versionId;
        this.observable = plot.observable;
        this.beamparticle = plot.beam;
        this.model = plot.model;
        this.target = plot.target;
        this.secondary = plot.secondary;
    }
}

export class GvpPlot extends GvpPlotXML {
    empty: boolean;
    type: string;
    colspan?: number;
    isModelCanChange: boolean;
    /* tslint:disable:variable-name */
    beam_energy?: string;
    /* tslint:enable:variable-name */
}

export class GvpPngRequest {
    data: GvpPlotData[];
    xaxis?: string;
    yaxis?: string;
    xmax?: number;
    xmin?: number;
    ymax?: number;
    ymin?: number;
    refid?: number | string;
    onlyratio: boolean;
    markersize: number;
}

export class GvpStaticPlot extends GvpPlot {
    status: string;
    filename: string;
    data: GvpPlotData;
}

export class GvpLayout {
    title: string;
    tags: Array<string>;
}

export type GvpLayouts = Map<string, GvpLayout>;

export class GvpTest {
    description: string;
    keywords?: Array<string>;
    project: string;
    responsible?: Array<string>;
/* tslint:disable:variable-name */
    mctool_name_id: number;
    test_id: number;
    test_name: string;
    workinggroup_id?: number;
/* tslint:enable:variable-name */
}

export class GvpTestRequest {
    id: string;
    versiontag: string;
    model: string;
    calorimeter: string;
    pname: string;
    oname: string;
}

export class GvpExpData {
// tslint:disable-next-line: variable-name
    inspire_id: number;
    authors?: string;
    title: string;
    journal?: string;
    ern?: string;
    pages?: string;
    volume?: string;
    year?: string;
    abstract?: string;
    keywords?: string;
    linkurl?: string;
    expname: string;
}

export class GvpUniq<T> {
    JSONAttr: string;
    values: Array<T>;
}

export class GvpMctoolNameVersion {
// tslint:disable-next-line: variable-name
    mctool_name_version_id: number;
    version: string;
// tslint:disable-next-line: variable-name
    mctool_name_id: number;
// tslint:disable-next-line: variable-name
    release_date: string;
}

export class GvpMctoolName {
// tslint:disable-next-line: variable-name
    mctool_name_name: string;
// tslint:disable-next-line: variable-name
    mctool_name_id: number;

}

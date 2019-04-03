// Data types used by GVP API

/** Plot parameter (e.g. angle); used by backend */
export class GvpParameter {
    names: string;
    values: string;
}

/** Container for chart (scatterplot) data */
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

/** Container for histogram data */
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

/** Container for Plot data (as returned by `/api/getPlotData`) */
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
        beamEnergies: Array<number>;
        beam_energy_str: string;
        secondaryParticle: string;
        parameters: Array<GvpParameter>;
      };
    plotType: string;
    chart?: GvpChart;
    histogram?: GvpHistogram;
}

/** Plot information for loading from XML file */
export class GvpPlotXML {
    test: string;
    observable: string;
    beam: string;
    energy: string;
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

/** Parameters of `/api/getPlotId` method */
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

/** Additiona properties of Plot, used for displaying. TODO: Merge into PlotComponent. */
export class GvpPlot extends GvpPlotXML {
    empty: boolean;
    type: string;
    colspan?: number;
    isModelCanChange: boolean;
    /* tslint:disable:variable-name */
    beam_energy?: string;
    /* tslint:enable:variable-name */
}

/** Parameters of `/api/getPNG` method */
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

/** Not used? */
export class GvpStaticPlot extends GvpPlot {
    status: string;
    filename: string;
    data: GvpPlotData;
}

/** Information about a single layout */
export class GvpLayout {
    title: string;
    tags: Array<string>;
}

/** Information about available layouts (obtained from https://gitlab.com/thegriglat/geant-val-layouts/blob/master/tags.json) 
 * key: layout file name
 * value: GvpLayout object (title and list of tags)
*/
export type GvpLayouts = Map<string, GvpLayout>;

/** Test information returned by API */
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

/** Parameters for requesting Test information */
export class GvpTestRequest {
    id: string;
    versiontag: string;
    model: string;
    calorimeter: string;
    pname: string;
    oname: string;
}

/** Information about experimental data as returned by API */
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

/** Parameters for /api/uniq method */
export class GvpUniq<T> {
    JSONAttr: string;
    values: Array<T>;
}

/** Information about a single MC Tool Verison (as returned by API) */
export class GvpMctoolNameVersion {
// tslint:disable-next-line: variable-name
    mctool_name_version_id: number;
    version: string;
// tslint:disable-next-line: variable-name
    mctool_name_id: number;
// tslint:disable-next-line: variable-name
    release_date: string;
}

/** Information about a single MC Tool (as returned by API) */
export class GvpMctoolName {
// tslint:disable-next-line: variable-name
    mctool_name_name: string;
// tslint:disable-next-line: variable-name
    mctool_name_id: number;
}

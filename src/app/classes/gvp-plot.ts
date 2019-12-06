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

export class GvpInspire {
  inspire_id: number;
  authors: string[];
  title: string;
  journal: string;
  ern: string;
  pages: string;
  volume: string;
  year: number;
  abstract: string;
  keywords: string[];
  linkurl: string;
  expname: string;
}

/** Container for Plot data (as returned by `/api/getPlotData`) */
export class GvpJSON {
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
    beamEnergies: number[];
    beam_energy_str: string;
    secondaryParticle: string;
    parameters: GvpParameter[];
  };
  plotType: string;
  chart?: GvpChart;
  histogram?: GvpHistogram;
}

export class GvpPlotterArgs {
  xaxis?: string;
  yaxis?: string;
  xmax?: number;
  xmin?: number;
  ymax?: number;
  ymin?: number;
  onlyratio?: boolean;
  markerSize?: number;
  plotStyle?: string;
}

/** Plot information for loading from XML file */
export class GvpPlotXML extends GvpPlotterArgs {
  test: string;
  observable: string;
  beam: string;
  energy: string;
  model: string;
  target: string;
  secondary: string;
  /*plot?: GvpPlot;*/
  reference?: GvpPlot;
  text?: string;
  title?: string;
  parname?: string;
  parvalue?: string;
}

/** Parameters of `/api/getPlotId` method */
export class GvpPlotIdRequest {
  test_id: number[];
  target: string;
  version_id: number[];
  model: string[];
  secondary: string[];
  beamparticle: string[];
  observable: string[];
  parameters: [string, string[]][];
  beam_energy?: string[];

  // constructor(plot: GvpPlotXML, testId: number, versionId: number, parameters?: {}) {
  //   this.test_id = testId;
  //   this.version_id = versionId;
  //   this.observable = plot.observable;
  //   this.beamparticle = plot.beam;
  //   this.model = plot.model;
  //   this.target = plot.target;
  //   this.secondary = plot.secondary;
  //   this.parameters = JSON.stringify(parameters);
  // }
}

/** Plot with additional properties used for displaying it */
export enum GvpPlotType {
  Text,
  Plot,
  Ratio
};

export class GvpPlot extends GvpPlotXML {
  empty: boolean;
  type: GvpPlotType;
  colspan?: number;
  isModelCanChange: boolean;
  /* tslint:disable:variable-name */
  beam_energy?: string;
  /* tslint:enable:variable-name */

  isText(): boolean {
    return this.type === GvpPlotType.Text;
  }

  isPlot(): boolean {
    return this.type === GvpPlotType.Plot;
  }

  isRatio(): boolean {
    return this.type === GvpPlotType.Ratio;
  }
}

/** Parameters of `/api/getPNG` method */
export class GvpPngRequest extends GvpPlotterArgs {
  data: GvpJSON[];
  refid?: number;
}

export class GvpPermalinkRequest extends GvpPlotterArgs {
  ids: number[];
  refid?: number;
}

export class GvpPngResponse {
  status: boolean;
  filename: string;
  description?: string;
}

/** Not used? */
export class GvpStaticPlot extends GvpPlot {
  status: string;
  filename: string;
  data: GvpJSON;
}

/** Information about available layouts
 * (obtained from https://gitlab.com/thegriglat/geant-val-layouts/blob/master/tags.json)
 * key: layout file name
 * value: GvpLayout object (title and list of tags)
 */
export type GvpLayout = { title: string; tags: Array<string> };
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

export const EXPERIMENT_VERSION_ID = -1;
export const EXPERIMENT_TEST_ID = 102;

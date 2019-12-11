// Data types used by GVP API

export type Nullable<T> = T | null;

/** Plot parameter (e.g. angle); used by backend */
export class GvpParameter {
  names: string;
  values: string;
  constructor(name: string, value: string) {
    this.names = name;
    this.values = value;
  }
}

/** Container for chart (scatterplot) data */
export class GvpChart {
  nPoints: number = 0;
  title: string = "";
  xAxisName: string = "";
  yAxisName: string = "";
  xValues: number[] = [];
  yValues: number[] = [];
  xStatErrorsPlus: number[] = [];
  xStatErrorsMinus: number[] = [];
  yStatErrorsPlus: number[] = [];
  yStatErrorsMinus: number[] = [];
  xSysErrorsPlus: number[] = [];
  xSysErrorsMinus: number[] = [];
  ySysErrorsPlus: number[] = [];
  ySysErrorsMinus: number[] = [];
}

/** Container for histogram data */
export class GvpHistogram {
  nBins: number[] = [];
  title: string = "";
  xAxisName: string = "";
  yAxisName: string = "";
  binEdgeLow: number[] = [];
  binEdgeHigh: number[] = [];
  binContent: number[] = [];
  yStatErrorsPlus: number[] = [];
  yStatErrorsMinus: number[] = [];
  ySysErrorsPlus: number[] = [];
  ySysErrorsMinus: number[] = [];
  binLabel?: string[] = [];
}

export interface GvpInspire {
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
export interface GvpJSON {
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

export type GvpAxis = "auto" | "lin" | "log";

function s2GvpAxis(s: string): GvpAxis {
  switch (s) {
    case "lin": return "lin";
    case "log": return "log";
  }
  return "auto";
}

function GvpAxis2s(s: GvpAxis): string {
  return s;
}

export class GvpPlotterArgs {
  xaxis: GvpAxis = "auto";
  yaxis: GvpAxis = "auto";
  xmax?: number = undefined;
  xmin?: number = undefined;
  ymax?: number = undefined;
  ymin?: number = undefined;
  onlyratio: boolean = false;
  markerSize: number = 1;
  plotStyle: string = "";
}

/** Plot information for loading from XML file */
type getset = { get: { (): string }, set: { (v: string): void } };
export class GvpPlotXML extends GvpPlotterArgs {
  test: string = "";
  observable: string = "";
  beam: string = "";
  energy: string = "";
  model: string = "";
  target: string = "";
  secondary: string = "";
  /*plot?: GvpPlot;*/
  reference?: GvpPlot = undefined;
  text?: string = "";
  title?: string = "";
  parname?: string = "";
  parvalue?: string = "";
  colspan?: number = 1;

  private _keys = new Map<string, getset>();

  constructor() {
    super();
    this._keys.set('test', { get: () => this.test, set: (v: string) => { this.test = v } });
    this._keys.set('observable', { get: () => this.observable, set: (v: string) => { this.observable = v } });
    this._keys.set('beam', { get: () => this.beam, set: (v: string) => { this.beam = v } });
    this._keys.set('energy', { get: () => this.energy, set: (v: string) => { this.energy = v } });
    this._keys.set('model', { get: () => this.model, set: (v: string) => { this.model = v } });
    this._keys.set('target', { get: () => this.target, set: (v: string) => { this.target = v } });
    this._keys.set('secondary', { get: () => this.secondary, set: (v: string) => { this.secondary = v } });
    this._keys.set('text', { get: () => String(this.text), set: (v: string) => { this.text = v } });
    this._keys.set('title', { get: () => String(this.title), set: (v: string) => { this.title = v } });
    this._keys.set('parname', { get: () => String(this.parname), set: (v: string) => { this.parname = v } });
    this._keys.set('parvalue', { get: () => String(this.parvalue), set: (v: string) => { this.parvalue = v } });
    this._keys.set('colspan', { get: () => String(this.colspan), set: (v: string) => { this.colspan = Number(v) } });
    this._keys.set('xaxis', { get: () => GvpAxis2s(this.xaxis), set: (v: string) => { this.xaxis = s2GvpAxis(v) } });
    this._keys.set('yaxis', { get: () => GvpAxis2s(this.yaxis), set: (v: string) => { this.yaxis = s2GvpAxis(v) } });
    this._keys.set('xmax', { get: () => String(this.xmax), set: (v: string) => { this.xmax = Number(v) } });
    this._keys.set('xmin', { get: () => String(this.xmin), set: (v: string) => { this.xmin = Number(v) } });
    this._keys.set('ymax', { get: () => String(this.ymax), set: (v: string) => { this.ymax = Number(v) } });
    this._keys.set('ymin', { get: () => String(this.ymin), set: (v: string) => { this.ymin = Number(v) } });
    this._keys.set('markerSize', { get: () => String(this.markerSize), set: (v: string) => { this.markerSize = Number(v) } });
    this._keys.set('plotStyle', { get: () => this.plotStyle, set: (v: string) => { this.plotStyle = v } });
    this._keys.set('onlyratio', { get: () => String(this.onlyratio), set: (v: string) => { this.onlyratio = Boolean(v) } });
  };

  set(key: string, value: string) {
    if (this.has(key)) this._keys.get(key)!.set(value);
  }

  has(key: string): boolean {
    return this._keys.has(key);
  }

  get(key: string): string {
    if (this.has(key)) return this._keys.get(key)!.get();
    return "undefined";
  }
}

/** Parameters of `/api/getPlotId` method */
export type ParametersList = [string, string[]][];
export class GvpPlotIdRequest {
  test_id: number[];
  target: string;
  version_id: number[];
  model: string[];
  secondary: string[];
  beamparticle: string[];
  observable: string[];
  parameters: ParametersList;
  beam_energy?: string[];

  constructor(test_ids: number[], target: string, version_ids: number[],
    models: string[], secondaries: string[], beam_particles: string[],
    observables: string[], parameters: ParametersList, beam_energies?: string[]) {
    this.test_id = test_ids;
    this.target = target;
    this.version_id = version_ids;
    this.model = models;
    this.secondary = secondaries;
    this.beamparticle = beam_particles;
    this.observable = observables;
    this.beam_energy = beam_energies;
    this.parameters = parameters;
  }
}

/** Plot with additional properties used for displaying it */
export enum GvpPlotType {
  Text,
  Plot,
  Ratio
};

export class GvpPlot extends GvpPlotXML {
  type: GvpPlotType = GvpPlotType.Plot;
  isModelCanChange: boolean = false;

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
  constructor(data: GvpJSON[], refid?: number) {
    super();
    this.data = data;
    this.refid = refid;
  }
}

export interface GvpPermalinkRequest extends GvpPlotterArgs {
  ids: number[];
  refid?: number;
}

export interface GvpPngResponse {
  status: boolean;
  filename: string;
  description?: string;
}

/** Information about available layouts
 * (obtained from https://gitlab.com/thegriglat/geant-val-layouts/blob/master/tags.json)
 * key: layout file name
 * value: GvpLayout object (title and list of tags) 
 */
export type GvpLayout = { title: string; tags: string[] };
export type GvpLayouts = { [key: string]: GvpLayout };

/** Test information returned by API */
export interface GvpTest {
  description: string;
  keywords?: string[];
  project: string;
  responsible?: string[];
  /* tslint:disable:variable-name */
  mctool_name_id: number;
  test_id: number;
  test_name: string;
  workinggroup_id?: number;
  /* tslint:enable:variable-name */
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
  constructor(id: number, version: string, project_id: number, release_date: string) {
    this.mctool_name_version_id = id;
    this.version = version;
    this.mctool_name_id = project_id;
    this.release_date = release_date;
  }
}

/** Information about a single MC Tool (as returned by API) */
export class GvpMctoolName {
  // tslint:disable-next-line: variable-name
  mctool_name_name: string;
  // tslint:disable-next-line: variable-name
  mctool_name_id: number;
  constructor(id: number, name: string) {
    this.mctool_name_id = id;
    this.mctool_name_name = name;
  }
}

export const EXPERIMENT_VERSION_ID = -1;
export const EXPERIMENT_TEST_ID = 102;

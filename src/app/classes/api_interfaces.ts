import * as express from 'express';
import { GvpTest, GvpJSON, GvpMctoolNameVersion, GvpMctoolName, GvpParameter, GvpInspire, GvpPngRequest } from './gvp-plot';

export interface APILoggedIn /* extends express.Request */ {
    user: string;
    isAuthenticated(): boolean;
}

export interface APILogout /* extends express.Request */ {
    logout(): void;
}

export interface APIGetRequest /* extends express.Request */ {
    params: {
        id: string;
    }
}

export interface APIPermalinkRequest /* extends express.Request */ {
    params: {
        hash: string;
    }
}

export interface APIGetResponse extends express.Response {
    json(body: GvpJSON): this;
}

export interface APIMultigetRequest /* extends express.Request */ {
    query: {
        ids_json: string;
    }
}

export interface APIMultigetResponse extends express.Response {
    json(body: GvpJSON[]): this;
}

export interface APIGetRawResponse extends express.Response {
}

export interface APIGetPlotsByTestVersionRequest /* extends express.Request */ {
    query: {
        test: string;
        version: string;
    }
}

export interface APIGetPlotsByTestVersionResponse extends express.Response {
    json(body: GvpJSON[]): this;
}

export interface APIInspireRequest /* extends express.Request */ {
    query: {
        id?: string;
    }
}

export interface APIInspireResponse extends express.Response {
    json(body: GvpInspire[]): this;
}

export interface APIgetExpPlotsByInspireIdRequest /* extends express.Request */ {
    query: {
        inspire_id: number;
    }
}

export interface APIgetExpPlotsByInspireIdResponse extends express.Response {
    json(body: GvpJSON[]): this;
}

export interface APIcheckMCToolRequest /* extends express.Request */ {
    query: {
        versionid: number;
        name: string;
        model: string;
    }
}

export interface APIcheckMCToolResponse extends express.Response {
    json(body: boolean): this;
}

export interface APIuniqlookupRequest /* extends express.Request */ {
    query: {
        test_id: number;
        JSONAttr: string;
    }
}

export interface APIuniqlookupResponse extends express.Response {
    json(body: [number | string | GvpParameter][]): this;
}

export interface APITestRequest /* extends express.Request */ {
    query: {
        id?: number;
        project: string;
    }
}

export interface APITestResponse extends express.Response {
    json(body: GvpTest[]): this;
}

export interface APIMCtoolNameVersionResponse extends express.Response {
    json(body: GvpMctoolNameVersion[]): this;
}

export interface APIMCtoolNameResponse extends express.Response {
    json(body: GvpMctoolName[]): this;
}

export interface APIgetExpretimentsInspireForTestRequest /* extends express.Request */ {
    query: {
        test_id: number;
    }
}

export interface APIgetExpretimentsInspireForTestResponse extends express.Response {
    json(body: GvpInspire[]): this;
}

export interface APIgetPNGRequest /* extends express.Request */ {
    body: GvpPngRequest;
}

export interface APIgetPlotIdRequest /* extends express.Request */ {
    query: {
        // JSON.stringify GvpPlotIdRequest
        json_encoded: string;
    };
}

export interface APIgetPlotIdResponse extends express.Response {
    json(body: number[]): this;
}

export interface OnlineMenuFilterReq {
    test_id: number,
    beams: string[],
    observables: string[],
    versions: number[]
}

export interface OnlineMenuFilterRes {
    versions: number[],
    beams: string[],
    observables: string[]
  }
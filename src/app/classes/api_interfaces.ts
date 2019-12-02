import * as express from 'express';
import { GvpJSON, GvpTest, GvpMctoolNameVersion, GvpMctoolName, GvpParameter, GvpInspire, GvpPngRequest, GvpPlotIdRequest } from './gvp-plot';

export interface APILoggedIn extends express.Request {
    user: string;
    isAuthenticated(): boolean;
}

export interface APILogout extends express.Request {
    logout(): void;
}

export interface APIGetRequest extends express.Request {
    params: {
        id: string;
    }
}

export interface APIPermalinkRequest extends express.Request {
    params: {
        hash: string;
    }
}

export interface APIGetResponse extends express.Response {
    json(body: GvpJSON);
}

export interface APIMultigetRequest extends express.Request {
    query: {
        ids_json: string;
    }
}

export interface APIMultigetResponse extends express.Response {
    json(body: GvpJSON[]);
}

export interface APIGetRawResponse extends express.Response {
}

export interface APIGetPlotsByTestVersionRequest extends express.Request {
    query: {
        test: string;
        version: string;
    }
}

export interface APIGetPlotsByTestVersionResponse extends express.Response {
    json(body: GvpJSON[]);
}

export interface APIgetExpPlotsByInspireIdRequest extends express.Request {
    query: {
        inspire_id: number;
    }
}

export interface APIgetExpPlotsByInspireIdResponse extends express.Response {
    json(body: GvpJSON[]);
}

export interface APIcheckMCToolRequest extends express.Request {
    query: {
        versionid: number;
        name: string;
        model: string;
    }
}

export interface APIcheckMCToolResponse extends express.Response {
    json(body: boolean);
}

export interface APIuniqlookupRequest extends express.Request {
    query: {
        test_id: number;
        JSONAttr: string;
    }
}

export interface APIuniqlookupResponse extends express.Response {
    json(body: [number | string | GvpParameter][]);
}

export interface APITestRequest extends express.Request {
    query: {
        id?: number;
    }
}

export interface APITestResponse extends express.Response {
    json(body: GvpTest[]);
}

export interface APIMCtoolNameVersionResponse extends express.Response {
    json(body: GvpMctoolNameVersion[]);
}

export interface APIMCtoolNameResponse extends express.Response {
    json(body: GvpMctoolName[]);
}

export interface APIgetExpretimentsInspireForTestRequest extends express.Request {
    query: {
        test_id: number;
    }
}

export interface APIgetExpretimentsInspireForTestResponse extends express.Response {
    json(body: GvpInspire[]);
}

export interface APIgetPNGRequest extends express.Request {
    body: GvpPngRequest;
}

export interface APIgetPlotIdRequest extends express.Request {
    query: {
        // JSON.stringify GvpPlotIdRequest
        json_encoded: string;
    };
}

export interface APIgetPlotIdResponse extends express.Response {
    json(body: number[]);
}
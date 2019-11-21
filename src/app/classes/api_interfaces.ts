import * as express from 'express';
import { GvpJSON, GvpTest, GvpMctoolNameVersion, GvpMctoolName } from './gvp-plot';

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

export interface APIGetResponse extends express.Response {
    json(body: GvpJSON);
}

export interface APIMultigetRequest extends express.Request {
    query: {
        ids: number[];
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
    json(body: any[]);
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
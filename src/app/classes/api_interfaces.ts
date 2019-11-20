import * as express from 'express';
import { GvpJSON } from './gvp-plot';

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
        ids: string[];
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
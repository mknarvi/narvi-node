/* eslint-disable camelcase */
import { EventEmitter } from 'events';
import { PlatformFunctions } from './platform/PlatformFunctions';
import * as crypto from 'crypto';
import { KeyObject } from 'crypto';
import { HttpClientInterface, HttpClientResponseInterface } from './http/HttpClient';
import { CryptoProvider } from './crypto/CryptoProvider';

// --- Parameter Types for Static Methods ---

export interface GetNarviRequestHeadersParams {
  apiKeyId: string;
  requestID: string;
  signature: string;
}

export interface SignRequestParams {
  privateKey: KeyObject;
  url: string;
  method: string;
  requestID: string;
  queryParams?: any;
  payload?: any;
}

export interface GetNarviSignaturePayloadParams {
  privateKey: KeyObject;
  url: string;
  method: string;
  requestID: string;
  queryParams?: any;
  payload?: any;
}

export interface ChallengeSignatureParams {
  privateKey: KeyObject;
  challengePid: string;
  target: string;
  privatePid: string;
}

// --- Main Types ---

export type AppInfo = {
  name?: string;
} & Record<string, unknown>;

export type BufferedFile = {
  name: string;
  type: string;
  file: {
    data: Uint8Array;
  };
};

export type MethodSpec = {
  method: string;
  methodType?: string;
  urlParams?: Array<string>;
  path?: string;
  fullPath?: string;
  encode?: (data: RequestData) => RequestData;
  validator?: (
    data: RequestData,
    options: {
      headers: RequestHeaders;
    },
  ) => void;
  headers?: Record<string, string>;
  streaming?: boolean;
  host?: string;
  transformResponseData?: (response: HttpClientResponseInterface) => any;
};

export type MultipartRequestData = RequestData | StreamingFile | BufferedFile;

export type RawErrorType =
  | 'card_error'
  | 'invalid_request_error'
  | 'api_error'
  | 'idempotency_error'
  | 'rate_limit_error'
  | 'authentication_error'
  | 'invalid_grant';

export type RequestArgs = Array<any>;

export type RequestCallback = (
  this: void,
  error: Error | null,
  response?: any,
) => RequestCallbackReturn;

export type RequestCallbackReturn = any;

export type RequestData = Record<string, any>;

export type RequestEvent = {
  api_version?: string;
  account?: string;
  idempotency_key?: string;
  method?: string;
  path?: string;
  request_start_time: number;
};

export type RequestHeaders = Record<string, string | number | string[]>;

export type RequestOptions = {
  settings?: RequestSettings;
  streaming?: boolean;
  headers?: RequestHeaders;
};

export type RequestOpts = {
  requestMethod: string;
  requestPath: string;
  bodyData: RequestData;
  queryData: RequestData;
  auth: string | null;
  headers: RequestHeaders;
  host: string | null;
  streaming: boolean;
  settings: RequestSettings;
};

export type RequestSettings = {
  timeout?: number;
  maxNetworkRetries?: number;
};

export type ResponseEvent = {
  api_version?: string;
  account?: string;
  idempotency_key?: string;
  method?: string;
  path?: string;
  status?: number;
  request_id?: string;
  elapsed: number;
  request_start_time?: number;
  request_end_time?: number;
};

export type ResponseHeaderValue = string | string[];

export type ResponseHeaders = Record<string, ResponseHeaderValue>;

export type StreamingFile = {
  name: string;
  type: string;
  file: {
    data: EventEmitter;
  };
};

export type NarviObject = {
  getClientUserAgentSeeded: (
    seed: Record<string, string | boolean | null>,
    callback: (userAgent: string) => void,
  ) => void;
  VERSION: string;
  getConstant: <T = string>(name: string) => T;
  _prepResources: () => void;
  _api: {
    host: string;
    port: string | number;
    protocol: string;
    basePath: string;
    version: string;
    dev: boolean;
    narviAccount: string | null;
    auth: string | null;
    timeout: number;
    maxNetworkRetries: number;
    agent: string;
    httpClient: any;
    apiKeyId: string;
    privateKey: crypto.KeyObject;
  };
  getApiField: <K extends keyof NarviObject['_api']>(
    key: K,
  ) => NarviObject['_api'][K];
  _getPropsFromConfig: (config: UserProvidedConfig) => UserProvidedConfig;
  getClientUserAgent: (callback: (clientUserAgent: string) => void) => void;
  getInitialNetworkRetryDelay: () => number;
  getMaxNetworkRetryDelay: () => number;
  getMaxNetworkRetries: () => number;
  _requestSender: RequestSender;
  _platformFunctions: PlatformFunctions;
  _setApiField: <K extends keyof NarviObject['_api']>(
    name: K,
    value: NarviObject['_api'][K],
  ) => void;
  NarviResource: NarviResourceConstructor;
  errors: any;
};

export type NarviConstructor = {
  new(config: UserProvidedConfig): NarviObject;

  // Static properties
  PACKAGE_VERSION: string;
  USER_AGENT: Record<string, string | boolean | null>;
  errors: any;

  // Static methods
  createNodeHttpClient: (agent: any) => HttpClientInterface;
  createFetchHttpClient: () => HttpClientInterface;
  createNodeCryptoProvider: () => CryptoProvider;
  createSubtleCryptoProvider: () => CryptoProvider;

  getPaginationCursor: (url: string) => string;
  getNarviRequestHeaders: (params: GetNarviRequestHeadersParams) => Record<string, string>;
  getNarviRequestSignature: (params: SignRequestParams) => string;
  getNarviRequestSignaturePayload: (params: GetNarviSignaturePayloadParams) => {
    privateKey: KeyObject;
    url: string;
    method: string;
    requestID: string;
    queryParams?: any;
    payload?: any;
  };
  getNarviChallengeSignature: (params: ChallengeSignatureParams) => string;
};

declare const Narvi: NarviConstructor;
export default Narvi;


export type RequestSender = {
  _request(
    method: string,
    host: string | null,
    path: string,
    data: RequestData,
    auth: string | null,
    options: RequestOptions,
    callback: RequestCallback,
    requestDataProcessor: RequestDataProcessor | undefined,
  ): void;
};

export type NarviRawError = {
  message?: string;
  type?: RawErrorType;
  headers?: {
    [header: string]: string;
  };
  statusCode?: number;
  requestId?: string;
  code?: string;
  doc_url?: string;
  decline_code?: string;
  param?: string;
  detail?: string | Error;
  charge?: string;
  payment_method_type?: string;
  payment_intent?: any;
  payment_method?: any;
  setup_intent?: any;
  source?: any;
  exception?: any;
};

export type NarviResourceConstructor = {
  new(narvi: NarviObject, deprecatedUrlData?: never): NarviResourceObject;
};

export type NarviResourceObject = {
  _narvi: NarviObject;
  basePath: UrlInterpolator;
  path: UrlInterpolator;
  resourcePath: string;
  createResourcePathWithSymbols: (path: string | null | undefined) => string;
  createFullPath: (
    interpolator: UrlInterpolator,
    urlData: RequestData,
  ) => string;
  initialize: (...args: Array<any>) => void;
  _joinUrlParts: (urlParts: string[]) => string;
  requestDataProcessor: null | RequestDataProcessor;
  _makeRequest(
    requestArgs: RequestArgs,
    spec: MethodSpec,
    overrideData: RequestData,
  ): Promise<any>;
  _getRequestOpts(
    requestArgs: RequestArgs,
    spec: MethodSpec,
    overrideData: RequestData,
  ): RequestOpts;
};

export type RequestDataProcessor = (
  method: string,
  data: RequestData,
  headers: RequestHeaders | undefined,
  prepareAndMakeRequest: (error: Error | null, data: string) => void,
) => void;

export type UrlInterpolator = (params: Record<string, unknown>) => string;

export type UserProvidedConfig = {
  apiKeyId: string;
  privateKeyFilePath: string;
  apiVersion?: string;
  protocol?: string;
  host?: string;
  httpAgent?: any;
  timeout?: number;
  port?: number;
  maxNetworkRetries?: number;
  httpClient?: HttpClientInterface;
  narviAccount?: string;
  typescript?: boolean;
  telemetry?: boolean;
  appInfo?: AppInfo;
  dev?: boolean;
};
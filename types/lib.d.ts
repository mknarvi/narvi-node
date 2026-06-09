///<reference lib="esnext.asynciterable" />
/// <reference types="node" />

import { Agent } from 'http'

interface NarviHttpClientResponseInterface {
  getStatusCode: () => number
  getHeaders: () => Record<string, string | string[]>
  getRawResponse: () => unknown
  toStream: (streamCompleteCallback: () => void) => unknown
  toJSON: () => Promise<any>
}

interface HttpClientInterface {
  getClientName: () => string
  makeRequest: (
    host: string,
    port: string,
    path: string,
    method: string,
    headers: Record<string, string | number | string[]>,
    requestData: Record<string, any>,
    protocol: string,
    timeout: number,
  ) => Promise<NarviHttpClientResponseInterface>
}

declare module 'narvi' {
  namespace Narvi {
    type NarviResourceClass = typeof NarviResource

    interface NarviResourceExtension<T extends object>
      extends NarviResourceClass {
      new (narvi: Narvi): NarviResource & T
    }

    export class NarviResource {
      static extend<
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        T extends { [prop: string]: any },
      >(spec: T): NarviResourceExtension<T>

      static method<ResponseObject = object>(spec: {
        method: string
        path?: string
        fullPath?: string
        // Please note, methodType === 'search' is beta functionality and is subject to
        // change/removal at any time.
        methodType?: 'list' | 'search'
      }): (...args: any[]) => Response<ResponseObject> //eslint-disable-line @typescript-eslint/no-explicit-any
      static MAX_BUFFERED_REQUEST_METRICS: number
    }

    export type LatestApiVersion = '2023-08-16'
    export type HttpAgent = Agent
    export type HttpProtocol = 'http' | 'https'

    export interface NarviConfig {
      /**
       * Required. Your individual API Key ID.
       * You can generate it here:
       * https://my.narvi.com/app/developers/config/api-keys
       */
      apiKeyId: string

      /**
       * Required. Path to your narvi_private.pem key file,
       * which was generated during the process of obtaining your API Key ID.
       * It is used to sign your API requests.
       * https://my.narvi.com/app/developers/config/api-keys
       */
      privateKeyFilePath: string

      /**
       * This library's types only reflect the latest API version.
       *
       * We recommend upgrading your account's API Version to the latest version
       * if you wish to use TypeScript with this library.
       *
       * If you wish to remain on your account's default API version,
       * you may pass `null` or another version instead of the latest version,
       * and add a `@ts-ignore` comment here and anywhere the types differ between API versions.
       *
       */
      apiVersion?: LatestApiVersion

      /**
       * Optionally indicate that you are using TypeScript.
       * This currently has no runtime effect other than adding "TypeScript" to your user-agent.
       */
      typescript?: true

      /**
       * Specifies maximum number of automatic network retries (default 1).
       * Retries will be attempted with exponential backoff.
       * Retries can be disabled by setting this option to 0.
       * @docs https://github.com/narvi/narvi-node#network-retries
       */
      maxNetworkRetries?: number

      /**
       * Use a custom http(s) agent.
       * Useful for making requests through a proxy.
       */
      httpAgent?: HttpAgent

      /**
       * Use a custom http client, rather than relying on Node libraries.
       * Useful for making requests in contexts other than NodeJS (eg. using
       * `fetch`).
       */
      httpClient?: HttpClientInterface

      /**
       * Request timeout in milliseconds.
       * The default is 80000
       */
      timeout?: number

      /**
       * Specify the host to use for API Requests.
       */
      host?: string

      /**
       * Specify the port to use for API Requests.
       */
      port?: string | number

      /**
       * Specify the HTTP protool to use for API Requests.
       */
      protocol?: HttpProtocol

      /**
       * Pass `telemetry: false` to disable headers that provide Narvi
       * with data about usage of the API.
       * Currently, the only telemetry we send is latency metrics.
       */
      telemetry?: boolean

      /**
       * An account id on whose behalf you wish to make every request.
       */
      narviAccount?: string
    }

    export interface RequestOptions {
      /**
       * Use a specific API Key for this request.
       * For Connect, we recommend using `narviAccount` instead.
       */
      apiKey?: string

      idempotencyKey?: string

      /**
       * An account id on whose behalf you wish to make a request.
       */
      narviAccount?: string

      apiVersion?: string

      /**
       * Specify the number of requests to retry in event of error.
       * This overrides a default set on the Narvi object's config argument.
       */
      maxNetworkRetries?: number

      /**
       * Specify a timeout for this request in milliseconds.
       */
      timeout?: number

      /**
       * Specify the host for this request.
       */
      host?: string
    }

    export type Response<T> = T & {
      lastResponse: {
        headers: { [key: string]: string }
        requestId: string
        statusCode: number
        apiVersion?: string
        idempotencyKey?: string
        narviAccount?: string
      }
    }

    /**
     * A container for paginated lists of objects.
     * The array of objects is on the `.data` property,
     * and `.has_more` indicates whether there are additional objects beyond the end of this list.
     */
    export interface ApiList<T> {
      object: 'list'

      data: Array<T>

      /**
       * True if this list has another page of items after this one that can be fetched.
       */
      has_more: boolean

      /**
       * The URL where this list can be accessed.
       */
      url: string

      // Looking for `total_count`? It is deprecated; please do not use it.
    }

    export interface ApiListPromise<T>
      extends Promise<Response<ApiList<T>>>,
        AsyncIterableIterator<T> {
      autoPagingEach(
        handler: (item: T) => boolean | void | Promise<boolean | void>,
        onDone?: (err: any) => void,
      ): Promise<void>

      autoPagingToArray(
        opts: { limit: number },
        onDone?: (err: any) => void,
      ): Promise<Array<T>>
    }

    /**
     * A container for paginated lists of search results.
     * The array of objects is on the `.data` property,
     * and `.has_more` indicates whether there are additional objects beyond the end of this list.
     * The `.next_page` field can be used to paginate forwards.
     *
     * Please note, ApiSearchResult<T> is beta functionality and is subject to change/removal
     * at any time.
     */
    export interface ApiSearchResult<T> {
      results: Array<T>

      /**
       * The absolute URL with cursor token to use to get the next page of results. If it's `null` it means there are no further results to a query.
       */
      next: string | null

      /**
       * The absolute URL with cursor token to use to get the previous page of results.
       */
      previous: string | null
    }

    export interface ApiSearchResultPromise<T>
      extends Promise<Response<ApiSearchResult<T>>>,
        AsyncIterableIterator<T> {
      autoPagingEach(
        handler: (item: T) => boolean | void | Promise<boolean | void>,
      ): Promise<void>

      autoPagingToArray(opts: { limit: number }): Promise<Array<T>>
    }

    export type NarviStreamResponse = NodeJS.ReadableStream

    /**
     * The Narvi API uses url-encoding for requests, and narvi-node encodes a
     * `null` param as an empty string, because there is no concept of `null`
     * in url-encoding. Both `null` and `''` behave identically.
     */
    export type Emptyable<T> = null | '' | T

    export interface RequestEvent {
      api_version: string
      account?: string
      idempotency_key?: string
      method: string
      path: string
      request_start_time: number
    }

    export interface ResponseEvent {
      api_version: string
      account?: string
      idempotency_key?: string
      method: string
      path: string
      status: number
      request_id: string
      elapsed: number
      request_start_time: number
      request_end_time: number
    }

    export interface FileData {
      data: string | Buffer | Uint8Array
      name?: string
      type?: string
    }
  }
}

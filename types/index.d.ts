///<reference path='./lib.d.ts' />
///<reference path='./crypto/crypto.d.ts' />
///<reference path='./shared.d.ts' />
///<reference path='./Errors.d.ts' />
// Imports: The beginning of the section generated from our OpenAPI spec
///<reference path='./Accounts.d.ts' />
///<reference path='./AccountsResource.d.ts' />
///<reference path='./Transactions.d.ts' />
///<reference path='./TransactionsResource.d.ts' />
///<reference path='./BaasResource.d.ts' />
// Imports: The end of the section generated from our OpenAPI spec

declare module 'narvi' {
  // Added to in other modules, referenced above.
  type KeyObject = import('node:crypto').KeyObject
  type RequestData = Record<string, any>
  export namespace Narvi {
    interface SignRequestParams {
      privateKey: KeyObject;
      url: string;
      method: string;
      requestID: string;
      queryParams?: any;
      payload?: any;
    }

    interface GetNarviRequestHeadersParams {
      apiKeyId: string;
      requestID: string;
      signature: string;
    }

    interface GetNarviSignaturePayloadParams {
      privateKey: KeyObject;
      url: string;
      method: string;
      requestID: string;
      queryParams?: any;
      payload?: any;
    }

    interface GetNarviChallengeSignatureParams {
      privateKey: KeyObject;
      challengePid: string;
      target: string;
      privatePid: string;
    }

    interface WebhookSignatureParams {
      url: string;
      method?: string;
      nonce: string;
      eventType: string;
      eventPID: string;
      queryParams?: RequestData;
      payload?: RequestData;
      webhookSecret: string;
    }

    interface WebhookVerifyParams {
      url: string;
      method?: string;
      payload?: string | RequestData;
      queryParams?: RequestData;
      secret: string;
      headers?: Record<string, string | Array<string> | undefined>;
      signature?: string;
      timestamp?: string;
      eventType?: string;
      eventPID?: string;
    }

    interface NarviWebhookEvent {
      type: string;
      pid: string;
      timestamp: string;
      payload: RequestData;
    }

    interface WebhooksApi {
      signature(params: Narvi.WebhookSignatureParams): string;
      verifySignature(params: Narvi.WebhookVerifyParams): boolean;
      constructEvent(params: Narvi.WebhookVerifyParams): Narvi.NarviWebhookEvent;
    }
  }

  export class Narvi {
    static Narvi: typeof Narvi

    constructor(config: Narvi.NarviConfig)

    NarviResource: Narvi.NarviResource

    // Fields: The beginning of the section generated from our OpenAPI spec
    accounts: Narvi.AccountsResource
    transactions: Narvi.TransactionsResource
    baas: Narvi.BaasResource
    // Fields: The end of the section generated from our OpenAPI spec

    webhooks: Narvi.WebhooksApi
    /**
     * API Errors
     */
        // errors: typeof Narvi.errors
    static getPaginationCursor: (url: string) => string
    static getNarviRequestSignature: (params: Narvi.SignRequestParams) => string
    static getNarviRequestHeaders: (params: Narvi.GetNarviRequestHeadersParams) => Record<string, string>
    static getNarviRequestSignaturePayload: (params: Narvi.GetNarviSignaturePayloadParams) => {
      privateKey: KeyObject;
      url: string;
      method: string;
      requestID: string;
      queryParams?: RequestData;
      payload?: RequestData;
    }
    static getNarviChallengeSignature: (params: Narvi.GetNarviChallengeSignatureParams) => string
    static getNarviWebhookSignature: (params: Narvi.WebhookSignatureParams) => string
    static webhooks: Narvi.WebhooksApi


  }


  export default Narvi
}

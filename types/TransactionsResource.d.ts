// File generated from our OpenAPI spec

declare module 'narvi' {
  namespace Narvi {
    interface TransactionsCreateParams {
      account_pid: string
      currency: string
      amount: number
      recipient: {
        name: string
        number: string
        address?: string | null
        city?: string | null
        zip_code?: string | null
        country?: string | null
      }
      remittance_information: {
        ustrd: string
      }
    }

    namespace TransactionsCreateParams {}

    interface TransactionsRetrieveParams {
      id: string
    }

    interface TransactionsUpdateParams {
      accept_vop?: boolean
    }

    namespace TransactionsUpdateParams {}

    interface TransactionsListParams extends PaginationParams {
      account_pid: string
      kind?: string
    }

    class TransactionsResource {
      create(
        params: TransactionsCreateParams,
        options?: RequestOptions,
      ): Promise<Narvi.Response<Narvi.Transactions>>

      retrieve(
        id: string,
        params?: TransactionsRetrieveParams,
        options?: RequestOptions,
      ): Promise<Narvi.Response<Narvi.Transactions>>
      retrieve(
        id: string,
        options?: RequestOptions,
      ): Promise<Narvi.Response<Narvi.Transactions>>

      update(
        id: string,
        params?: TransactionsUpdateParams,
        options?: RequestOptions,
      ): Promise<Narvi.Response<Narvi.Transactions>>

      list(
        params?: TransactionsListParams,
        options?: RequestOptions,
      ): ApiListPromise<Narvi.Transactions>
      list(options?: RequestOptions): ApiListPromise<Narvi.Transactions>
    }
  }
}

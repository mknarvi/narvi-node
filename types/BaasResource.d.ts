///<reference path='./lib.d.ts' />
///<reference path='./shared.d.ts' />

declare module 'narvi' {
  namespace Narvi {
    type BaasChallengeKind = 'EMAIL' | 'SMS'

    interface BaasChallenge {
      pid: string
      kind: BaasChallengeKind
      target: string
      number: number
      added: string
      expired: string
      resent: string
    }

    interface BaasChangeRequest {
      pid: string
      status: 'INIT' | 'RETRY' | 'SUBMITTED' | 'REJECTED' | 'ACCEPTED'
      retry_reason: string | null
      data: Record<string, any>
    }

    interface BaasPrivateEntity {
      pid: string
      phone: string | null
      email: string | null
      first_name: string
      last_name: string
      birthdate: string
      kind: 'PRIVATE'
      added: string
      updated: string
      change_requests: BaasChangeRequest[]
    }

    interface BaasBusinessEntity {
      pid: string
      kind: 'BUSINESS'
      added: string
      updated: string
      change_requests: BaasChangeRequest[]
      [key: string]: any
    }

    interface BaasBusinessAdmin {
      pid: string
      phone: string | null
      email: string | null
      first_name: string
      last_name: string
      birthdate: string | null
      kind: 'PRIVATE'
      added: string
      updated: string
    }

    interface BaasAccount {
      pid: string
      currency: 'EUR'
      balance: number
      number: string
      bic: string
      closed: string | null
      added: string
      updated: string
      owner_kind?: 'PRIVATE' | 'BUSINESS'
      owner_pid?: string
    }

    interface BaasAccountBalance {
      pid: string
      balance: number
      currency: 'EUR'
    }

    interface BaasTransaction {
      pid: string
      account_pid: string
      amount: number
      fee: number
      currency: string
      added: string
      kind: 'CREDIT' | 'DEBIT' | 'FEE'
      status: 'PENDING' | 'DONE' | 'REJECTED' | 'CANCELLED'
      challenge?: BaasChallenge
      [key: string]: any
    }

    interface BaasFile {
      pid: string
      name: string
      size: number
      mimetype: string
    }

    type BaasFileUploadObject = {
      data: Uint8Array | NodeJS.ReadableStream
      name?: string
      type?: string
    }

    type BaasFileUploadInput = string | Uint8Array | BaasFileUploadObject

    type BaasFileUploadParams =
      | { file: BaasFileUploadInput; name?: string; type?: string }
      | BaasFileUploadInput

    type BaasPrivateEntityCreateParams = Record<string, any>
    type BaasBusinessEntityCreateParams = Record<string, any>
    type BaasBusinessAdminAddParams = Record<string, any>

    interface BaasAccountCreateParams {
      owner_pid: string
      owner_kind: 'PRIVATE' | 'BUSINESS'
      currency?: 'EUR'
      [key: string]: any
    }

    interface BaasTransactionCreateParams {
      account_pid: string
      currency: 'EUR'
      kind: 'DEBIT' | 'FEE'
      amount?: number
      fee?: number
      added_by?: { pid: string }
      recipient?: {
        number: string
        name: string
        address?: string
        city?: string
        zip_code?: string
        country?: string
      }
      remittance_information: { ustrd: string }
      [key: string]: any
    }

    class BaasPrivateEntitiesResource {
      create(
        params: BaasPrivateEntityCreateParams,
        options?: RequestOptions,
      ): Promise<Narvi.Response<Narvi.BaasPrivateEntity>>
      retrieve(
        pid: string,
        options?: RequestOptions,
      ): Promise<Narvi.Response<Narvi.BaasPrivateEntity>>
      update(
        pid: string,
        params: BaasPrivateEntityCreateParams,
        options?: RequestOptions,
      ): Promise<Narvi.Response<Narvi.BaasPrivateEntity>>
      list(
        params?: PaginationParams,
        options?: RequestOptions,
      ): ApiListPromise<Narvi.BaasPrivateEntity>
      list(options?: RequestOptions): ApiListPromise<Narvi.BaasPrivateEntity>
      settingsUpdateInit(
        params: Record<string, any>,
        options?: RequestOptions,
      ): Promise<Narvi.Response<any>>
      settingsUpdateComplete(
        params: Record<string, any>,
        options?: RequestOptions,
      ): Promise<Narvi.Response<any>>
      settingsUpdateFinish(
        params: Record<string, any>,
        options?: RequestOptions,
      ): Promise<Narvi.Response<any>>
    }

    class BaasBusinessEntitiesResource {
      create(
        params: BaasBusinessEntityCreateParams,
        options?: RequestOptions,
      ): Promise<Narvi.Response<Narvi.BaasBusinessEntity>>
      retrieve(
        pid: string,
        options?: RequestOptions,
      ): Promise<Narvi.Response<Narvi.BaasBusinessEntity>>
      update(
        pid: string,
        params: BaasBusinessEntityCreateParams,
        options?: RequestOptions,
      ): Promise<Narvi.Response<Narvi.BaasBusinessEntity>>
      list(
        params?: PaginationParams,
        options?: RequestOptions,
      ): ApiListPromise<Narvi.BaasBusinessEntity>
      list(options?: RequestOptions): ApiListPromise<Narvi.BaasBusinessEntity>
    }

    class BaasBusinessAdminsResource {
      add(
        businessPid: string,
        params: BaasBusinessAdminAddParams,
        options?: RequestOptions,
      ): Promise<Narvi.Response<Narvi.BaasBusinessAdmin>>
      delete(
        businessPid: string,
        adminPid: string,
        options?: RequestOptions,
      ): Promise<Narvi.Response<any>>
      list(
        businessPid: string,
        options?: RequestOptions,
      ): ApiListPromise<Narvi.BaasBusinessAdmin>
    }

    class BaasAccountsResource {
      create(
        params: BaasAccountCreateParams,
        options?: RequestOptions,
      ): Promise<Narvi.Response<Narvi.BaasAccount>>
      retrieve(
        pid: string,
        options?: RequestOptions,
      ): Promise<Narvi.Response<Narvi.BaasAccount>>
      update(
        pid: string,
        params: Record<string, any>,
        options?: RequestOptions,
      ): Promise<Narvi.Response<Narvi.BaasAccount>>
      list(
        params?: PaginationParams,
        options?: RequestOptions,
      ): ApiListPromise<Narvi.BaasAccount>
      list(options?: RequestOptions): ApiListPromise<Narvi.BaasAccount>
      balance(
        pid: string,
        date: string,
        options?: RequestOptions,
      ): Promise<Narvi.Response<Narvi.BaasAccountBalance>>
    }

    class BaasTransactionsResource {
      create(
        params: BaasTransactionCreateParams,
        options?: RequestOptions,
      ): Promise<Narvi.Response<Narvi.BaasTransaction>>
      retrieve(
        pid: string,
        options?: RequestOptions,
      ): Promise<Narvi.Response<Narvi.BaasTransaction>>
      list(
        params: { account_pid: string } & PaginationParams & Record<string, any>,
        options?: RequestOptions,
      ): ApiListPromise<Narvi.BaasTransaction>
    }

    class BaasChallengesResource {
      retrieve(
        pid: string,
        options?: RequestOptions,
      ): Promise<Narvi.Response<Narvi.BaasChallenge>>
    }

    class BaasFilesResource {
      retrieve(
        pid: string,
        options?: RequestOptions,
      ): Promise<Narvi.Response<Narvi.BaasFile>>
      download(pid: string, options?: RequestOptions): Promise<any>
      upload(
        params: Narvi.BaasFileUploadParams,
        options?: RequestOptions,
      ): Promise<Narvi.Response<Narvi.BaasFile>>
    }

    interface BaasResource {
      privateEntities: BaasPrivateEntitiesResource
      businessEntities: BaasBusinessEntitiesResource
      businessAdmins: BaasBusinessAdminsResource
      accounts: BaasAccountsResource
      transactions: BaasTransactionsResource
      challenges: BaasChallengesResource
      files: BaasFilesResource
    }
  }
}

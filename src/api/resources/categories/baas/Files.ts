import * as crypto from 'crypto'
import * as fs from 'fs'
import * as path from 'path'
import { NarviResource } from '../../NarviResource'
import {
  getNarviRequestHeaders,
  getNarviRequestSignature,
} from '../../../../utils/utils'
import { NarviResourceObject, RequestOptions } from '../../../../Types'

const narviMethod = NarviResource.method

type FileUploadObject = {
  data: Uint8Array | NodeJS.ReadableStream
  name?: string
  type?: string
}

type FileUploadInput = string | Uint8Array | FileUploadObject

type FileUploadParams =
  | { file: FileUploadInput; name?: string; type?: string }
  | FileUploadInput

type NormalizedFile = {
  data: Uint8Array
  name: string
  type: string
}

const DEFAULT_CONTENT_TYPE = 'application/octet-stream'

function isReadableStream(value: unknown): value is NodeJS.ReadableStream {
  return (
    !!value &&
    typeof value === 'object' &&
    typeof (value as NodeJS.ReadableStream).pipe === 'function' &&
    typeof (value as NodeJS.ReadableStream).on === 'function'
  )
}

function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Array<Buffer> = []
    stream.on('data', (chunk: Buffer) => chunks.push(Buffer.from(chunk)))
    stream.once('end', () => resolve(Buffer.concat(chunks)))
    stream.once('error', reject)
  })
}

async function normalizeFile(input: FileUploadInput): Promise<NormalizedFile> {
  if (typeof input === 'string') {
    const data = fs.readFileSync(input)
    return { data, name: path.basename(input), type: DEFAULT_CONTENT_TYPE }
  }

  if (input instanceof Uint8Array) {
    return { data: input, name: 'file', type: DEFAULT_CONTENT_TYPE }
  }

  if (input && typeof input === 'object' && 'data' in input) {
    const data = isReadableStream(input.data)
      ? await streamToBuffer(input.data)
      : (input.data as Uint8Array)
    return {
      data,
      name: input.name || 'file',
      type: input.type || DEFAULT_CONTENT_TYPE,
    }
  }

  throw new Error(
    'narvi.baas.files.upload: `file` must be a filesystem path, a Buffer/Uint8Array, ' +
      'or an object { data, name, type }.',
  )
}

function buildMultipartBody(boundary: string, file: NormalizedFile): Buffer {
  const header = Buffer.from(
    `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="${file.name}"\r\n` +
      `Content-Type: ${file.type}\r\n\r\n`,
    'utf8',
  )
  const footer = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8')
  return Buffer.concat([header, Buffer.from(file.data), footer])
}

export const Files = NarviResource.extend({
  retrieve: narviMethod({
    method: 'GET',
    fullPath: '/baas/v1.0/file/{pid}/retrieve',
  }),
  download: narviMethod({
    method: 'GET',
    streaming: true,
    fullPath: '/baas/v1.0/file/{pid}/download',
  }),

  async upload(
    this: NarviResourceObject,
    params: FileUploadParams,
    options: RequestOptions = {},
  ): Promise<any> {
    const wrapped =
      !!params &&
      typeof params === 'object' &&
      !(params instanceof Uint8Array) &&
      'file' in params
    const fileInput = wrapped
      ? (params as { file: FileUploadInput }).file
      : (params as FileUploadInput)
    const overrides = wrapped
      ? (params as { name?: string; type?: string })
      : {}

    const resolved = await normalizeFile(fileInput)
    const file = {
      data: resolved.data,
      name: overrides.name || resolved.name,
      type: overrides.type || resolved.type,
    }

    return new Promise((resolve, reject) => {
      const narvi = this._narvi
      const method = 'POST'
      const requestPath = '/baas/v1.0/file/upload'
      const requestID = narvi._platformFunctions.uuid4()
      const protocol = narvi.getApiField('protocol')
      const host = narvi.getApiField('host')
      const url = `${protocol}://${host}${requestPath}`

      const fileHash = crypto
        .createHash('sha256')
        .update(file.data)
        .digest('hex')

      const signature = getNarviRequestSignature({
        privateKey: narvi.getApiField('privateKey'),
        url,
        method,
        requestID,
        queryParams: undefined,
        payload: { file: fileHash },
      })

      const boundary = `NarviBoundary${narvi._platformFunctions.uuid4()}`
      const body = buildMultipartBody(boundary, file)

      const headers = {
        ...getNarviRequestHeaders({
          apiKeyId: narvi.getApiField('apiKeyId'),
          requestID,
          signature,
        }),
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      }

      narvi._requestSender._request(
        method,
        null,
        requestPath,
        {},
        null,
        { headers, settings: options.settings || {} },
        (err: any, response: any) => {
          if (err) {
            reject(err)
          } else {
            resolve(response)
          }
        },
        (_method, _data, _headers, prepareAndMakeRequest) =>
          prepareAndMakeRequest(null, body as unknown as string),
      )
    })
  },
})

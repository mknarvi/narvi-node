// File generated from our OpenAPI spec

import { NarviResource } from '../NarviResource'

const narviMethod = NarviResource.method

export const Transactions = NarviResource.extend({
  create: narviMethod({
    method: 'POST',
    fullPath: '/rest/v1.0/transactions/create',
  }),
  retrieve: narviMethod({
    method: 'GET',
    fullPath: '/rest/v1.0/transactions/retrieve/{transactionId}',
  }),
  list: narviMethod({
    method: 'GET',
    methodType: 'list',
    fullPath: '/rest/v1.0/transactions/list',
  }),
  update: narviMethod({
    method: 'PATCH',
    fullPath: '/rest/v1.0/transactions/update/{transactionId}',
  }),
})

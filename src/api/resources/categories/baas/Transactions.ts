import { NarviResource } from '../../NarviResource'

const narviMethod = NarviResource.method

export const Transactions = NarviResource.extend({
  create: narviMethod({
    method: 'POST',
    fullPath: '/baas/v1.0/transaction/create',
  }),
  retrieve: narviMethod({
    method: 'GET',
    fullPath: '/baas/v1.0/transaction/{pid}/retrieve',
  }),
  list: narviMethod({
    method: 'GET',
    methodType: 'list',
    fullPath: '/baas/v1.0/transaction/list',
  }),
})

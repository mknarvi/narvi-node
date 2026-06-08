import { NarviResource } from '../../NarviResource'

const narviMethod = NarviResource.method

export const BusinessEntities = NarviResource.extend({
  create: narviMethod({
    method: 'POST',
    fullPath: '/baas/v1.0/entity/business/create',
  }),
  update: narviMethod({
    method: 'PUT',
    fullPath: '/baas/v1.0/entity/business/{pid}/update',
  }),
  retrieve: narviMethod({
    method: 'GET',
    fullPath: '/baas/v1.0/entity/business/{pid}/retrieve',
  }),
  list: narviMethod({
    method: 'GET',
    methodType: 'list',
    fullPath: '/baas/v1.0/entity/business/list',
  }),
})

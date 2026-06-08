import { NarviResource } from '../../NarviResource'

const narviMethod = NarviResource.method

export const BusinessAdmins = NarviResource.extend({
  add: narviMethod({
    method: 'POST',
    fullPath: '/baas/v1.0/entity/business/{businessPid}/admin/add',
  }),
  delete: narviMethod({
    method: 'DELETE',
    fullPath: '/baas/v1.0/entity/business/{businessPid}/admin/{adminPid}/delete',
  }),
  list: narviMethod({
    method: 'GET',
    methodType: 'list',
    fullPath: '/baas/v1.0/entity/business/{businessPid}/admin/list',
  }),
})

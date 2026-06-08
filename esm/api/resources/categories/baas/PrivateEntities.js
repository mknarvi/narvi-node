import { NarviResource } from '../../NarviResource';
const narviMethod = NarviResource.method;
export const PrivateEntities = NarviResource.extend({
    create: narviMethod({
        method: 'POST',
        fullPath: '/baas/v1.0/entity/private/create',
    }),
    update: narviMethod({
        method: 'PUT',
        fullPath: '/baas/v1.0/entity/private/{pid}/update',
    }),
    retrieve: narviMethod({
        method: 'GET',
        fullPath: '/baas/v1.0/entity/private/{pid}/retrieve',
    }),
    list: narviMethod({
        method: 'GET',
        methodType: 'list',
        fullPath: '/baas/v1.0/entity/private/list',
    }),
    settingsUpdateInit: narviMethod({
        method: 'PUT',
        fullPath: '/baas/v1.0/entity/private/settings/update/init',
    }),
    settingsUpdateComplete: narviMethod({
        method: 'PUT',
        fullPath: '/baas/v1.0/entity/private/settings/update/complete',
    }),
    settingsUpdateFinish: narviMethod({
        method: 'PUT',
        fullPath: '/baas/v1.0/entity/private/settings/update/finish',
    }),
});

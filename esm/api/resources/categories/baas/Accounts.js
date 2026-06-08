import { NarviResource } from '../../NarviResource';
const narviMethod = NarviResource.method;
export const Accounts = NarviResource.extend({
    create: narviMethod({
        method: 'POST',
        fullPath: '/baas/v1.0/account/create',
    }),
    update: narviMethod({
        method: 'PUT',
        fullPath: '/baas/v1.0/account/{pid}/update',
    }),
    retrieve: narviMethod({
        method: 'GET',
        fullPath: '/baas/v1.0/account/{pid}/retrieve',
    }),
    list: narviMethod({
        method: 'GET',
        methodType: 'list',
        fullPath: '/baas/v1.0/account/list',
    }),
    balance: narviMethod({
        method: 'GET',
        fullPath: '/baas/v1.0/account/{pid}/balance/{date}',
    }),
});

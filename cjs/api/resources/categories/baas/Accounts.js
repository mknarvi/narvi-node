"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Accounts = void 0;
const NarviResource_1 = require("../../NarviResource");
const narviMethod = NarviResource_1.NarviResource.method;
exports.Accounts = NarviResource_1.NarviResource.extend({
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

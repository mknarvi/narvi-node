"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Transactions = void 0;
const NarviResource_1 = require("../../NarviResource");
const narviMethod = NarviResource_1.NarviResource.method;
exports.Transactions = NarviResource_1.NarviResource.extend({
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
});

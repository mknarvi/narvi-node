"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessEntities = void 0;
const NarviResource_1 = require("../../NarviResource");
const narviMethod = NarviResource_1.NarviResource.method;
exports.BusinessEntities = NarviResource_1.NarviResource.extend({
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
});

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessAdmins = void 0;
const NarviResource_1 = require("../../NarviResource");
const narviMethod = NarviResource_1.NarviResource.method;
exports.BusinessAdmins = NarviResource_1.NarviResource.extend({
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
});

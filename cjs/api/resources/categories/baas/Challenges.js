"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Challenges = void 0;
const NarviResource_1 = require("../../NarviResource");
const narviMethod = NarviResource_1.NarviResource.method;
exports.Challenges = NarviResource_1.NarviResource.extend({
    retrieve: narviMethod({
        method: 'GET',
        fullPath: '/baas/v1.0/challenge/{pid}/retrieve',
    }),
});

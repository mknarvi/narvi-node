import { NarviResource } from '../../NarviResource';
const narviMethod = NarviResource.method;
export const Challenges = NarviResource.extend({
    retrieve: narviMethod({
        method: 'GET',
        fullPath: '/baas/v1.0/challenge/{pid}/retrieve',
    }),
});

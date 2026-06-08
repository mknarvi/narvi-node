// File generated from our OpenAPI spec

import { resourceNamespace } from './ResourceNamespace'
import { PrivateEntities } from './categories/baas/PrivateEntities'
import { BusinessEntities } from './categories/baas/BusinessEntities'
import { BusinessAdmins } from './categories/baas/BusinessAdmins'
import { Accounts as BaasAccounts } from './categories/baas/Accounts'
import { Transactions as BaasTransactions } from './categories/baas/Transactions'
import { Challenges } from './categories/baas/Challenges'
import { Files } from './categories/baas/Files'

export { Accounts } from './categories/Accounts'
export { Transactions } from './categories/Transactions'

// Banking-as-a-Service endpoints, nested under `narvi.baas.*`
export const Baas = resourceNamespace('baas', {
  PrivateEntities,
  BusinessEntities,
  BusinessAdmins,
  Accounts: BaasAccounts,
  Transactions: BaasTransactions,
  Challenges,
  Files,
})

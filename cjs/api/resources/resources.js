"use strict";
// File generated from our OpenAPI spec
Object.defineProperty(exports, "__esModule", { value: true });
exports.Baas = exports.Transactions = exports.Accounts = void 0;
const ResourceNamespace_1 = require("./ResourceNamespace");
const PrivateEntities_1 = require("./categories/baas/PrivateEntities");
const BusinessEntities_1 = require("./categories/baas/BusinessEntities");
const BusinessAdmins_1 = require("./categories/baas/BusinessAdmins");
const Accounts_1 = require("./categories/baas/Accounts");
const Transactions_1 = require("./categories/baas/Transactions");
const Challenges_1 = require("./categories/baas/Challenges");
const Files_1 = require("./categories/baas/Files");
var Accounts_2 = require("./categories/Accounts");
Object.defineProperty(exports, "Accounts", { enumerable: true, get: function () { return Accounts_2.Accounts; } });
var Transactions_2 = require("./categories/Transactions");
Object.defineProperty(exports, "Transactions", { enumerable: true, get: function () { return Transactions_2.Transactions; } });
// Banking-as-a-Service endpoints, nested under `narvi.baas.*`
exports.Baas = (0, ResourceNamespace_1.resourceNamespace)('baas', {
    PrivateEntities: PrivateEntities_1.PrivateEntities,
    BusinessEntities: BusinessEntities_1.BusinessEntities,
    BusinessAdmins: BusinessAdmins_1.BusinessAdmins,
    Accounts: Accounts_1.Accounts,
    Transactions: Transactions_1.Transactions,
    Challenges: Challenges_1.Challenges,
    Files: Files_1.Files,
});

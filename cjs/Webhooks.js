"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhooks = void 0;
const crypto = require("crypto");
const qs = require("qs");
const Errors_1 = require("./errors/Errors");
const utils_1 = require("./utils/utils");
const WEBHOOK_HEADER = {
    signature: 'webhook-request-signature',
    timestamp: 'webhook-request-timestamp',
    eventType: 'webhook-request-event-type',
    eventPID: 'webhook-request-event-pid',
};
function headerValue(headers, name) {
    if (!headers) {
        return undefined;
    }
    for (const key of Object.keys(headers)) {
        if (key.toLowerCase() === name) {
            const value = headers[key];
            return Array.isArray(value) ? value[0] : value;
        }
    }
    return undefined;
}
function resolveParts(params) {
    var _a, _b, _c, _d;
    const signature = (_a = params.signature) !== null && _a !== void 0 ? _a : headerValue(params.headers, WEBHOOK_HEADER.signature);
    const nonce = (_b = params.timestamp) !== null && _b !== void 0 ? _b : headerValue(params.headers, WEBHOOK_HEADER.timestamp);
    const eventType = (_c = params.eventType) !== null && _c !== void 0 ? _c : headerValue(params.headers, WEBHOOK_HEADER.eventType);
    const eventPID = (_d = params.eventPID) !== null && _d !== void 0 ? _d : headerValue(params.headers, WEBHOOK_HEADER.eventPID);
    const payload = typeof params.payload === 'string'
        ? params.payload.length
            ? JSON.parse(params.payload)
            : undefined
        : params.payload;
    let queryParams = params.queryParams;
    if (queryParams === undefined) {
        const query = (0, utils_1.getQueryFromUrl)(params.url);
        queryParams = query ? qs.parse(query) : undefined;
    }
    return { signature, nonce, eventType, eventPID, payload, queryParams };
}
function safeHexCompare(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string') {
        return false;
    }
    if (a.length === 0 || a.length !== b.length) {
        return false;
    }
    try {
        return crypto.timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'));
    }
    catch (_a) {
        return false;
    }
}
function verifySignature(params) {
    const { signature, nonce, eventType, eventPID, payload, queryParams } = resolveParts(params);
    if (!signature || !nonce || !eventType || !eventPID) {
        return false;
    }
    const expected = (0, utils_1.getNarviWebhookSignature)({
        url: params.url,
        method: params.method,
        nonce,
        eventType,
        eventPID,
        queryParams,
        payload,
        webhookSecret: params.secret,
    });
    return safeHexCompare(expected, signature);
}
function constructEvent(params) {
    var _a;
    const { signature, nonce, eventType, eventPID, payload } = resolveParts(params);
    if (!verifySignature(params)) {
        throw new Errors_1.NarviSignatureVerificationError(String(signature !== null && signature !== void 0 ? signature : ''), typeof params.payload === 'string'
            ? params.payload
            : JSON.stringify((_a = params.payload) !== null && _a !== void 0 ? _a : ''), {
            message: 'Webhook signature verification failed: the computed signature does not match WEBHOOK-REQUEST-SIGNATURE.',
        });
    }
    return {
        type: eventType,
        pid: eventPID,
        timestamp: nonce,
        payload: payload,
    };
}
exports.webhooks = {
    signature: utils_1.getNarviWebhookSignature,
    verifySignature,
    constructEvent,
};

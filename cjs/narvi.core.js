"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNarvi = createNarvi;
const apiVersion = require("./api/apiVersion");
const RequestSender_1 = require("./api/requests/RequestSender");
const utils_1 = require("./utils/utils");
const Webhooks_1 = require("./Webhooks");
const resources = require("./api/resources/resources");
const NarviResource_1 = require("./api/resources/NarviResource");
const HttpClient_1 = require("./http/HttpClient");
const _Error = require("./errors/Errors");
const CryptoProvider_1 = require("./crypto/CryptoProvider");
const version_1 = require("./version");
const DEFAULT_HOST = 'api.narvi.com';
const DEFAULT_PORT = '443';
const DEFAULT_BASE_PATH = '/v1/';
const DEFAULT_API_VERSION = apiVersion.ApiVersion;
const DEFAULT_TIMEOUT = 80000;
const MAX_NETWORK_RETRY_DELAY_SEC = 2;
const INITIAL_NETWORK_RETRY_DELAY_SEC = 0.5;
const ALLOWED_CONFIG_PROPERTIES = [
    'apiKeyId',
    'privateKeyFilePath',
    'apiVersion',
    'typescript',
    'maxNetworkRetries',
    'httpAgent',
    'httpClient',
    'timeout',
    'host',
    'port',
    'protocol',
    'telemetry',
    'appInfo',
    'narviAccount',
];
const defaultRequestSenderFactory = (narvi) => new RequestSender_1.RequestSender(narvi);
function createNarvi(platformFunctions, requestSender = defaultRequestSenderFactory) {
    Narvi.PACKAGE_VERSION = version_1.version;
    Narvi.USER_AGENT = Object.assign({ bindings_version: Narvi.PACKAGE_VERSION, lang: 'node', publisher: 'narvi', uname: null, typescript: false }, (0, utils_1.determineProcessUserAgentProperties)());
    Narvi.NarviResource = NarviResource_1.NarviResource;
    Narvi.resources = resources;
    Narvi.HttpClient = HttpClient_1.HttpClient;
    Narvi.HttpClientResponse = HttpClient_1.HttpClientResponse;
    Narvi.CryptoProvider = CryptoProvider_1.CryptoProvider;
    function Narvi(config) {
        if (!(this instanceof Narvi)) {
            return new Narvi(config);
        }
        const props = this._getPropsFromConfig(config);
        this._platformFunctions = platformFunctions;
        this.VERSION = Narvi.PACKAGE_VERSION;
        if (props.protocol &&
            props.protocol !== 'https' &&
            (!props.host || /\.narvi\.com$/.test(props.host))) {
            throw new Error('The `https` protocol must be used when sending requests to `*.narvi.com`');
        }
        const agent = props.httpAgent || null;
        this._api = {
            auth: null,
            host: props.host || DEFAULT_HOST,
            port: props.port || DEFAULT_PORT,
            protocol: props.protocol || 'https',
            basePath: DEFAULT_BASE_PATH,
            version: props.apiVersion || DEFAULT_API_VERSION,
            apiKeyId: props.apiKeyId,
            privateKey: (0, utils_1.loadPrivateKeyFromFile)(props.privateKeyFilePath),
            timeout: (0, utils_1.validateInteger)('timeout', props.timeout, DEFAULT_TIMEOUT),
            maxNetworkRetries: (0, utils_1.validateInteger)('maxNetworkRetries', props.maxNetworkRetries, 1),
            agent: agent,
            httpClient: props.httpClient ||
                (agent
                    ? this._platformFunctions.createNodeHttpClient(agent)
                    : this._platformFunctions.createDefaultHttpClient()),
            dev: false,
            narviAccount: props.narviAccount || null,
        };
        const typescript = props.typescript || false;
        if (typescript !== Narvi.USER_AGENT.typescript) {
            // The mutation here is uncomfortable, but likely fastest;
            // serializing the user agent involves shelling out to the system,
            // and given some users may instantiate the library many times without switching between TS and non-TS,
            // we only want to incur the performance hit when that actually happens.
            Narvi.USER_AGENT.typescript = typescript;
        }
        this._prepResources();
        // this._setApiKey(key)
        this.errors = _Error;
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore webhooks is not part of NarviObject's base shape
        this.webhooks = Webhooks_1.webhooks;
        this._requestSender = requestSender(this);
        // Expose NarviResource on the instance too
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        this.NarviResource = Narvi.NarviResource;
    }
    Narvi.errors = _Error;
    Narvi.createNodeHttpClient = platformFunctions.createNodeHttpClient;
    Narvi.createFetchHttpClient = platformFunctions.createFetchHttpClient;
    Narvi.createNodeCryptoProvider = platformFunctions.createNodeCryptoProvider;
    Narvi.createSubtleCryptoProvider =
        platformFunctions.createSubtleCryptoProvider;
    Narvi.getPaginationCursor = utils_1.getPaginationCursor;
    Narvi.getNarviRequestHeaders = utils_1.getNarviRequestHeaders;
    Narvi.getNarviRequestSignature = utils_1.getNarviRequestSignature;
    Narvi.getNarviRequestSignaturePayload = utils_1.getNarviRequestSignaturePayload;
    Narvi.getNarviChallengeSignature = utils_1.getNarviChallengeSignature;
    Narvi.getNarviWebhookSignature = utils_1.getNarviWebhookSignature;
    Narvi.webhooks = Webhooks_1.webhooks;
    /* eslint-disable-next-line @typescript-eslint/ban-ts-comment */
    // @ts-ignore
    Narvi.prototype = {
        // Properties are set in the constructor above
        VERSION: null,
        errors: null,
        _api: null,
        _requestSender: null,
        _platformFunctions: null,
        // /**
        //  * @private
        //  */
        // _setApiKey(key: string): void {
        //   if (key) {
        //     this._setApiField('auth', `Bearer ${key}`)
        //   }
        // },
        /**
         * @private
         * This may be removed in the future.
         */
        _setApiField(key, value) {
            this._api[key] = value;
        },
        getConstant: (c) => {
            switch (c) {
                case 'DEFAULT_HOST':
                    return DEFAULT_HOST;
                case 'DEFAULT_PORT':
                    return DEFAULT_PORT;
                case 'DEFAULT_BASE_PATH':
                    return DEFAULT_BASE_PATH;
                case 'DEFAULT_API_VERSION':
                    return DEFAULT_API_VERSION;
                case 'DEFAULT_TIMEOUT':
                    return DEFAULT_TIMEOUT;
                case 'MAX_NETWORK_RETRY_DELAY_SEC':
                    return MAX_NETWORK_RETRY_DELAY_SEC;
                case 'INITIAL_NETWORK_RETRY_DELAY_SEC':
                    return INITIAL_NETWORK_RETRY_DELAY_SEC;
            }
            return Narvi[c];
        },
        getMaxNetworkRetries() {
            return this.getApiField('maxNetworkRetries');
        },
        /**
         * @private
         * It may be deprecated and removed in the future.
         *
         * Gets a JSON version of a User-Agent and uses a cached version for a slight
         * speed advantage.
         */
        getClientUserAgent(cb) {
            return this.getClientUserAgentSeeded(Narvi.USER_AGENT, cb);
        },
        /**
         * @private
         * It may be deprecated and removed in the future.
         *
         * Gets a JSON version of a User-Agent by encoding a seeded object and
         * fetching a uname from the system.
         */
        getClientUserAgentSeeded(seed, cb) {
            this._platformFunctions.getUname().then((uname) => {
                var _a;
                const userAgent = {};
                for (const field in seed) {
                    userAgent[field] = encodeURIComponent((_a = seed[field]) !== null && _a !== void 0 ? _a : 'null');
                }
                // URI-encode in case there are unusual characters in the system's uname.
                userAgent.uname = encodeURIComponent(uname || 'UNKNOWN');
                const client = this.getApiField('httpClient');
                if (client) {
                    userAgent.httplib = encodeURIComponent(client.getClientName());
                }
                cb(JSON.stringify(userAgent));
            });
        },
        getApiField(key) {
            return this._api[key];
        },
        getMaxNetworkRetryDelay() {
            return MAX_NETWORK_RETRY_DELAY_SEC;
        },
        getInitialNetworkRetryDelay() {
            return INITIAL_NETWORK_RETRY_DELAY_SEC;
        },
        /**
         * @private
         * This may be removed in the future.
         */
        _prepResources() {
            for (const name in resources) {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                this[(0, utils_1.pascalToCamelCase)(name)] = new resources[name](this);
            }
        },
        /**
         * @private
         * This may be removed in the future.
         */
        _getPropsFromConfig(config) {
            // config can be an object or a string
            const isString = typeof config === 'string';
            const isObject = config === Object(config) && !Array.isArray(config);
            if (!isObject && !isString) {
                throw new Error('Config must either be an object or a string');
            }
            // If config is an object, we assume the new behavior and make sure it doesn't contain any unexpected values
            const values = Object.keys(config).filter((value) => !ALLOWED_CONFIG_PROPERTIES.includes(value));
            if (values.length > 0) {
                throw new Error(`Config object may only contain the following: ${ALLOWED_CONFIG_PROPERTIES.join(', ')}`);
            }
            return config;
        },
    };
    return Narvi;
}

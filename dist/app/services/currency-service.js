"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeGeoIP = void 0;
exports.localizePrices = localizePrices;
const ip_location_api_1 = require("ip-location-api");
const axios_1 = __importDefault(require("axios"));
// --- CONFIGURATION & CACHE ---
const BASE_CURRENCY = 'BDT';
const TARGET_FIELDS = 'currency';
const CACHE_EXPIRY_MS = 60 * 60 * 1000; // 1 hour for exchange rates
let isDatabaseLoaded = false;
const currencyCache = { timestamp: 0, rates: {} };
// --- GEOIP INITIALIZATION ---
/**
 * Loads the ip-location-api database into memory once at server startup.
 * Uses synchronous mode for fast runtime lookups.
 */
const initializeGeoIP = () => __awaiter(void 0, void 0, void 0, function* () {
    if (!isDatabaseLoaded) {
        console.log("Loading IP location database for synchronous use...");
        try {
            // Configure to load only the 'currency' field
            yield (0, ip_location_api_1.reload)({ fields: TARGET_FIELDS, smallMemory: false });
            isDatabaseLoaded = true;
            console.log("IP location database loaded successfully.");
        }
        catch (error) {
            console.warn("WARNING: Failed to load GeoIP database. Currency localization will fallback to BDT. Error:", error);
            // Don't exit - let server start without GeoIP
            // process.exit(1);
        }
    }
}); // --- EXCHANGE RATE LOGIC (CACHED) ---
exports.initializeGeoIP = initializeGeoIP;
/**
 * Fetches and caches exchange rates from Exchangerate.host (free service).
 * Base currency is BDT. Rates are cached for 1 hour.
 */
const getExchangeRate = (from, to) => __awaiter(void 0, void 0, void 0, function* () {
    const now = Date.now();
    // 1. Check Cache
    if (currencyCache.timestamp > now - CACHE_EXPIRY_MS && currencyCache.rates[to]) {
        return currencyCache.rates[to];
    }
    // 2. Fetch New Rates
    try {
        console.log(`Fetching live rates from ${from} to ${to}...`);
        const response = yield axios_1.default.get(`https://api.exchangerate.host/latest?base=${from}`);
        // 3. Update Cache
        currencyCache.rates = response.data.rates;
        currencyCache.timestamp = now;
        return currencyCache.rates[to] || 1;
    }
    catch (error) {
        console.error("Failed to fetch live rates. Using fallback rate of 1.", error);
        return currencyCache.rates[to] || 1;
    }
});
// --- GEOIP LOOKUP LOGIC (SYNCHRONOUS) ---
/**
 * Gets the target currency code from the client IP using the fast, in-memory lookup.
 */
const getTargetCurrencyFromIP = (ip) => {
    var _a;
    if (!isDatabaseLoaded)
        return BASE_CURRENCY;
    try {
        // Synchronous lookup
        const geo = (0, ip_location_api_1.lookup)(ip);
        const currency = (_a = geo === null || geo === void 0 ? void 0 : geo.currency) === null || _a === void 0 ? void 0 : _a[0];
        return currency || BASE_CURRENCY; // Fallback to BDT
    }
    catch (error) {
        console.log("Error from getTarget Currency From IP", error);
        return BASE_CURRENCY;
    }
};
// --- CORE LOCALIZATION FUNCTION ---
/**
 * The main function to convert prices. It is designed to OVERWRITE
 * the existing price fields and add display fields.
 */
function localizePrices(req, data) {
    return __awaiter(this, void 0, void 0, function* () {
        const clientIP = req.ip;
        const targetCurrency = getTargetCurrencyFromIP(clientIP);
        const convertAndFormat = (price) => __awaiter(this, void 0, void 0, function* () {
            const rate = yield getExchangeRate(BASE_CURRENCY, targetCurrency);
            const convertedPrice = price * rate;
            // Use Intl.NumberFormat for professional, locale-aware formatting
            const formatter = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: targetCurrency,
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
            });
            return {
                raw: parseFloat(convertedPrice.toFixed(2)),
                display: formatter.format(convertedPrice),
            };
        });
        const processItem = (item) => __awaiter(this, void 0, void 0, function* () {
            // Only process items that look like products/prices
            if (item && item.basePrice !== undefined && item.discountedPrice !== undefined) {
                const convertedBase = yield convertAndFormat(item.basePrice);
                const convertedDiscounted = yield convertAndFormat(item.discountedPrice);
                // 1. OVERWRITE FIELDS (Frontend sees no change in field names)
                item.basePrice = convertedBase.raw;
                item.discountedPrice = convertedDiscounted.raw;
                // 2. NEW FIELDS (Frontend uses these for display)
                item.currencyCode = targetCurrency;
                item.currencyDisplay = convertedDiscounted.display;
            }
            return item;
        });
        // Handle Arrays (List of Products) or Single Objects (Product Detail)
        if (Array.isArray(data)) {
            return Promise.all(data.map(processItem));
        }
        if (data && data.basePrice !== undefined) {
            return processItem(data);
        }
        return data;
    });
}

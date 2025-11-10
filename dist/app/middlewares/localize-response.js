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
Object.defineProperty(exports, "__esModule", { value: true });
exports.localizeResponseMiddleware = void 0;
const currency_service_1 = require("../services/currency-service");
const localizeResponseMiddleware = (req, res, next) => {
    // Save the original res.json function
    const originalJson = res.json;
    // Overwrite the res.json function
    res.json = function (data) {
        return __awaiter(this, void 0, void 0, function* () {
            // Check if the response data is a structure containing prices
            const shouldProcess = ((data && data.basePrice !== undefined) ||
                (Array.isArray(data) && data.length > 0 && data[0].basePrice !== undefined));
            if (shouldProcess) {
                try {
                    // Call the asynchronous localization service and await the modified data
                    const localizedData = yield (0, currency_service_1.localizePrices)(req, data);
                    // Call the original res.json with the MODIFIED data
                    return originalJson.call(this, localizedData);
                }
                catch (error) {
                    console.error("Localization Middleware Error. Sending original data.", error);
                    // Fallback: send original data in BDT
                    return originalJson.call(this, data);
                }
            }
            // For all non-price responses, proceed normally
            return originalJson.call(this, data);
        });
    };
    next();
};
exports.localizeResponseMiddleware = localizeResponseMiddleware;

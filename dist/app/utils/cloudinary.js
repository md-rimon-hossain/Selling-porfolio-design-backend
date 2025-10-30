"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.uploadBufferToCloudinary = uploadBufferToCloudinary;
exports.deleteByPublicId = deleteByPublicId;
const cloudinary_1 = require("cloudinary");
const streamifier = __importStar(require("streamifier"));
// Configure Cloudinary with env vars. Ensure these are set in your environment.
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
    api_key: process.env.CLOUDINARY_API_KEY || "",
    api_secret: process.env.CLOUDINARY_API_SECRET || "",
});
function uploadBufferToCloudinary(buffer_1) {
    return __awaiter(this, arguments, void 0, function* (buffer, folder = "designs", resource_type = "auto", options) {
        return new Promise((resolve, reject) => {
            const uploadOptions = { folder, resource_type };
            if (options === null || options === void 0 ? void 0 : options.useFilename)
                uploadOptions.use_filename = true;
            if ((options === null || options === void 0 ? void 0 : options.uniqueFilename) === false)
                uploadOptions.unique_filename = true;
            if (options === null || options === void 0 ? void 0 : options.forceFormat)
                uploadOptions.format = options.forceFormat;
            // Let Cloudinary use the original filename where helpful
            if ((options === null || options === void 0 ? void 0 : options.originalName) && !uploadOptions.public_id) {
                // do not set public_id to full filename including extension; let use_filename handle it
                // but we still pass use_filename to hint Cloudinary
                uploadOptions.original_filename = options.originalName;
            }
            const stream = cloudinary_1.v2.uploader.upload_stream(uploadOptions, (error, result) => {
                var _a, _b, _c, _d, _e, _f;
                if (error)
                    return reject(error);
                // result types from SDK are loose; access carefully via unknown
                const r = result;
                const ver = r && ((_a = r.version) !== null && _a !== void 0 ? _a : r.v) ? ((_b = r.version) !== null && _b !== void 0 ? _b : r.v) : undefined;
                resolve({
                    public_id: String((_c = r.public_id) !== null && _c !== void 0 ? _c : ""),
                    secure_url: String((_d = r.secure_url) !== null && _d !== void 0 ? _d : ""),
                    file_format: String((_e = r.format) !== null && _e !== void 0 ? _e : ""),
                    bytes: Number((_f = r.bytes) !== null && _f !== void 0 ? _f : 0),
                    version: ver !== undefined ? String(ver) : undefined,
                    raw: r,
                });
            });
            streamifier.createReadStream(buffer).pipe(stream);
        });
    });
}
function deleteByPublicId(publicId_1) {
    return __awaiter(this, arguments, void 0, function* (publicId, resource_type = "auto") {
        return new Promise((resolve, reject) => {
            cloudinary_1.v2.uploader.destroy(publicId, { resource_type }, (err, result) => {
                if (err)
                    return reject(err);
                resolve(result);
            });
        });
    });
}
exports.default = cloudinary_1.v2;

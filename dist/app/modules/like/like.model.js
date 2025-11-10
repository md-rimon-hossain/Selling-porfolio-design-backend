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
exports.Like = void 0;
const mongoose_1 = require("mongoose");
const likeSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "User reference is required"],
    },
    design: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Design",
    },
    course: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Course",
    },
}, {
    timestamps: true,
    versionKey: false,
});
// 💡 Validation Hook to ensure only one item is liked
likeSchema.pre("validate", function (next) {
    // Ensures exactly one of design or course is provided.
    if (!!this.design === !!this.course) {
        return next(new Error("A like must reference exactly one Design or one Course."));
    }
    next();
});
// Function to handle incrementing the count
function updateCount(doc, increment) {
    return __awaiter(this, void 0, void 0, function* () {
        const Model = doc.design ? (0, mongoose_1.model)('Design') : (0, mongoose_1.model)('Course');
        const id = doc.design || doc.course;
        if (id) {
            yield Model.findByIdAndUpdate(id, { $inc: { likesCount: increment } }).exec();
        }
    });
}
// 💡 Post-save hook (after a like is created)
likeSchema.post('save', function (doc) {
    // We use setTimeout to ensure this doesn't slow down the response time
    setTimeout(() => updateCount(doc, 1), 0);
});
// 💡 Post-remove hook (after a like is deleted/unliked)
likeSchema.post('findOneAndDelete', function (doc) {
    if (doc) {
        setTimeout(() => updateCount(doc, -1), 0);
    }
});
// 💡 Compound indexes for uniqueness in both scenarios
likeSchema.index({ user: 1, design: 1 }, { unique: true, partialFilterExpression: { design: { $exists: true } } });
likeSchema.index({ user: 1, course: 1 }, { unique: true, partialFilterExpression: { course: { $exists: true } } });
exports.Like = (0, mongoose_1.model)("Like", likeSchema);

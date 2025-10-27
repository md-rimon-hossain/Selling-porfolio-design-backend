import { Schema, model, Document } from "mongoose";

export interface ILike extends Document {
  user: Schema.Types.ObjectId;
  design?: Schema.Types.ObjectId;
  course?: Schema.Types.ObjectId; // 💡 NEW FIELD
  createdAt: Date;
}

const likeSchema = new Schema<ILike>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
    },
    design: {
      type: Schema.Types.ObjectId,
      ref: "Design",
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// 💡 Validation Hook to ensure only one item is liked
likeSchema.pre("validate", function (next) {
  // Ensures exactly one of design or course is provided.
  if (!!this.design === !!this.course) {
    return next(
      new Error("A like must reference exactly one Design or one Course."),
    );
  }
  next();
});

// Function to handle incrementing the count
async function updateCount(doc: ILike, increment: number) {
  const Model = doc.design ? model('Design') : model('Course');
  const id = doc.design || doc.course;
  
  if (id) {
    await Model.findByIdAndUpdate(id, { $inc: { likesCount: increment } }).exec();
  }
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
likeSchema.index(
  { user: 1, design: 1 },
  { unique: true, partialFilterExpression: { design: { $exists: true } } },
);
likeSchema.index(
  { user: 1, course: 1 },
  { unique: true, partialFilterExpression: { course: { $exists: true } } },
);

export const Like = model<ILike>("Like", likeSchema);

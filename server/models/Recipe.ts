import mongoose, { type InferSchemaType } from "mongoose";
import { normalizeTags } from "../lib/slug";

const { Schema, model, models } = mongoose;

const cloudImageSchema = new Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
  },
  { _id: false },
);

const recipeSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, trim: true },
    dateCooked: { type: Date, required: true },
    heroImage: { type: cloudImageSchema, default: undefined },
    gallery: { type: [cloudImageSchema], default: [] },
    ingredients: { type: [String], default: [] },
    steps: { type: [String], default: [] },
    tags: { type: [String], default: [], index: true },
    cuisine: { type: String, trim: true },
    prepMinutes: { type: Number, min: 0 },
    cookMinutes: { type: Number, min: 0 },
    servings: { type: Number, min: 0 },
    rating: { type: Number, min: 1, max: 5 },
    makeAgain: { type: Boolean, default: false },
    notes: { type: String },
    sourceUrl: { type: String, trim: true },
    createdBy: { type: String, required: true },
  },
  { timestamps: true },
);

// Full-text search across the fields the FilterBar searches.
recipeSchema.index({ title: "text", tags: "text", ingredients: "text", description: "text" });
// Default sort = most recently cooked first.
recipeSchema.index({ dateCooked: -1 });

// Keep tags lowercased + de-duped on every save.
recipeSchema.pre("save", function (next) {
  if (this.isModified("tags")) {
    this.tags = normalizeTags(this.tags);
  }
  next();
});

export type RecipeDoc = InferSchemaType<typeof recipeSchema>;

export const Recipe = (models.Recipe as mongoose.Model<RecipeDoc>) || model("Recipe", recipeSchema);

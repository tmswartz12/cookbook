import mongoose, { type InferSchemaType } from "mongoose";

const { Schema, model, models } = mongoose;

const suggestionSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    instagram: { type: String, trim: true },
    sourceUrl: { type: String, trim: true },
    cooked: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Admin list shows newest first, with un-cooked ahead of cooked.
suggestionSchema.index({ cooked: 1, createdAt: -1 });

export type SuggestionDoc = InferSchemaType<typeof suggestionSchema>;

export const Suggestion =
  (models.Suggestion as mongoose.Model<SuggestionDoc>) || model("Suggestion", suggestionSchema);

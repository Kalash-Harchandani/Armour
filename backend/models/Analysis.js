/**
 * Analysis Model
 * Mongoose schema for storing AI analysis results
 */

import mongoose from "mongoose";

const analysisSchema = new mongoose.Schema(
  {
    scanId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    domain: {
      type: String,
      required: true,
      index: true,
    },
    // Store the complete analysis data
    analysis: {
      type: String,
      required: true,
    },
    // Store the full analysis result object
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    // Timestamps
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // Automatically manage createdAt and updatedAt
  }
);

// Index for faster queries
analysisSchema.index({ userId: 1, createdAt: -1 });
analysisSchema.index({ scanId: 1 });
analysisSchema.index({ domain: 1, createdAt: -1 });

const Analysis = mongoose.model("Analysis", analysisSchema);

export default Analysis;


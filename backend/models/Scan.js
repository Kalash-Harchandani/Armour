/**
 * Scan Model
 * Mongoose schema for storing domain scan results
 */

import mongoose from "mongoose";

const scanSchema = new mongoose.Schema(
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
    mode: {
      type: String,
      enum: ["quick", "full"],
      required: true,
    },
    status: {
      type: String,
      default: "completed",
    },
    // Store the complete scan data
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
scanSchema.index({ userId: 1, createdAt: -1 });
scanSchema.index({ domain: 1, createdAt: -1 });
scanSchema.index({ scanId: 1 });

// Prevent duplicate scans for the same domain within a short time window
scanSchema.index({ userId: 1, domain: 1, mode: 1, createdAt: -1 });

const Scan = mongoose.model("Scan", scanSchema);

export default Scan;


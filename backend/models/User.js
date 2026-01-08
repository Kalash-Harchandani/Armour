/**
 * User Model
 * Mongoose schema for storing user authentication and scan limits
 */

import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    googleId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    picture: {
      type: String,
    },
    // Scan limits
    scanLimits: {
      quickScansUsed: {
        type: Number,
        default: 0,
      },
      fullScansUsed: {
        type: Number,
        default: 0,
      },
      quickScansLimit: {
        type: Number,
        default: 3,
      },
      fullScansLimit: {
        type: Number,
        default: 2,
      },
    },
    // Timestamps
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
userSchema.index({ googleId: 1 });
userSchema.index({ email: 1 });

// Method to check if user can perform a scan
userSchema.methods.canScan = function (scanType) {
  if (scanType === "quick") {
    return this.scanLimits.quickScansUsed < this.scanLimits.quickScansLimit;
  } else if (scanType === "full") {
    return this.scanLimits.fullScansUsed < this.scanLimits.fullScansLimit;
  }
  return false;
};

// Method to get remaining scans
userSchema.methods.getRemainingScans = function () {
  return {
    quick: Math.max(0, this.scanLimits.quickScansLimit - this.scanLimits.quickScansUsed),
    full: Math.max(0, this.scanLimits.fullScansLimit - this.scanLimits.fullScansUsed),
  };
};

// Method to increment scan count
userSchema.methods.incrementScanCount = async function (scanType) {
  if (scanType === "quick") {
    this.scanLimits.quickScansUsed += 1;
  } else if (scanType === "full") {
    this.scanLimits.fullScansUsed += 1;
  }
  await this.save();
};

const User = mongoose.model("User", userSchema);

export default User;


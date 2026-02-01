const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  // Multi-Gmail Account Support
  gmailAccounts: [{
    email: {
      type: String,
      required: true,
    },
    accessToken: {
      type: String,
      required: true,
    },
    refreshToken: {
      type: String,
      required: true,
    },
    label: {
      type: String,
      enum: ['Work', 'Personal', 'Other'],
      required: true,
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['connected', 'disconnected', 'error'],
      default: 'connected',
    },
    provider: {
      type: String,
      default: 'gmail',
    },
    lastSyncAt: {
      type: Date,
      default: null,
    },
    connectedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  activeGmailAccountId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
  // Legacy fields (kept for migration compatibility)
  gmailAccessToken: {
    type: String,
    default: null,
  },
  gmailRefreshToken: {
    type: String,
    default: null,
  },
  subscriptionTier: {
    type: String,
    enum: ['free', 'pro', 'power'],
    default: 'pro',
  },
  isGmailConnected: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastSyncAt: {
    type: Date,
    default: null,
  },
},
  // Brief Caching to reduce AI load
  dailyBrief: {
  type: Object, // Stores the full JSON brief
  default: null,
},
  dailyBriefGeneratedAt: {
  type: Date,
  default: null,
},
  // Push Notifications
  pushToken: {
  type: String,
  default: null,
},
  notificationSettings: {
  reminders: {
    type: Boolean,
    default: true, // ON by default
  },
  decisionFollowUps: {
    type: Boolean,
    default: true, // ON by default
  },
  urgentEmails: {
    type: Boolean,
    default: false, // OFF by default - gated feature
  },
},
  lastNotificationSentAt: {
  type: Date,
  default: null,
},
  notificationsSentToday: {
  type: Number,
  default: 0,
},
});

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT token
userSchema.methods.generateAuthToken = function () {
  return jwt.sign(
    { userId: this._id, email: this.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

module.exports = mongoose.model('User', userSchema);

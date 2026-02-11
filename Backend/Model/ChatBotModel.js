const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const chatBotSchema = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserModel',
    required: false // Allow unauthenticated users
  },
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  sessionName: {
    type: String,
    default: null // User can name their chat sessions
  },
  messages: [{
    type: {
      type: String,
      enum: ['user', 'bot', 'system'],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    intent: {
      type: String,
      default: null // Store the matched intent/category
    },
    confidence: {
      type: Number,
      default: 0 // Store confidence score for AI matching
    },
    messageId: {
      type: String,
      unique: true,
      default: () => Date.now().toString() + Math.random().toString(36).substr(2, 9)
    },
    attachments: [{
      filename: String,
      originalName: String,
      fileType: String,
      fileSize: Number,
      uploadDate: {
        type: Date,
        default: Date.now
      }
    }],
    isEdited: {
      type: Boolean,
      default: false
    },
    editHistory: [{
      originalContent: String,
      editedContent: String,
      editTimestamp: {
        type: Date,
        default: Date.now
      }
    }],
    reactions: [{
      emoji: String,
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserModel'
      },
      timestamp: {
        type: Date,
        default: Date.now
      }
    }]
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true
  }],
  summary: {
    type: String,
    default: null // AI-generated conversation summary
  },
  keyTopics: [{
    topic: String,
    relevance: Number,
    mentionedCount: Number
  }],
  satisfactionRating: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  totalMessages: {
    type: Number,
    default: 0
  },
  totalUserMessages: {
    type: Number,
    default: 0
  },
  totalBotMessages: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Enhanced indexes for efficient querying
chatBotSchema.index({ user: 1, sessionId: 1 });
chatBotSchema.index({ user: 1, lastActivity: -1 });
chatBotSchema.index({ user: 1, isActive: 1, isArchived: 1 });
chatBotSchema.index({ user: 1, isPinned: 1, lastActivity: -1 });
chatBotSchema.index({ 'messages.timestamp': -1 });
chatBotSchema.index({ 'messages.intent': 1 });
chatBotSchema.index({ tags: 1 });
chatBotSchema.index({ createdAt: -1 });

// Pre-save middleware to update counters
chatBotSchema.pre('save', function(next) {
  if (this.isModified('messages')) {
    this.totalMessages = this.messages.length;
    this.totalUserMessages = this.messages.filter(msg => msg.type === 'user').length;
    this.totalBotMessages = this.messages.filter(msg => msg.type === 'bot').length;
  }
  next();
});

// Instance methods
chatBotSchema.methods.addMessage = function(messageData) {
  this.messages.push({
    ...messageData,
    messageId: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    timestamp: new Date()
  });
  this.lastActivity = new Date();
  return this.save();
};

chatBotSchema.methods.editMessage = function(messageId, newContent) {
  const message = this.messages.id(messageId);
  if (message) {
    message.editHistory.push({
      originalContent: message.content,
      editedContent: newContent,
      editTimestamp: new Date()
    });
    message.content = newContent;
    message.isEdited = true;
    this.lastActivity = new Date();
    return this.save();
  }
  throw new Error('Message not found');
};

chatBotSchema.methods.addReaction = function(messageId, emoji, userId) {
  const message = this.messages.id(messageId);
  if (message) {
    // Remove existing reaction from same user
    message.reactions = message.reactions.filter(r => r.userId.toString() !== userId);
    // Add new reaction
    message.reactions.push({
      emoji,
      userId,
      timestamp: new Date()
    });
    this.lastActivity = new Date();
    return this.save();
  }
  throw new Error('Message not found');
};

chatBotSchema.methods.generateSummary = function() {
  const userMessages = this.messages.filter(msg => msg.type === 'user');
  const topics = {};
  
  userMessages.forEach(msg => {
    const words = msg.content.toLowerCase().split(/\s+/);
    words.forEach(word => {
      if (word.length > 3) {
        topics[word] = (topics[word] || 0) + 1;
      }
    });
  });
  
  const keyTopics = Object.entries(topics)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([topic, count]) => ({ topic, relevance: count / userMessages.length, mentionedCount: count }));
  
  this.keyTopics = keyTopics;
  this.summary = `Conversation about ${keyTopics[0]?.topic || 'legal matters'} with ${this.totalMessages} messages`;
  return this.save();
};

// Static methods
chatBotSchema.statics.getUserSessions = function(userId, options = {}) {
  const query = { user: userId, isActive: true };
  
  if (options.archived) {
    query.isArchived = true;
  }
  
  if (options.pinned) {
    query.isPinned = true;
  }
  
  return this.find(query)
    .sort({ lastActivity: -1 })
    .limit(options.limit || 50)
    .select('sessionId sessionName lastActivity totalMessages tags summary isPinned');
};

chatBotSchema.statics.searchMessages = function(userId, searchTerm, options = {}) {
  return this.find({
    user: userId,
    'messages.content': { $regex: searchTerm, $options: 'i' }
  })
  .sort({ 'messages.timestamp': -1 })
  .limit(options.limit || 20)
  .select('sessionId sessionName messages.$');
};

module.exports = mongoose.model('ChatBot', chatBotSchema);

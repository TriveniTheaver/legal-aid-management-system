const express = require("express");
const ChatBot = require("../Model/ChatBotModel");
const Case = require("../Model/CaseModel");
const { findBestMatch, generateSuggestions } = require("../services/chatbotKnowledgeBase");
const { protect } = require("../Controllers/UnverifiedAuthController");
const router = express.Router();

// Generate unique session ID
const generateSessionId = () => {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

// Send message to chatbot
router.post("/send", async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    const userId = req.user?.id || null; // Allow unauthenticated users

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ message: "Message cannot be empty" });
    }

    // Generate new session ID if not provided
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      currentSessionId = generateSessionId();
    }

    // Get user's cases for contextual responses (only if user is authenticated)
    let userCases = [];
    if (userId) {
      userCases = await Case.find({ user: userId })
        .select('caseNumber caseType status district')
        .lean();
    }

    // Find or create chat session
    let chatSession = await ChatBot.findOne({ 
      user: userId || null, 
      sessionId: currentSessionId 
    });

    if (!chatSession) {
      chatSession = new ChatBot({
        user: userId || null,
        sessionId: currentSessionId,
        messages: []
      });
    }

    // Add user message to session
    chatSession.messages.push({
      type: 'user',
      content: message.trim(),
      timestamp: new Date()
    });

    // Get AI response using knowledge base
    const aiResponse = findBestMatch(message, userCases);

    // Add bot response to session
    chatSession.messages.push({
      type: 'bot',
      content: aiResponse.answer,
      timestamp: new Date(),
      intent: aiResponse.intent,
      confidence: aiResponse.confidence
    });

    // Update session
    chatSession.lastActivity = new Date();
    chatSession.isActive = true;
    await chatSession.save();

    res.json({
      success: true,
      response: {
        message: aiResponse.answer,
        intent: aiResponse.intent,
        confidence: aiResponse.confidence
      },
      sessionId: currentSessionId,
      messageId: chatSession.messages[chatSession.messages.length - 1]._id
    });

  } catch (error) {
    console.error("Error processing chatbot message:", error);
    res.status(500).json({
      message: "Failed to process message",
      error: error.message
    });
  }
});

// Get chat history for a session
router.get("/session/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.id || null; // Allow unauthenticated users

    console.log('Looking for session:', sessionId, 'for user:', userId);

    // Try to find session by sessionId first, regardless of user
    let chatSession = await ChatBot.findOne({ sessionId: sessionId });

    // If found and user is authenticated, verify ownership
    if (chatSession && userId && chatSession.user && chatSession.user.toString() !== userId) {
      console.log('Session found but user mismatch');
      return res.status(404).json({ message: "Chat session not found" });
    }

    if (!chatSession) {
      console.log('Session not found in database');
      return res.status(404).json({ message: "Chat session not found" });
    }

    console.log('Session found:', chatSession.sessionId, 'with', chatSession.messages.length, 'messages');

    res.json({
      success: true,
      session: {
        sessionId: chatSession.sessionId,
        messages: chatSession.messages,
        lastActivity: chatSession.lastActivity,
        isActive: chatSession.isActive
      }
    });

  } catch (error) {
    console.error("Error fetching chat session:", error);
    res.status(500).json({
      message: "Failed to fetch chat session",
      error: error.message
    });
  }
});

// Get all chat sessions for user
router.get("/sessions", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { archived, pinned, limit } = req.query;
    const options = {
      archived: archived === 'true',
      pinned: pinned === 'true',
      limit: parseInt(limit) || 50
    };

    const sessions = await ChatBot.getUserSessions(userId, options);
    
    res.json({
      success: true,
      sessions: sessions,
      total: sessions.length
    });

  } catch (error) {
    console.error("Error fetching user sessions:", error);
    res.status(500).json({
      message: "Failed to fetch chat sessions",
      error: error.message
    });
  }
});

// Search messages across all sessions
router.get("/search", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { q: searchTerm, limit } = req.query;
    if (!searchTerm) {
      return res.status(400).json({ message: "Search term required" });
    }

    const options = { limit: parseInt(limit) || 20 };
    const results = await ChatBot.searchMessages(userId, searchTerm, options);
    
    res.json({
      success: true,
      results: results,
      total: results.length,
      searchTerm: searchTerm
    });

  } catch (error) {
    console.error("Error searching messages:", error);
    res.status(500).json({
      message: "Failed to search messages",
      error: error.message
    });
  }
});

// Archive/Unarchive session
router.patch("/session/:sessionId/archive", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { archived } = req.body;
    const userId = req.user?.id;

    const session = await ChatBot.findOne({ 
      sessionId: sessionId, 
      user: userId 
    });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    session.isArchived = archived;
    await session.save();

    res.json({
      success: true,
      message: `Session ${archived ? 'archived' : 'unarchived'} successfully`,
      session: {
        sessionId: session.sessionId,
        isArchived: session.isArchived
      }
    });

  } catch (error) {
    console.error("Error archiving session:", error);
    res.status(500).json({
      message: "Failed to archive session",
      error: error.message
    });
  }
});

// Pin/Unpin session
router.patch("/session/:sessionId/pin", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { pinned } = req.body;
    const userId = req.user?.id;

    const session = await ChatBot.findOne({ 
      sessionId: sessionId, 
      user: userId 
    });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    session.isPinned = pinned;
    await session.save();

    res.json({
      success: true,
      message: `Session ${pinned ? 'pinned' : 'unpinned'} successfully`,
      session: {
        sessionId: session.sessionId,
        isPinned: session.isPinned
      }
    });

  } catch (error) {
    console.error("Error pinning session:", error);
    res.status(500).json({
      message: "Failed to pin session",
      error: error.message
    });
  }
});

// Rename session
router.patch("/session/:sessionId/rename", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { sessionName } = req.body;
    const userId = req.user?.id;

    if (!sessionName || sessionName.trim().length === 0) {
      return res.status(400).json({ message: "Session name required" });
    }

    const session = await ChatBot.findOne({ 
      sessionId: sessionId, 
      user: userId 
    });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    session.sessionName = sessionName.trim();
    await session.save();

    res.json({
      success: true,
      message: "Session renamed successfully",
      session: {
        sessionId: session.sessionId,
        sessionName: session.sessionName
      }
    });

  } catch (error) {
    console.error("Error renaming session:", error);
    res.status(500).json({
      message: "Failed to rename session",
      error: error.message
    });
  }
});

// Add tags to session
router.patch("/session/:sessionId/tags", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { tags } = req.body;
    const userId = req.user?.id;

    if (!Array.isArray(tags)) {
      return res.status(400).json({ message: "Tags must be an array" });
    }

    const session = await ChatBot.findOne({ 
      sessionId: sessionId, 
      user: userId 
    });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    session.tags = tags.filter(tag => tag && tag.trim().length > 0);
    await session.save();

    res.json({
      success: true,
      message: "Tags updated successfully",
      session: {
        sessionId: session.sessionId,
        tags: session.tags
      }
    });

  } catch (error) {
    console.error("Error updating tags:", error);
    res.status(500).json({
      message: "Failed to update tags",
      error: error.message
    });
  }
});

// Rate session satisfaction
router.patch("/session/:sessionId/rate", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { rating } = req.body;
    const userId = req.user?.id;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const session = await ChatBot.findOne({ 
      sessionId: sessionId, 
      user: userId 
    });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    session.satisfactionRating = rating;
    await session.save();

    res.json({
      success: true,
      message: "Rating saved successfully",
      session: {
        sessionId: session.sessionId,
        satisfactionRating: session.satisfactionRating
      }
    });

  } catch (error) {
    console.error("Error rating session:", error);
    res.status(500).json({
      message: "Failed to rate session",
      error: error.message
    });
  }
});

// Generate session summary
router.post("/session/:sessionId/summary", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.id;

    const session = await ChatBot.findOne({ 
      sessionId: sessionId, 
      user: userId 
    });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    await session.generateSummary();

    res.json({
      success: true,
      message: "Summary generated successfully",
      session: {
        sessionId: session.sessionId,
        summary: session.summary,
        keyTopics: session.keyTopics
      }
    });

  } catch (error) {
    console.error("Error generating summary:", error);
    res.status(500).json({
      message: "Failed to generate summary",
      error: error.message
    });
  }
});

// Delete session
router.delete("/session/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.id;

    const session = await ChatBot.findOne({ 
      sessionId: sessionId, 
      user: userId 
    });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    await ChatBot.deleteOne({ sessionId: sessionId, user: userId });

    res.json({
      success: true,
      message: "Session deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting session:", error);
    res.status(500).json({
      message: "Failed to delete session",
      error: error.message
    });
  }
});

// Get chat analytics
router.get("/analytics", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const sessions = await ChatBot.find({ user: userId });
    
    const analytics = {
      totalSessions: sessions.length,
      totalMessages: sessions.reduce((sum, session) => sum + session.totalMessages, 0),
      totalUserMessages: sessions.reduce((sum, session) => sum + session.totalUserMessages, 0),
      totalBotMessages: sessions.reduce((sum, session) => sum + session.totalBotMessages, 0),
      averageSessionLength: sessions.length > 0 ? 
        sessions.reduce((sum, session) => sum + session.totalMessages, 0) / sessions.length : 0,
      mostCommonIntents: {},
      averageSatisfaction: sessions.filter(s => s.satisfactionRating).length > 0 ?
        sessions.filter(s => s.satisfactionRating)
          .reduce((sum, s) => sum + s.satisfactionRating, 0) / 
          sessions.filter(s => s.satisfactionRating).length : null,
      activeSessions: sessions.filter(s => s.isActive).length,
      archivedSessions: sessions.filter(s => s.isArchived).length,
      pinnedSessions: sessions.filter(s => s.isPinned).length
    };

    // Calculate most common intents
    sessions.forEach(session => {
      session.messages.forEach(message => {
        if (message.intent) {
          analytics.mostCommonIntents[message.intent] = 
            (analytics.mostCommonIntents[message.intent] || 0) + 1;
        }
      });
    });

    res.json({
      success: true,
      analytics: analytics
    });

  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({
      message: "Failed to fetch analytics",
      error: error.message
    });
  }
});

module.exports = router;

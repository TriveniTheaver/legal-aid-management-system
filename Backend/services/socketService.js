const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const VerifiedClient = require('../Model/VerifiedClient');
const VerifiedLawyer = require('../Model/VerifiedLawyer');
const Case = require('../Model/CaseModel');

class SocketService {
  constructor(server) {
    this.io = new Server(server, {
      cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    this.connectedUsers = new Map(); // userId -> socket info
    this.activeCalls = new Map(); // callId -> call info
    this.caseRooms = new Map(); // caseId -> users in room
    
    this.setupMiddleware();
    this.setupEventHandlers();
  }

  setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        console.log('🔐 Socket authentication attempt:', {
          hasToken: !!token,
          tokenPreview: token ? token.substring(0, 20) + '...' : 'none',
          socketId: socket.id
        });
        
        if (!token) {
          console.log('❌ No token provided for socket authentication');
          return next(new Error('Authentication failed: No token provided'));
        }

        // Verify JWT token
        const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
        const decoded = jwt.verify(token, jwtSecret);
        console.log('🔍 Token decoded:', {
          id: decoded.id,
          userType: decoded.userType,
          collection: decoded.collection
        });
        
        // Find user in appropriate collection
        let user = await VerifiedClient.findById(decoded.id);
        if (user) {
          socket.userId = user._id.toString();
          socket.userType = 'verified_client';
          socket.userName = user.name || user.fullName;
          console.log('✅ Client authenticated:', user.name || user.fullName);
        } else {
          user = await VerifiedLawyer.findById(decoded.id);
          if (user) {
            socket.userId = user._id.toString();
            socket.userType = 'verified_lawyer';
            socket.userName = user.name || user.fullName;
            console.log('✅ Lawyer authenticated:', user.name || user.fullName);
          } else {
            console.log('❌ User not found in either collection:', decoded.id);
            return next(new Error('Authentication failed: User not found'));
          }
        }
        
        next();
      } catch (error) {
        console.error('❌ Socket authentication error:', error.message);
        next(new Error('Authentication failed'));
      }
    });
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`User connected: ${socket.userName} (${socket.userType}) - ${socket.id}`);
      
      // Store user connection
      this.connectedUsers.set(socket.userId, {
        socketId: socket.id,
        userType: socket.userType,
        userName: socket.userName,
        joinedAt: new Date()
      });

      // Handle lawyer room joining
      socket.on('join-lawyer-room', (lawyerId) => {
        const roomName = `lawyer-${lawyerId}`;
        socket.join(roomName);
        console.log(`🏠 Lawyer ${socket.userName} joined room: ${roomName}`);
      });

      // Handle case room joining for video calls
      socket.on('joinRoom', ({ userId, userName, caseId }) => {
        const roomName = `case-${caseId}`;
        socket.join(roomName);
        
        // Track users in case room
        if (!this.caseRooms.has(caseId)) {
          this.caseRooms.set(caseId, new Set());
        }
        this.caseRooms.get(caseId).add(userId);
        
        console.log(`📹 ${userName} joined video room: ${roomName}`);
      });

      // Video calling events
      socket.on('callUser', ({ userToCall, signalData, from, name, caseId }) => {
        console.log(`📞 Call initiated from ${name} to user ${userToCall} in case ${caseId}`);
        
        // Find the target user's socket
        const targetUser = this.connectedUsers.get(userToCall);
        if (targetUser) {
          this.io.to(targetUser.socketId).emit('callUser', {
            signal: signalData,
            from: from,
            name: name,
            caseId: caseId
          });
          
          // Store active call
          const callId = `${from}-${userToCall}-${Date.now()}`;
          this.activeCalls.set(callId, {
            caller: from,
            callee: userToCall,
            caseId: caseId,
            status: 'calling',
            startTime: new Date()
          });
        } else {
          console.log(`❌ Target user ${userToCall} not found or offline`);
          socket.emit('userOffline', { userToCall });
        }
      });

      socket.on('acceptCall', ({ signal, to }) => {
        console.log(`✅ Call accepted by user, sending signal to ${to}`);
        
        const targetUser = this.connectedUsers.get(to);
        if (targetUser) {
          this.io.to(targetUser.socketId).emit('callAccepted', signal);
          
          // Update call status
          for (let [callId, callInfo] of this.activeCalls.entries()) {
            if (callInfo.caller === to || callInfo.callee === to) {
              callInfo.status = 'active';
              callInfo.acceptTime = new Date();
              break;
            }
          }
        }
      });

      socket.on('rejectCall', ({ to }) => {
        console.log(`❌ Call rejected, notifying ${to}`);
        
        const targetUser = this.connectedUsers.get(to);
        if (targetUser) {
          this.io.to(targetUser.socketId).emit('callRejected');
          
          // Remove call from active calls
          for (let [callId, callInfo] of this.activeCalls.entries()) {
            if (callInfo.caller === to || callInfo.callee === to) {
              this.activeCalls.delete(callId);
              break;
            }
          }
        }
      });

      socket.on('endCall', ({ to }) => {
        console.log(`📞 Call ended, notifying ${to}`);
        
        const targetUser = this.connectedUsers.get(to);
        if (targetUser) {
          this.io.to(targetUser.socketId).emit('callEnded');
        }
        
        // Remove call from active calls
        for (let [callId, callInfo] of this.activeCalls.entries()) {
          if (callInfo.caller === to || callInfo.callee === to || 
              callInfo.caller === socket.userId || callInfo.callee === socket.userId) {
            this.activeCalls.delete(callId);
            break;
          }
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => this.handleDisconnect(socket));
    });
  }


  handleDisconnect(socket) {
    console.log(`User disconnected: ${socket.userName} - ${socket.id}`);
    
    // End any active calls involving this user
    for (let [callId, callInfo] of this.activeCalls.entries()) {
      if (callInfo.caller === socket.userId || callInfo.callee === socket.userId) {
        // Notify the other party that the call ended
        const otherUserId = callInfo.caller === socket.userId ? callInfo.callee : callInfo.caller;
        const otherUser = this.connectedUsers.get(otherUserId);
        if (otherUser) {
          this.io.to(otherUser.socketId).emit('callEnded');
        }
        this.activeCalls.delete(callId);
      }
    }
    
    // Remove user from case rooms
    for (let [caseId, users] of this.caseRooms.entries()) {
      users.delete(socket.userId);
      if (users.size === 0) {
        this.caseRooms.delete(caseId);
      }
    }
    
    // Remove user from connected users
    this.connectedUsers.delete(socket.userId);
  }

  // Utility method to get connected users (for debugging)
  getConnectedUsers() {
    return Array.from(this.connectedUsers.entries()).map(([userId, info]) => ({
      userId,
      ...info
    }));
  }

  // Utility method to get active calls (for debugging)
  getActiveCalls() {
    return Array.from(this.activeCalls.entries()).map(([callId, info]) => ({
      callId,
      ...info
    }));
  }
}

module.exports = SocketService;
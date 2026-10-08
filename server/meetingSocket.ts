/**
 * Dot X Library - Real-Time Multi-User WebSocket Gateway for Virtual Classrooms
 * Handles instant real-time live chat, shared whiteboard synchronization,
 * WebRTC screen-sharing signaling, and attendee presence for all connected meeting participants.
 */
import { WebSocketServer, WebSocket } from 'ws';
import { db, MeetingMessage } from './db.js';

interface ClientSession {
  ws: WebSocket;
  meetingId: string;
  user: {
    id: string;
    name: string;
    role: string;
    avatar?: string;
  };
}

export interface ActiveScreenShare {
  meetingId: string;
  presenter: {
    id: string;
    name: string;
    role: string;
    avatar?: string;
  };
  startedAt: string;
  streamMetadata?: any;
}

// Map of meetingId -> Set of client sessions
const meetingRooms = new Map<string, Set<ClientSession>>();

// Map of meetingId -> Active screen share state
export const activeScreenShares = new Map<string, ActiveScreenShare>();

export function setupMeetingWebSocket(wss: WebSocketServer) {
  wss.on('connection', (ws: WebSocket, req) => {
    let currentSession: ClientSession | null = null;

    ws.on('message', (rawData: string) => {
      try {
        const payload = JSON.parse(rawData.toString());
        const { type, meetingId } = payload;

        if (!meetingId) return;

        // 1. Join Meeting Room
        if (type === 'join') {
          // Remove from previous room if any
          if (currentSession) {
            leaveRoom(currentSession);
          }

          const user = payload.user || {
            id: 'guest_' + Math.random().toString(36).substring(2, 6),
            name: 'Class Attendee',
            role: 'student'
          };

          currentSession = { ws, meetingId, user };

          if (!meetingRooms.has(meetingId)) {
            meetingRooms.set(meetingId, new Set());
          }
          meetingRooms.get(meetingId)!.add(currentSession);

          // Ensure meeting is marked as 'live'
          const meeting = db.meetings.find(m => m.id === meetingId);
          if (meeting) {
            meeting.status = 'live';
          }

          // Send initial state to the connecting client
          const existingMessages = db.meetingMessages.filter(m => m.meetingId === meetingId);
          const currentWhiteboard = db.whiteboardStates[meetingId] || null;
          const isWhiteboardOpen = meeting?.isWhiteboardOpen || false;

          const activeUsers = Array.from(meetingRooms.get(meetingId)!).map(s => s.user);

          ws.send(JSON.stringify({
            type: 'init',
            meetingId,
            messages: existingMessages,
            whiteboardData: currentWhiteboard,
            isWhiteboardOpen,
            activeScreenShare: activeScreenShares.get(meetingId) || null,
            participants: activeUsers,
            meeting
          }));

          // Broadcast to everyone in the room that someone joined
          broadcastToRoom(meetingId, {
            type: 'user_joined',
            user,
            participants: activeUsers,
            count: activeUsers.length
          });
        }

        // 2. Real-Time Chat Message
        else if (type === 'chat') {
          const { text, user } = payload;
          if (!text || !text.trim()) return;

          const now = new Date();
          const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          const newMsg: MeetingMessage = {
            id: 'mm_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
            meetingId,
            senderId: user?.id || currentSession?.user?.id || 'guest',
            senderName: user?.name || currentSession?.user?.name || 'Class Participant',
            senderRole: user?.role || currentSession?.user?.role || 'student',
            text: text.trim(),
            timestamp: timeStr
          };

          // Save to server database
          db.meetingMessages.push(newMsg);

          // Broadcast instantly to all members in the classroom
          broadcastToRoom(meetingId, {
            type: 'chat',
            message: newMsg
          });
        }

        // 3. Collaborative Whiteboard Drawing Sync
        else if (type === 'whiteboard_draw') {
          const { canvasData } = payload;
          if (canvasData) {
            db.whiteboardStates[meetingId] = canvasData;

            // Broadcast canvas update to all members
            broadcastToRoom(meetingId, {
              type: 'whiteboard_draw',
              canvasData,
              senderId: currentSession?.user?.id
            }, ws); // exclude sender to avoid local redraw flicker
          }
        }

        // 4. Whiteboard Open/Toggle Synchronized to Everyone Live
        else if (type === 'whiteboard_toggle') {
          const { isOpen, user } = payload;
          const meeting = db.meetings.find(m => m.id === meetingId);
          if (meeting) {
            meeting.isWhiteboardOpen = Boolean(isOpen);
          }

          // Broadcast to all members so the whiteboard opens and is visible to everyone
          broadcastToRoom(meetingId, {
            type: 'whiteboard_toggle',
            isOpen: Boolean(isOpen),
            openedBy: user?.name || currentSession?.user?.name || 'Meeting Presenter',
            canvasData: db.whiteboardStates[meetingId] || null
          });
        }

        // 5. Whiteboard Clear
        else if (type === 'whiteboard_clear') {
          delete db.whiteboardStates[meetingId];
          broadcastToRoom(meetingId, {
            type: 'whiteboard_clear'
          });
        }

        // 6. User Audio/Video Status Broadcast
        else if (type === 'user_media_update') {
          const { micMuted, videoOff, isSpeaking } = payload;
          broadcastToRoom(meetingId, {
            type: 'user_media_update',
            userId: currentSession?.user?.id,
            micMuted,
            videoOff,
            isSpeaking
          });
        }

        // 7. Screen Sharing Start (Educator presents screen using WebRTC)
        else if (type === 'screen_share_start') {
          const { presenter, streamMetadata } = payload;
          const shareData: ActiveScreenShare = {
            meetingId,
            presenter: presenter || currentSession?.user || { id: 'educator', name: 'Educator', role: 'teacher' },
            startedAt: new Date().toISOString(),
            streamMetadata: streamMetadata || { resolution: '1080p', fps: 60 }
          };
          activeScreenShares.set(meetingId, shareData);

          // Update meeting model
          const meeting = db.meetings.find(m => m.id === meetingId);
          if (meeting) {
            (meeting as any).isScreenSharing = true;
            (meeting as any).screenSharePresenter = shareData.presenter;
          }

          // Broadcast to all participants in the room
          broadcastToRoom(meetingId, {
            type: 'screen_share_start',
            meetingId,
            presenter: shareData.presenter,
            streamMetadata: shareData.streamMetadata
          });
        }

        // 8. Screen Sharing Stop
        else if (type === 'screen_share_stop') {
          activeScreenShares.delete(meetingId);
          const meeting = db.meetings.find(m => m.id === meetingId);
          if (meeting) {
            (meeting as any).isScreenSharing = false;
            (meeting as any).screenSharePresenter = null;
          }

          broadcastToRoom(meetingId, {
            type: 'screen_share_stop',
            meetingId,
            presenterId: payload.presenterId || currentSession?.user?.id
          });
        }

        // 9. WebRTC Signaling: SDP Offer
        else if (type === 'webrtc_offer') {
          const { sdp, targetId, streamType } = payload;
          broadcastToRoom(meetingId, {
            type: 'webrtc_offer',
            meetingId,
            sdp,
            streamType: streamType || 'screen',
            senderId: currentSession?.user?.id,
            targetId
          }, ws);
        }

        // 10. WebRTC Signaling: SDP Answer
        else if (type === 'webrtc_answer') {
          const { sdp, targetId } = payload;
          broadcastToRoom(meetingId, {
            type: 'webrtc_answer',
            meetingId,
            sdp,
            senderId: currentSession?.user?.id,
            targetId
          }, ws);
        }

        // 11. WebRTC Signaling: ICE Candidate
        else if (type === 'webrtc_ice_candidate') {
          const { candidate, targetId } = payload;
          broadcastToRoom(meetingId, {
            type: 'webrtc_ice_candidate',
            meetingId,
            candidate,
            senderId: currentSession?.user?.id,
            targetId
          }, ws);
        }

        // 12. Real-time Screen Frame Sync (WebRTC mirror fallback)
        else if (type === 'screen_frame') {
          const { frameData } = payload;
          if (frameData) {
            broadcastToRoom(meetingId, {
              type: 'screen_frame',
              meetingId,
              frameData,
              senderId: currentSession?.user?.id
            }, ws);
          }
        }
      } catch (err) {
        console.error('WebSocket message handling error:', err);
      }
    });

    ws.on('close', () => {
      if (currentSession) {
        leaveRoom(currentSession);
      }
    });

    ws.on('error', (err) => {
      console.warn('WebSocket connection error:', err);
      if (currentSession) {
        leaveRoom(currentSession);
      }
    });
  });
}

function leaveRoom(session: ClientSession) {
  const room = meetingRooms.get(session.meetingId);
  if (room) {
    room.delete(session);
    const activeUsers = Array.from(room).map(s => s.user);

    // If departing user was presenting their screen, clean up screen share
    const currentShare = activeScreenShares.get(session.meetingId);
    if (currentShare && currentShare.presenter.id === session.user.id) {
      activeScreenShares.delete(session.meetingId);
      const meeting = db.meetings.find(m => m.id === session.meetingId);
      if (meeting) {
        (meeting as any).isScreenSharing = false;
        (meeting as any).screenSharePresenter = null;
      }
      broadcastToRoom(session.meetingId, {
        type: 'screen_share_stop',
        meetingId: session.meetingId,
        presenterId: session.user.id,
        reason: 'presenter_disconnected'
      });
    }

    broadcastToRoom(session.meetingId, {
      type: 'user_left',
      user: session.user,
      participants: activeUsers,
      count: activeUsers.length
    });

    if (room.size === 0) {
      meetingRooms.delete(session.meetingId);
    }
  }
}

function broadcastToRoom(meetingId: string, data: any, excludeWs?: WebSocket) {
  const room = meetingRooms.get(meetingId);
  if (!room) return;

  const payload = JSON.stringify(data);
  for (const client of room) {
    if (client.ws !== excludeWs && client.ws.readyState === WebSocket.OPEN) {
      try {
        client.ws.send(payload);
      } catch (e) {
        console.warn('Failed to send WebSocket payload to client:', e);
      }
    }
  }
}

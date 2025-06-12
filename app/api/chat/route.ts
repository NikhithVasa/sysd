import { anthropic, type AnthropicProviderOptions } from "@ai-sdk/anthropic"
import { streamText } from "ai"

// Allow streaming responses up to 60 seconds for large responses
export const maxDuration = 300

const SYSTEM_PROMPT = `I'll help you design an API for a WhatsApp-like chat system. Let me start by gathering some key requirements and then create a comprehensive design.

## Initial Requirements Gathering

Based on your request for a WhatsApp-like chat system, I'm assuming we need to support:

- Real-time messaging between users
- Group chats
- Message delivery status (sent, delivered, read)
- User presence (online/offline status)
- Media sharing capabilities
- Message history and persistence

Let me create a formal requirements document first:

<Artifact name="requirements_spec" type="text/markdown">
# Chat System API - Requirements Specification

## Executive Summary

We are designing a real-time chat API system similar to WhatsApp that enables users to send messages, create group conversations, share media, and maintain real-time communication with delivery status tracking and presence awareness.

## Customer Profile

**Primary Customers:**
- Mobile application developers building chat features
- Web application developers integrating messaging capabilities
- Enterprise developers creating internal communication tools

**Customer Journey:**
Users will authenticate, discover contacts, create conversations (1:1 or group), send/receive messages in real-time, share media, and track message delivery status while maintaining awareness of other users' online presence.

## Functional Requirements

### Core Messaging Features
- **Real-time Message Exchange**: Users can send and receive text messages instantly
- **Message Delivery Tracking**: Track message status (sent, delivered, read)
- **Group Conversations**: Support for multi-user group chats with admin controls
- **Message History**: Persistent storage and retrieval of conversation history
- **Media Sharing**: Support for images, videos, documents, and voice messages
- **User Presence**: Real-time online/offline status and last seen information

### User Management
- **User Authentication**: Secure user registration and login
- **Contact Management**: Add, remove, and manage user contacts
- **Profile Management**: User profile information and settings
- **Privacy Controls**: Message encryption and privacy settings

### Conversation Management
- **Conversation Creation**: Create 1:1 and group conversations
- **Member Management**: Add/remove participants in group chats
- **Conversation Settings**: Mute, archive, and delete conversations
- **Admin Controls**: Group admin privileges and moderation

## Non-Functional Requirements

### Scale Requirements
- **Concurrent Users**: Support 10M+ concurrent users
- **Message Throughput**: Handle 100K+ messages per second
- **Storage**: Efficiently store billions of messages
- **Global Distribution**: Low latency worldwide

### Performance Requirements
- **Message Latency**: <100ms for message delivery
- **API Response Time**: <200ms for REST endpoints
- **Uptime**: 99.99% availability
- **Real-time Connection**: WebSocket/Server-Sent Events support

### Security Requirements
- **End-to-End Encryption**: Secure message content
- **Authentication**: JWT-based secure authentication
- **Rate Limiting**: Prevent spam and abuse
- **Data Privacy**: GDPR and privacy compliance

### Technical Constraints
- **AWS Infrastructure**: Must use AWS services
- **Java Backend**: Java-based microservices
- **No Google Products**: Cannot use Google technologies
- **High Throughput Database**: No RDBMS for high-throughput operations

## Dependencies and Integrations

### External Dependencies
- **Push Notification Service**: AWS SNS for mobile notifications
- **Media Storage**: AWS S3 for file storage
- **CDN**: AWS CloudFront for media delivery
- **Identity Provider**: AWS Cognito for user management

### Internal Dependencies
- **User Service**: User profile and authentication management
- **Notification Service**: Push notification delivery
- **Media Service**: File upload and processing
- **Analytics Service**: Usage tracking and metrics

## Success Metrics

### Business Metrics
- **User Engagement**: Daily/Monthly active users
- **Message Volume**: Messages sent per user per day
- **Retention Rate**: User retention over 30/90 days
- **Feature Adoption**: Usage of advanced features (groups, media)

### Technical Metrics
- **System Performance**: API response times and throughput
- **Reliability**: System uptime and error rates
- **Scalability**: Ability to handle traffic spikes
- **Security**: Zero security incidents and data breaches

## Out of Scope (Phase 1)
- Voice/Video calling
- Story/Status features
- Advanced bot integration
- Payment/commerce features
- Desktop application support
</Artifact>

Now let me brainstorm high-level ideas for implementing this chat system:

## Requirements Summary

**Customer**: Mobile and web application developers building chat features  
**Key Requirements**:
- Real-time messaging with delivery tracking
- Group chat capabilities
- Media sharing and storage
- User presence and contact management
- Global scale (10M+ concurrent users, 100K+ msgs/sec)
- Sub-100ms message latency with 99.99% uptime

**Why**: Modern applications require embedded real-time communication capabilities that are reliable, scalable, and feature-rich like consumer messaging apps.
`

export async function POST(req: Request) {
  const { messages } = await req.json()

  const modifiedMessages = messages.map((msg: any, index: number) => {
    if (msg.role === "user" && index === messages.length - 1) {
      return {
        ...msg,
        content: msg.content.trim() + " Do not ask any questions.",
      }
    }
    return msg
  })

  const result = streamText({
    model: "anthropic/claude-4-sonnet-20250514",
    messages: modifiedMessages,
    system: SYSTEM_PROMPT,
    maxTokens: 8192,
    temperature: 0.7,
    providerOptions: {
      anthropic: {
        thinking: { type: "enabled", budgetTokens: 15000 },
      } satisfies AnthropicProviderOptions,
    },
    headers: {
      "anthropic-beta": "interleaved-thinking-2025-05-14",
    },
  })

  return result.toDataStreamResponse({
    sendReasoning: true,
  })
}

# Voice Transcription Feature

## Overview

This implementation adds voice transcription capabilities to FlowMate using OpenAI's Whisper API, with Flow wallet authentication to ensure only connected users can access the feature.

## Features

✅ **Voice Recording** - Record audio directly from the browser  
✅ **Real-time Transcription** - Convert speech to text using OpenAI Whisper  
✅ **Wallet Authentication** - Only authenticated Flow wallet users can transcribe  
✅ **Signature Verification** - Optional Flow signature verification for enhanced security  
✅ **Visual Feedback** - Recording status, timer, and loading states  
✅ **Seamless UX** - Auto-fills input field with transcribed text  

## How It Works

### 1. User Flow
1. User connects their Flow wallet
2. Clicks the microphone button to start recording
3. Speaks their message (recording timer shows elapsed time)
4. Clicks stop button to end recording
5. Audio is sent to server for transcription
6. Transcribed text appears in the input field
7. User can edit or send the message

### 2. Technical Architecture

#### Frontend Components

**`useAudioRecorder` Hook** (`src/hooks/useAudioRecorder.ts`)
- Manages MediaRecorder API
- Handles recording states (recording, paused, stopped)
- Tracks recording time
- Returns audio blob for upload

**MainPageInput Component** (`src/components/MainPageInput.tsx`)
- Integrates voice recording UI
- Shows different icons based on state:
  - 🎤 Mic icon - Ready to record
  - ⏹️ Stop icon (red) - Recording in progress
  - 📤 Send icon - Text ready to send
  - ⏳ Spinner - Transcribing
- Dynamic tooltips for each state
- Visual feedback (red border while recording)

#### Backend API

**Transcription Route** (`src/app/api/transcribe/route.ts`)
- Validates Flow wallet address format
- Optional signature verification using `fcl.AppUtils.verifyUserSignatures`
- Processes audio file (webm format)
- Sends to OpenAI Whisper API
- Returns transcribed text

### 3. Security Features

#### Wallet Authentication
```typescript
// Validates Flow address format
if (!walletAddress || !isValidFlowAddress(walletAddress)) {
  return error 401
}
```

#### Signature Verification (Optional)
```typescript
// In MainPageInput.tsx - uncomment to enable
const message = `Transcribe audio for ${user.addr} at ${Date.now()}`
const signatures = await user.signUserMessage(message)
formData.append('message', message)
formData.append('compositeSignatures', JSON.stringify(signatures))

// Server-side verification
const isValid = await fcl.AppUtils.verifyUserSignatures(message, signatures)
```

## Setup Instructions

### 1. Environment Variables

Create a `.env.local` file:

```env
OPENAI_API_KEY=your_openai_api_key_here
NEXT_PUBLIC_FLOW_NETWORK=mainnet
NEXT_PUBLIC_APP_DETAIL_URL=http://localhost:3000
```

**Get your OpenAI API Key:**
1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Create a new API key
4. Copy and paste into `.env.local`

### 2. Install Dependencies

All required dependencies are already included:
- `openai` - OpenAI API client
- `@onflow/fcl` - Flow Client Library
- `lucide-react` - Icons

### 3. Browser Permissions

Users will need to grant microphone access when first using voice input.

## API Reference

### POST `/api/transcribe`

**Request (FormData):**
```typescript
{
  audio: Blob,                    // Audio file (webm format)
  walletAddress: string,          // Flow wallet address
  compositeSignatures?: string,   // Optional: JSON stringified signatures
  message?: string                // Optional: Message that was signed
}
```

**Response:**
```typescript
{
  success: true,
  text: string,                   // Transcribed text
  walletAddress: string
}
```

**Error Responses:**
- `400` - No audio file or invalid signature format
- `401` - No wallet connected or invalid wallet address
- `403` - Invalid wallet signature
- `500` - Transcription failed

## Component States

| State | Icon | Input State | Button Variant | Tooltip |
|-------|------|-------------|----------------|---------|
| Idle | Mic | Editable | Secondary | "Start voice input" |
| Recording | Red Stop Circle | Disabled (shows timer) | Default | "Stop recording (Xs)" |
| Transcribing | Spinning Loader | Disabled | Secondary (disabled) | "Transcribing..." |
| Text Ready | Send | Editable | Default | "Send message" |

## Audio Configuration

```typescript
{
  echoCancellation: true,
  noiseSuppression: true,
  sampleRate: 44100,
  mimeType: 'audio/webm'
}
```

## Future Enhancements

- [ ] Support for multiple audio formats (mp3, wav)
- [ ] Audio playback before sending
- [ ] Multilingual transcription
- [ ] Custom Whisper model selection
- [ ] Transcription history
- [ ] Real-time streaming transcription
- [ ] Voice activity detection (auto-stop on silence)

## Troubleshooting

### Microphone Access Denied
- Check browser permissions
- Ensure HTTPS (required for microphone access in production)

### Transcription Fails
- Verify OpenAI API key is correct
- Check API quota/credits
- Ensure audio is clear and audible

### Wallet Not Connected
- Users must connect Flow wallet first
- Check network configuration

## Cost Considerations

OpenAI Whisper API pricing (as of 2024):
- $0.006 per minute of audio
- No minimum charges
- Pay only for what you use

**Example:** 100 users × 2 minutes/day × 30 days = 6,000 minutes = ~$36/month

## Files Modified/Created

### Created:
- `src/app/api/transcribe/route.ts` - API endpoint
- `src/hooks/useAudioRecorder.ts` - Recording hook
- `.env.example` - Environment template
- `VOICE_TRANSCRIPTION.md` - This documentation

### Modified:
- `src/components/MainPageInput.tsx` - Added voice UI
- `README.md` - Added setup instructions

## Credits

- **OpenAI Whisper** - Speech-to-text transcription
- **Flow Blockchain** - Wallet authentication
- **MediaRecorder API** - Browser audio recording


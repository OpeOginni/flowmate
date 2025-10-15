import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import * as fcl from '@onflow/fcl';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Validate Flow wallet address format
function isValidFlowAddress(address: string): boolean {
  // Flow addresses are 16 characters hex (with or without 0x prefix)
  const flowAddressRegex = /^(0x)?[a-fA-F0-9]{16}$/;
  return flowAddressRegex.test(address);
}


export async function POST(request: NextRequest) {
  try {
    // Get the form data containing the audio file and auth info
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const walletAddress = formData.get('walletAddress') as string;
    const compositeSignatures = formData.get('compositeSignatures') as string;
    const message = formData.get('message') as string;

    // Validate required fields
    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Verify user has a connected wallet
    if (!walletAddress || !isValidFlowAddress(walletAddress)) {
      return NextResponse.json(
        { error: 'Valid Flow wallet connection required. Please connect your wallet.' },
        { status: 401 }
      );
    }

    // Convert the File to a buffer that OpenAI can process
    const bytes = await audioFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create a temporary file-like object for OpenAI
    const file = new File([buffer], audioFile.name, { type: audioFile.type });

    // Transcribe the audio using OpenAI Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      response_format: 'text',
    });

    return NextResponse.json({
      success: true,
      text: transcription,
      walletAddress,
    });

  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      { error: 'Failed to transcribe audio', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}



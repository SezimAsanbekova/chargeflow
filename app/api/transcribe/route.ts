import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File;

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    // Проверяем размер файла
    if (audioFile.size === 0) {
      return NextResponse.json({ error: "Audio file is empty" }, { status: 400 });
    }

    // Проверяем тип файла
    console.log("Received audio file:", {
      name: audioFile.name,
      type: audioFile.type,
      size: audioFile.size
    });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    // Получаем расширение из имени файла
    const fileExtension = audioFile.name.split('.').pop()?.toLowerCase() || 'webm';
    
    // Проверяем, что расширение поддерживается OpenAI
    const supportedFormats = ['flac', 'm4a', 'mp3', 'mp4', 'mpeg', 'mpga', 'oga', 'ogg', 'wav', 'webm'];
    
    if (!supportedFormats.includes(fileExtension)) {
      console.error("Unsupported format:", fileExtension);
      return NextResponse.json({ 
        error: `Unsupported format: ${fileExtension}. Supported: ${supportedFormats.join(', ')}` 
      }, { status: 400 });
    }

    // Создаём правильное имя файла
    const fileName = `audio.${fileExtension}`;
    
    console.log("Sending to OpenAI:", {
      fileName,
      fileExtension,
      size: audioFile.size
    });

    // Создаём FormData для отправки в OpenAI
    const openaiFormData = new FormData();
    
    // Создаем новый Blob с правильным MIME типом
    const audioBuffer = await audioFile.arrayBuffer();
    const audioBlob = new Blob([audioBuffer], { type: audioFile.type });
    
    openaiFormData.append("file", audioBlob, fileName);
    openaiFormData.append("model", "whisper-1");
    openaiFormData.append("language", "ru");

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: openaiFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Whisper API error:", {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      
      let errorMessage = "Transcription error";
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error?.message || errorMessage;
      } catch (e) {
        errorMessage = errorText || errorMessage;
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          details: errorText,
          status: response.status 
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("Transcription successful, text length:", data.text?.length || 0);
    return NextResponse.json({ text: data.text });
  } catch (error: any) {
    console.error("Transcription error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}

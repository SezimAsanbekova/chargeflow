import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";

export async function POST(req: NextRequest) {
  try {
    // Платный OpenAI-эндпоинт — только для авторизованных пользователей.
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messages, userLocation } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages" }, { status: 400 });
    }

    // Ограничение объёма ввода, чтобы исключить злоупотребление токенами.
    if (messages.length > 30) {
      return NextResponse.json({ error: "Too many messages" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    // Получаем контекст о станциях из БД
    let stationsContext = "";
    try {
      const contextRes = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/ai-context`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userLocation }),
        }
      );

      if (contextRes.ok) {
        const contextData = await contextRes.json();
        
        // Формируем текстовое описание станций для AI
        stationsContext = `\n\nАКТУАЛЬНЫЕ ДАННЫЕ О СТАНЦИЯХ ChargeFlow:\n`;
        stationsContext += `Всего станций: ${contextData.totalStations}\n`;
        stationsContext += `Доступных станций: ${contextData.availableStations}\n`;
        
        if (contextData.userLocation) {
          stationsContext += `\nМестоположение пользователя: ${contextData.userLocation.latitude}, ${contextData.userLocation.longitude}\n`;
          stationsContext += `Станции отсортированы по расстоянию от пользователя (ближайшие первые):\n\n`;
        } else {
          stationsContext += `\n`;
        }

        contextData.stations.forEach((station: any, index: number) => {
          stationsContext += `${index + 1}. ${station.name}\n`;
          stationsContext += `   Адрес: ${station.address}\n`;
          if (station.distance) {
            stationsContext += `   Расстояние: ${station.distance} км\n`;
          }
          stationsContext += `   Коннекторов: ${station.availableConnectors}/${station.totalConnectors} доступно\n`;
          
          station.connectors.forEach((conn: any) => {
            const statusText = conn.status === "available" ? "✅ Свободен" : 
                             conn.status === "busy" ? "🔴 Занят" : "🔧 На обслуживании";
            stationsContext += `   - ${conn.type}: ${conn.powerKw} кВт, ${conn.pricePerKwh} сом/кВт⋅ч - ${statusText}\n`;
            
            if (conn.status === "busy" && conn.availableAt) {
              const availableTime = new Date(conn.availableAt).toLocaleString("ru-RU");
              stationsContext += `     Освободится: ${availableTime}\n`;
            }
          });
          stationsContext += `\n`;
        });
      }
    } catch (error) {
      console.error("Failed to fetch stations context:", error);
    }

    // Используем gpt-4o для более качественных ответов
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `Ты — умный ИИ-ассистент приложения ChargeFlow для зарядки электромобилей. 

ВАЖНО: Используй ТОЛЬКО данные из раздела "АКТУАЛЬНЫЕ ДАННЫЕ О СТАНЦИЯХ" ниже. Не придумывай станции, адреса или цены!

ЯЗЫКОВОЕ ПРАВИЛО: Отвечай на том же языке, на котором пользователь задал вопрос:
- Если вопрос на русском → отвечай на русском
- Если вопрос на кыргызском → отвечай на кыргызском  
- Если вопрос на английском → отвечай на английском
Определяй язык по последнему сообщению пользователя.

Твои задачи:
1. Отвечать на вопросы о зарядных станциях ChargeFlow
2. Показывать ТОЛЬКО реальные станции из базы данных
3. Указывать статус коннекторов (свободен/занят)
4. Если станция занята - сообщать время освобождения
5. Если пользователь указал адрес - показывать ближайшие станции
6. Объяснять типы зарядки (CCS2, CHAdeMO, Type2, GB/T)
7. Помогать с бронированием

Отвечай кратко, дружелюбно и по делу.

${stationsContext}`,
          },
          ...messages,
        ],
        max_tokens: 800,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI error:", response.status, errorText);
      return NextResponse.json(
        { error: "AI service error" },
        { status: 502 }
      );
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content ?? "Не удалось получить ответ.";

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error("AI chat error:", error?.message ?? error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

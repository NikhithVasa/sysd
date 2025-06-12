import { streamText } from "ai"

export const maxDuration = 300

const SYSTEM_PROMPT = `Hi`
export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log("Incoming request body:", body)

    const { messages } = body
    if (!messages || !Array.isArray(messages)) {
      console.error("Invalid messages format")
      return new Response(JSON.stringify({ error: "Invalid messages format" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }
    const transformedMessages = messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content?.trim() || msg.parts?.[0]?.text?.trim() || "",
    }))

    console.log("Transformed Messages:", transformedMessages)

    if (transformedMessages.length > 0) {
      const lastMessage = transformedMessages[transformedMessages.length - 1]
      if (lastMessage.role === "user") {
        lastMessage.content += " Do not ask any questions."
      }
    }

    const result = streamText({
      model: "claude-3-5-sonnet-20240620",
      messages: transformedMessages,
      system: SYSTEM_PROMPT,
      maxTokens: 8192,
      temperature: 0.7,
    })

    return result.toDataStreamResponse()

  } catch (error) {
    console.error("API Error:", error)
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

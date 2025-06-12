import axios from "axios"

export const maxDuration = 60

const SYSTEM_PROMPT = `You are a highly experienced software architect with over 10 years of experience designing complex software systems at Amazon. Your expertise spans multiple domains including distributed systems, cloud architecture, API design, database modeling, and enterprise application development.

As a PROFESSIONAL SOFTWARE ARCHITECT, your goal is to:

- Identify key technical constraints and non-functional requirements
- Create appropriate requirement and design artifacts that completely address the user's needs
- Explain architectural decisions clearly with rationales
- Guide users through the software design process step-by-step

**IMPORTANT GUIDELINES:**

- You MUST document requirements thoroughly before proceeding to design
- Use a technical narrative form for the written artifacts. Work from the customer backwards for designs.
- When appropriate, suggest artifact generation to document requirements and designs
- Always keep the requirements spec artifact up-to-date based on user inputs.
- Be specific and detailed in your recommendations and design choices
- After each artifact creation and update, suggest next steps.

**INITIAL INFORMATION GATHERING:**
When starting a new design conversation, you should guide users to share critical information about their project.
Ask users about these key areas:

**DESIGN NOTES:**

- Use software architecture best practices and patterns when appropriate
- Consider security, scalability, and maintainability in all designs
- Prefer AWS technologies when appropriate. We cannot use Google products.
- For high-throughput systems or in customer journey, we cannot use RDBMS.
- Amazon has a Read-only Database (RODB) library, similar to BDB, that can be used for mostly static in-memory datasets for simple key-value lookups only.
- Prefer updating existing artifacts instead of creating new ones.
- Especially if user asks to revise or amend a doc, try to revise the existing ones.

**INTERACTION FLOW:**

1. Start by gathering project requirements, current architecture details and key dependencies.
2. If the user provides a knowledge base tool, use it to get more context from it.
3. Clarify requirements through targeted questions
4. Create a formal requirements document (Requirements artifact)

**Based on requirements, suggest and generate appropriate design artifacts**
Explain each artifact's purpose and content clearly
**Artifact Size Limits:**
The artifact tools can only handle about 3000 words for a document and about 300 lines of code per artifact.
If we need more content, we need to break down the problem and create multiple artifacts.

**[PROJECT GUIDANCE]**
Based on the current project context, follow these guidelines:
(If this is a new conversation (no previous messages):)

- Start gathering high-level requirements with open-ended questions
- Use Knowledge base tool (if available) to glean surrounding context.
- Focus on understanding the user's needs before suggesting artifacts

If brainstorming exists but no high level design document:

- Guide the design phase based on requirements
- Suggest creating appropriate design artifacts
- Start with high-level design before detailed components
- For diagrams, use mermaid unless instructed otherwise
- For API specifications, use Smithy unless instructed otherwise
- For backend code, use Java and TypeScript/React for frontend unless instructed otherwise

If high level document exists:

- Focus on refining existing designs
- Review user feedback and suggest improvements
- Be specific about what changes would improve the design
- Guide the user on next steps

After each artifact generation, guide the user on what to do next. Either suggest generating another artifact or ask if they want changes to existing ones.

**Brainstorming Prompt Template:**
**[IDEA_HONING_PROMPT]**
After producing a requirements spec, first briefly list requirements. Who is the customer?
What are the key requirements? Why? Use narrative form for these sections.
Then, generate a list of high-level ideas for the project.

- If this involves system design, think what may be the major components involved? You can use a mermaid diagram to show them interacting.

Focus on simplicity, reliability, scalability and use the best fit tool.

**High-level Design Prompt Template:**
**[HLD_PROMPT]**
Based on the provided project requirements, generate a comprehensive design document including suggested tech stack, main features, and high-level architecture.

You are Pippin, an expert technical architect at Amazon.
You need to create a comprehensive technical design document.
Follow these steps:

First, analyze the context:

- What is the business problem being solved?
- Who are the key stakeholders?
- What are the system's scale requirements?
- What are the technical constraints?

Then, structure your document following this chain of thought:

---

**Step 1: Executive Summary**
_Think about:_ What would a busy executive need to know in 2 minutes?
_Output:_ Write a concise summary covering problem, solution, and impact

---

**Step 2: Strategic Context**
_Think about:_ What are the current pain points and limitations?
_Output:_ Document the strategic rationale and business drivers

---

**Step 3: Technical Architecture**
_Think about:_ What are the key architectural components? How will they interact? What are the scalability considerations?
_Output:_ Explain each key architectural component and how they interact.

---

**Step 4: Operational Considerations**
_Think about:_ How will this run in production? What are the SLAs and monitoring needs?
_Output:_ Detail the operational requirements and support model

---

**Step 5: Success Metrics**

Think about: How will success be measured? What are the key KPIs?
Output: Define clear success criteria

For each section:

- Consider scale implications for millions/billions of users (if applicable).
- Address security and privacy concerns
- Consider global deployment requirements
- Include data to support decisions
- Think about cost implications.

Now, based on the above analysis, write a detailed technical design document
that would pass senior staff level review at Amazon.

You should prefer narrative style paragraphs but succinct and be humble. Remove any effort estimates.

**Component Diagram Prompt Template:**
Create a component diagram for the project.

Please generate a component diagram in text format that shows:

- Major system components
- Interfaces between components
- External systems and their interactions
- Key data flows

Use mermaid diagram syntax to represent the component diagram clearly.

**Sequence Diagram Prompt Template:**
Please generate sequence diagrams in mermaid format that shows:

How objects interact with each other
The sequence of events leading to a specific outcome
Key data flows and their timing

Use mermaid diagram syntax to represent the sequence diagram clearly.

API Specification Prompt Template:
Write an API specification for the service(s) for this project.
Use the "Smithy" format for API Spec unless otherwise requested.

Explain the rationale behind the decisions.`

export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log("Incoming request body:", JSON.stringify(body, null, 2))

    const { messages } = body
    if (!messages || !Array.isArray(messages)) {
      console.error("Invalid messages format")
      return new Response(JSON.stringify({ error: "Invalid messages format" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Transform messages to Anthropic format
    const transformedMessages = messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content?.trim() || msg.parts?.[0]?.text?.trim() || "",
    }))

    console.log("Transformed Messages:", JSON.stringify(transformedMessages, null, 2))

    // Add instruction to not ask questions
    if (transformedMessages.length > 0) {
      const lastMessage = transformedMessages[transformedMessages.length - 1]
      if (lastMessage.role === "user") {
        lastMessage.content += " Do not ask any questions."
      }
    }

    // Check for API key
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      console.error("Missing ANTHROPIC_API_KEY")
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Prepare Anthropic API request
    const anthropicRequest = {
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 8192,
      temperature: 0.7,
      system: SYSTEM_PROMPT,
      messages: transformedMessages,
      stream: true,
    }

    console.log("Anthropic request:", JSON.stringify(anthropicRequest, null, 2))

    // Create streaming response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = await axios({
            method: "POST",
            url: "https://api.anthropic.com/v1/messages",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": apiKey,
              "anthropic-version": "2023-06-01",
            },
            data: anthropicRequest,
            responseType: "stream",
            timeout: 60000,
          })

          response.data.on("data", (chunk: Buffer) => {
            const lines = chunk.toString().split("\n")

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6).trim()

                if (data === "[DONE]") {
                  controller.enqueue(encoder.encode("data: [DONE]\n\n"))
                  controller.close()
                  return
                }

                try {
                  const parsed = JSON.parse(data)

                  if (parsed.type === "content_block_delta" && parsed.delta?.text) {
                    // Format as AI SDK compatible stream
                    const streamData = {
                      type: "text-delta",
                      textDelta: parsed.delta.text,
                    }
                    controller.enqueue(encoder.encode(`0:${JSON.stringify(streamData)}\n`))
                  } else if (parsed.type === "message_stop") {
                    controller.enqueue(encoder.encode("data: [DONE]\n\n"))
                    controller.close()
                    return
                  }
                } catch (parseError) {
                  console.error("Error parsing stream data:", parseError)
                }
              }
            }
          })

          response.data.on("end", () => {
            controller.enqueue(encoder.encode("data: [DONE]\n\n"))
            controller.close()
          })

          response.data.on("error", (error: any) => {
            console.error("Stream error:", error)
            controller.error(error)
          })
        } catch (error) {
          console.error("Anthropic API error:", error)

          if (axios.isAxiosError(error)) {
            console.error("Response status:", error.response?.status)
            console.error("Response data:", error.response?.data)

            const errorMessage = error.response?.data?.error?.message || error.message || "Unknown error"
            controller.enqueue(
              encoder.encode(
                `0:${JSON.stringify({
                  type: "error",
                  error: errorMessage,
                })}\n`,
              ),
            )
          } else {
            controller.enqueue(
              encoder.encode(
                `0:${JSON.stringify({
                  type: "error",
                  error: "Internal server error",
                })}\n`,
              ),
            )
          }

          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    console.error("Route error:", error)
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}

export async function POST(request: Request) {
  const apiKey = process.env.NEXT_PUBLIC_MISTRAL_API_KEY; // Changed from NEXT_PUBLIC_
  const url = "https://api.mistral.ai/v1/chat/completions";

  try {
    // Parse the incoming request body to get the user's message
    const requestData = await request.json();
    const userMessage = requestData.message || "Hello"; // Default message if none provided

    const requestBody = {
      model: "mistral-small-latest",
      messages: [
        {
          role: "user",
          content: userMessage
        }
      ],
      temperature: 1.0,
      top_p: 1,
      max_tokens: 100,
      stream: true,
      safe_prompt: false
    };

    if (!apiKey) {
      throw new Error("API key is missing from environment variables");
    }

    // If stream is true, we need to handle the response differently
    if (requestBody.stream) {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      // Simply forward the streaming response to the client
      return new Response(response.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      });
    } else {
      // For non-streaming responses
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Mistral API error:", errorData);
        return new Response(JSON.stringify({ error: errorData }), {
          status: response.status,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const data = await response.json();
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error: any) {
    console.error("Error with Mistral API request:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
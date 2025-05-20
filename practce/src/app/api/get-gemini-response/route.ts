/* eslint-disable */
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
      console.error("API key is missing from environment variables");
      throw new Error("API key is missing from environment variables");
    }

    // Debugging: Log the API key (only for local debugging, remove in production)
    console.log("Using API Key:", apiKey);

    // If stream is true, we need to handle the response differently
    if (requestBody.stream) {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}` // Ensure this is correctly set
        },
        body: JSON.stringify(requestBody)
      });

      // Debugging: Log response status for 401 errors
      if (response.status === 401) {
        console.error("Unauthorized: Check API key or permissions");
        const errorDetails = await response.text();
        console.error("Response body:", errorDetails);
      }

      // Clone the response to avoid locking the body
      const clonedResponse = response.clone();

      // Simply forward the streaming response to the client
      return new Response(clonedResponse.body, {
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
          'Authorization': `Bearer ${apiKey}` // Ensure this is correctly set
        },
        body: JSON.stringify(requestBody)
      });

      // Debugging: Log response status for 401 errors
      if (response.status === 401) {
        console.error("Unauthorized: Check API key or permissions");
        const errorDetails = await response.text();
        console.error("Response body:", errorDetails);
      }

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Mistral API error:", errorData);
        return new Response(JSON.stringify({ error: errorData }), {
          status: response.status,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Clone the response to avoid locking the body
      const clonedResponse = response.clone();
      const data = await clonedResponse.json();

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
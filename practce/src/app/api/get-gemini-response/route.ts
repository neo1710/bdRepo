/* eslint-disable */
export async function POST(request: Request) {
  const mistralApiKey = process.env.NEXT_PUBLIC_MISTRAL_API_KEY;
  const groqApiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;
  const mistralUrl = "https://api.mistral.ai/v1/chat/completions";
  const groqUrl = "https://api.groq.com/openai/v1/chat/completions"; // Correct Groq endpoint

  try {
    // Parse the incoming request body
    const requestData = await request.json();
    const userMessage = requestData.message || "Hello";
    const useGroq = requestData.groq === true;

    // Select API key and URL
    const apiKey = useGroq ? groqApiKey : mistralApiKey;
    const url = useGroq ? groqUrl : mistralUrl;

    // Configure request body
    const requestBody = {
      model: useGroq ? "llama3-8b-8192" : "mistral-small-latest", // Groq free tier model
      messages: [
        {
          role: "user",
          content: userMessage
        }
      ],
      temperature: 1.0,
      top_p: 1.0,
      max_tokens: 100, // Ensure within Groq's limit for llama3-8b-8192
      stream: true
    };

    if (!apiKey) {
      console.error(`${useGroq ? 'Groq' : 'Mistral'} API key is missing from environment variables`);
      throw new Error(`${useGroq ? 'Groq' : 'Mistral'} API key is missing`);
    }

    // Debugging: Log request details
    console.log(`Requesting ${useGroq ? 'Groq' : 'Mistral'} API at ${url}`);
    console.log("Request Body:", JSON.stringify(requestBody, null, 2));

    // Make the API request
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    // Check for HTTP errors
    if (!response.ok) {
      const errorDetails = await response.text();
      console.error(`HTTP Error ${response.status}:`, errorDetails);
      throw new Error(`HTTP ${response.status}: ${errorDetails}`);
    }

    // Handle streaming response
    if (requestBody.stream) {
      return new Response(response.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      });
    } else {
      // For non-streaming responses
      const data = await response.json();
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error: any) {
    console.error(`Error with API request:`, error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
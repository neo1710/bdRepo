/* eslint-disable */
import { sonarFirstAgent } from "./sonarFirstAgent";

export async function POST(request: Request) {
  const mistralApiKey = process.env.NEXT_PUBLIC_MISTRAL_API_KEY;
  const groqApiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;
  const perplexityApiKey = process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY;
  const mistralUrl = "https://api.mistral.ai/v1/chat/completions";
  const groqUrl = "https://api.groq.com/openai/v1/chat/completions"; // Correct Groq endpoint
  const perplexityUrl = "https://api.perplexity.ai/chat/completions";

  try {
    // Parse the incoming request body
    const requestData = await request.json();
    const userMessage = requestData.message || "Hello";
    const model = requestData.model || "sonar";
    const conversationHistory = requestData.conversationHistory || [];

    // Use sonarFirstAgent for sonar model to check if tools are needed
    let finalUserMessage = userMessage;
    if (model === "sonar") {
      const agentResponse = await sonarFirstAgent(userMessage);

      // If agent response contains tool information, prepare it for final API call
      if (typeof agentResponse === 'string' && agentResponse.includes('tool_response')) {
        finalUserMessage = agentResponse;
      }
    }

    // Select API key and URL based on model
    let apiKey, url, modelName;
    switch (model) {
      case "groq":
        apiKey = groqApiKey;
        url = groqUrl;
        modelName = "llama3-8b-8192";
        break;
      case "sonar":
        apiKey = perplexityApiKey;
        url = perplexityUrl;
        modelName = "sonar-pro";
        break;
      default:
        apiKey = mistralApiKey;
        url = mistralUrl;
        modelName = "mistral-small-latest";
    }

    // Configure request body based on model
    let requestBody;
    if (model === "sonar") {
      requestBody = {
        model: modelName,
        messages: [
          {
            role: "system",
            content: `you are a helpfull friendly assistant that answers user query and treats him like a friend.

            instructions:
            1. keep your answers short and concise
            2. if there is a tool response use it in the answer or just provide a nice stuctured answered with the agent response you will get.
            3. always provide answer in english or hinglish
            4. if the tool response is just a string use it and answer user query with that when there will be tool response the user query will also be there it will be in json format like this->
            {
              "tool_response": "tool response will be here",
              "user_query": "user query will be here"
            } 
            
            thats all now just work on providing the best answer to user. And alway highlight the tool response. use the tool response if any to create a nice answer for user.
            `
          },
          ...conversationHistory,
          {
            role: "user",
            content: finalUserMessage
          }
        ],
        stream: true
      };
    } else {
      requestBody = {
        model: modelName,
        messages: [
          ...conversationHistory,
          { role: "user", content: userMessage }
        ],
        temperature: 1.0,
        top_p: 1.0,
        max_tokens: 100,
        stream: true
      };
    }

    if (!apiKey) {
      console.error(`API key is missing for ${model} model`);
      throw new Error(`API key is missing for ${model} model`);
    }

    // Debugging: Log request details
    console.log(`Requesting ${model} API at ${url}`);
    console.log("Request Body:", JSON.stringify(requestBody, null, 2));

    // Make the API request with correct headers per model
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };

    // Add specific headers for Mistral
    if (model === "default") {
      headers['Accept'] = 'application/json';
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
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
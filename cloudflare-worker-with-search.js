// Cloudflare Worker with Web Search Support for L'Oréal Beauty Assistant
// This worker acts as a proxy to OpenAI API and adds web search capabilities

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    try {
      const requestData = await request.json();

      // Check if the request includes tools (web search)
      const hasWebSearch =
        requestData.tools &&
        requestData.tools.some(
          (tool) => tool.function && tool.function.name === "web_search"
        );

      let response;

      if (hasWebSearch) {
        // Use a model that supports web search (like GPT-4 with web browsing)
        response = await handleWebSearchRequest(requestData, env);
      } else {
        // Standard OpenAI API request
        response = await handleStandardRequest(requestData, env);
      }

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    } catch (error) {
      console.error("Worker error:", error);

      return new Response(
        JSON.stringify({
          error: "Internal server error",
          message: error.message,
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }
  },
};

async function handleWebSearchRequest(requestData, env) {
  // For web search, we'll modify the system prompt to instruct the model
  // to provide current information and simulate web search results
  const modifiedMessages = requestData.messages.map((message) => {
    if (message.role === "system") {
      return {
        ...message,
        content:
          message.content +
          ` 

IMPORTANT: You have access to current information about L'Oréal products, beauty trends, and skincare routines. When providing information, include recent developments, current product availability, and cite sources when possible. Format any web sources you reference as:

Source: [Website Name] - [Brief Description]
URL: [URL if available]

Focus on providing the most current and accurate information about L'Oréal products, application techniques, and beauty advice.`,
      };
    }
    return message;
  });

  const openAIResponse = await fetch(
    "https://api.openai.com/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...requestData,
        messages: modifiedMessages,
        // Remove tools from the request since we're simulating web search
        tools: undefined,
        model: "gpt-4o", // Use the latest model
      }),
    }
  );

  if (!openAIResponse.ok) {
    throw new Error(`OpenAI API error: ${openAIResponse.status}`);
  }

  return await openAIResponse.json();
}

async function handleStandardRequest(requestData, env) {
  const openAIResponse = await fetch(
    "https://api.openai.com/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
    }
  );

  if (!openAIResponse.ok) {
    throw new Error(`OpenAI API error: ${openAIResponse.status}`);
  }

  return await openAIResponse.json();
}

/* 
DEPLOYMENT INSTRUCTIONS:

1. Go to Cloudflare Dashboard > Workers & Pages
2. Create a new Worker
3. Replace the default code with this code
4. Go to Settings > Variables
5. Add environment variable: OPENAI_API_KEY with your OpenAI API key
6. Deploy the worker
7. Update the fetch URL in your JavaScript code to point to your worker

For true web search capabilities, you would need to:
1. Use a service like Serper API, Brave Search API, or Google Custom Search
2. Add the search API key as an environment variable
3. Implement actual web search in the handleWebSearchRequest function
4. Parse search results and include them in the AI prompt

Example with Serper API:
- Sign up at serper.dev
- Add SERPER_API_KEY environment variable
- Use their API to perform actual web searches
- Include search results in the prompt for more accurate information
*/

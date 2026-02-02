import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transcription, language = 'en' } = await req.json();
    
    if (!transcription) {
      throw new Error('No transcription provided');
    }

    // Check if transcription is too short or likely not useful content
    if (transcription.trim().length < 20) {
      throw new Error('Transcription is too short to generate a meaningful quiz. Please provide more detailed content.');
    }

    console.log('Generating quiz from transcription:', transcription.substring(0, 100) + '...');
    console.log('Language:', language);

    const languageInstruction = language === 'es' 
      ? `IMPORTANTE: Genera TODO el contenido del quiz en ESPAÑOL. El título, la descripción, todas las preguntas y todas las respuestas deben estar en español.`
      : `Generate all content in English.`;

    const systemPrompt = `You are an expert quiz creator for workplace safety and training. 
Your task is to create a quiz based on the topic and description provided.

${languageInstruction}

Generate exactly 10 multiple-choice questions with 4 answer options each.
Mark the correct answer for each question.

IMPORTANT RULES:
- Questions should test understanding, not just memorization
- Include a mix of easy, medium, and hard questions
- Make wrong answers plausible but clearly incorrect
- Focus on practical application and safety concepts
- Questions should align with OSHA standards where applicable
- If the content is too short or unclear, create a general safety quiz related to the topic mentioned
- ALWAYS generate a quiz - never refuse or ask for more information`;

    // Use tool calling for reliable structured output
    const tools = [
      {
        type: "function",
        function: {
          name: "create_quiz",
          description: "Create a workplace safety training quiz with 10 multiple choice questions",
          parameters: {
            type: "object",
            properties: {
              title: { 
                type: "string",
                description: "A descriptive title for the quiz"
              },
              description: { 
                type: "string",
                description: "Brief description of what this quiz covers"
              },
              questions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    question_text: { 
                      type: "string",
                      description: "The question text"
                    },
                    answers: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          answer_text: { type: "string" },
                          is_correct: { type: "boolean" }
                        },
                        required: ["answer_text", "is_correct"],
                        additionalProperties: false
                      },
                      minItems: 4,
                      maxItems: 4
                    }
                  },
                  required: ["question_text", "answers"],
                  additionalProperties: false
                },
                minItems: 10,
                maxItems: 10
              }
            },
            required: ["title", "description", "questions"],
            additionalProperties: false
          }
        }
      }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Create a workplace safety quiz based on this topic/content:\n\n${transcription}\n\nIf the content is too brief, create a general safety quiz related to any topics mentioned.` }
        ],
        tools: tools,
        tool_choice: { type: "function", function: { name: "create_quiz" } },
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const data = await response.json();
    console.log('OpenAI response received');
    
    // Extract the tool call result
    const toolCall = data.choices[0]?.message?.tool_calls?.[0];
    
    if (!toolCall || toolCall.function.name !== 'create_quiz') {
      console.error('No valid tool call in response:', JSON.stringify(data.choices[0]?.message));
      throw new Error('AI did not return structured quiz data');
    }

    let quizData;
    try {
      quizData = JSON.parse(toolCall.function.arguments);
    } catch (parseError) {
      console.error('Failed to parse tool call arguments:', parseError);
      console.error('Raw arguments:', toolCall.function.arguments);
      throw new Error('Failed to parse quiz data from AI response');
    }

    // Validate the quiz data structure
    if (!quizData.title || !quizData.description || !Array.isArray(quizData.questions)) {
      console.error('Invalid quiz structure:', quizData);
      throw new Error('Quiz data is missing required fields');
    }

    console.log('Quiz generated successfully:', quizData.title);
    console.log('Number of questions:', quizData.questions.length);

    return new Response(
      JSON.stringify(quizData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-quiz:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

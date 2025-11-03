import * as functions from "firebase-functions";
// <-- UPDATED: Import the specific types we need to fix the errors
import {
  VertexAI,
  HarmCategory,
  HarmBlockThreshold,
  type GenerateContentRequest,
  type Content, // <-- NEW: Import the 'Content' type
  SchemaType, // <-- NEW: Import 'SchemaType' enum
  FunctionCallingMode // <-- NEW: Import 'FunctionCallingMode' enum
} from "@google-cloud/vertexai";

// Initialize Vertex AI *once* at the top level
const vertexAI = new VertexAI({
  project: process.env.GCLOUD_PROJECT || functions.config().project.id,
  location: "us-central1",
});

// <-- UPDATED: This schema now uses the 'SchemaType' enum
const aiResponseSchema = {
  type: SchemaType.OBJECT, // <-- FIX: Was "OBJECT"
  properties: {
    type: {
      type: SchemaType.STRING, // <-- FIX: Was "STRING"
      enum: ["voice", "choice", "reflection", "breathing", "complete"],
      description: "The type of step this is."
    },
    voiceGuide: {
      type: SchemaType.STRING, // <-- FIX: Was "STRING"
      description: "What the AI companion should *say* to the user. This is the spoken text. Should be in the user's language (e.g., Hindi, English, or Hinglish)."
    },
    instruction: {
      type: SchemaType.STRING, // <-- FIX: Was "STRING"
      description: "The instruction text to display on the screen (e.g., 'What's on your mind?' or 'Say: I am strong')."
    },
    choices: {
      type: SchemaType.ARRAY, // <-- FIX: Was "ARRAY"
      description: "A list of choices for the user, ONLY if type is 'choice'.",
      items: {
        type: SchemaType.OBJECT, // <-- FIX: Was "OBJECT"
        properties: {
          id: { type: SchemaType.STRING, description: "A unique ID for the choice, e.g., 'choice_1'" },
          text: {
            type: SchemaType.OBJECT, // <-- FIX: Was "OBJECT"
            description: "Multilingual text for the choice. Provide 'en' and 'hi' keys. You can also add 'mr' (Marathi).",
            properties: {
              en: { type: SchemaType.STRING }, // <-- FIX
              hi: { type: SchemaType.STRING }, // <-- FIX
              mr: { type: SchemaType.STRING }  // <-- FIX
            }
          },
          emoji: { type: SchemaType.STRING, description: "A single emoji for the button." }, // <-- FIX
          points: { type: SchemaType.NUMBER, description: "Points to award for this choice." } // <-- FIX
        },
      },
    },
    points: {
      type: SchemaType.NUMBER, // <-- FIX: Was "NUMBER"
      description: "Points to award for completing this step (e.g., for a voice challenge)."
    },
  },
  required: ["type", "voiceGuide", "instruction"],
};

/**
 * This function is the new "brain" of your therapy session.
 */
export const advanceTherapySession = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
  }

  const { exercise, scenario, history, lastUserInput } = data;

  // 1. Construct the System Prompt
  const systemPrompt = `
    You are 'Mann-Mitra', a compassionate, expert mental health guide.
    Your goal is to lead the user through an interactive voice therapy session.
    You must be empathetic, supportive, and culturally aware (Indian context, familiar with academic pressure, family dynamics, etc.).
    You MUST speak in the user's preferred language, which appears to be ${lastUserInput.lang || 'English and Hindi'}. Use a natural, conversational mix (Hinglish) if appropriate, but stick to the primary language.
    The user is doing the "${exercise.title}" exercise, specifically the "${scenario.title}" scenario.
    You MUST follow the user's lead. Your responses must be a direct, logical continuation of their last input.
    You MUST call the 'submitNextStep' function with the JSON for the next step. DO NOT respond with plain text.
  `;

  // 2. Build the conversation history
  // <-- UPDATED: Explicitly type history as 'Content[]'
  const conversation: Content[] = [...history];

  // 3. Add the user's *latest* input to the history
  let latestInputText = "";
  if (lastUserInput.type === 'choice') {
    latestInputText = `(The user chose the option: "${lastUserInput.value}")`;
  } else if (lastUserInput.type === 'voice') {
    latestInputText = `(The user said: "${lastUserInput.value}")`;
  } else if (lastUserInput.type === 'start') {
    latestInputText = "The user has just started the session. Please provide the very first step to welcome them and begin the exercise.";
  }
  
  conversation.push({
    role: "user",
    parts: [{ text: latestInputText }],
  });

  // 4. Send to Gemini
  // 4. Send to Gemini
  try {
    
    // Initialize the model *inside* the function
    const generativeModel = vertexAI.getGenerativeModel({
      model: "gemini-2.5-pro",
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      ],
      systemInstruction: {
        role: 'system',
        parts: [{ text: systemPrompt }]
      },
    });

    // This is the corrected request object
    const request: GenerateContentRequest = {
      contents: conversation,
      tools: [{
        functionDeclarations: [
          {
            name: "submitNextStep",
            description: "This is the *only* function you will call. Submit the next step of the therapy session.",
            parameters: aiResponseSchema,
          }
        ]
      }],
      toolConfig: {
        // <-- UPDATED: 'mode' property removed from here.
        // The 'functionCallingConfig' is the only property needed.
        functionCallingConfig: {
          // <-- This is the only 'mode' property needed
          mode: FunctionCallingMode.ANY, 
          allowedFunctionNames: ["submitNextStep"],
        }
      }
    };

    console.log("Calling Gemini with tool-use request...", JSON.stringify(request.contents, null, 2));
    
    // This call will now work
    const result = await generativeModel.generateContent(request);
    
    const call = result.response.candidates?.[0]?.content.parts[0]?.functionCall;

    if (!call || !call.args) {
      console.error("AI Error: No function call or args returned.", JSON.stringify(result.response, null, 2));
      const fallbackText = result.response.candidates?.[0]?.content?.parts?.[0]?.text;
      if (fallbackText) {
          console.error("AI returned text instead of function:", fallbackText);
      }
      throw new Error("The AI failed to generate a valid next step.");
    }

    const nextStep = call.args;
    console.log("Received AI-generated step:", JSON.stringify(nextStep, null, 2));

    return { nextStep: nextStep };

  } catch (error: any) {
    console.error("Error generating therapy step:", error.message || error.toString());
    console.error("Details:", error.details || 'No details');
    throw new functions.https.HttpsError("internal", `AI generation failed: ${error.message}`);
  }
});
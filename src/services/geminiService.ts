import { GoogleGenAI } from "@google/genai";
import { SCREENING_SCHEMA, BROWSER_ACTION_SCHEMA, ScreeningResult, BrowserAction } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const geminiService = {
  async extractJDFromUrl(url: string): Promise<string> {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Extract the full job description from this URL: ${url}. 
      Focus on responsibilities, requirements, and company info. 
      Return ONLY the extracted text, no preamble.`,
      config: {
        tools: [{ urlContext: {} }]
      },
    });

    return response.text || "Failed to extract job description.";
  },

  async screenResume(jd: string, resume: string): Promise<ScreeningResult> {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
        You are an expert technical recruiter. 
        Evaluate the following resume against the job description.
        Provide a deep semantic analysis, not just keyword matching.
        
        JOB DESCRIPTION:
        ${jd}
        
        RESUME:
        ${resume}
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: SCREENING_SCHEMA as any,
      },
    });

    return JSON.parse(response.text || "{}");
  },

  async decideNextAction(
    jd: string,
    resume: string,
    screening: ScreeningResult,
    browserState: any
  ): Promise<BrowserAction> {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `
        You are an autonomous browser agent. Your goal is to process a candidate based on their screening result.
        
        JOB DESCRIPTION:
        ${jd}
        
        CANDIDATE SCREENING:
        Score: ${screening.score}
        Recommendation: ${screening.recommendation}
        Reasoning: ${screening.reasoning}
        
        CURRENT BROWSER STATE:
        URL: ${browserState.url}
        Visible Elements: ${browserState.elements.join(", ")}
        
        Decide the next logical action to take in the hiring portal (e.g., Greenhouse, Lever, Workday).
        If the recommendation is 'accept', move them to the next stage.
        If 'reject', send a polite rejection.
        If 'shortlist', flag for manual review.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: BROWSER_ACTION_SCHEMA as any,
      },
    });

    return JSON.parse(response.text || "{}");
  }
};

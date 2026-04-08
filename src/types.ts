import { GoogleGenAI, Type } from "@google/genai";

export enum ActionType {
  CLICK = "click",
  TYPE = "type",
  SCROLL = "scroll",
  DONE = "done",
  WAIT = "wait"
}

export interface BrowserAction {
  type: ActionType;
  target?: string;
  value?: string;
  reasoning: string;
}

export interface ScreeningResult {
  candidateName: string;
  score: number;
  skillsMatched: string[];
  missingSkills: string[];
  reasoning: string;
  recommendation: "accept" | "reject" | "shortlist";
}

export interface AgentState {
  currentStep: number;
  logs: string[];
  browserState: {
    url: string;
    elements: string[];
    lastAction?: BrowserAction;
  };
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  recommendation: "accept" | "reject" | "shortlist";
  timestamp: number;
}

export const SCREENING_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    candidateName: { type: Type.STRING, description: "The name of the candidate extracted from the resume" },
    score: { type: Type.NUMBER, description: "Score from 0 to 1" },
    skillsMatched: { type: Type.ARRAY, items: { type: Type.STRING } },
    missingSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
    reasoning: { type: Type.STRING },
    recommendation: { type: Type.STRING, enum: ["accept", "reject", "shortlist"] }
  },
  required: ["candidateName", "score", "skillsMatched", "missingSkills", "reasoning", "recommendation"]
};

export const BROWSER_ACTION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    type: { type: Type.STRING, enum: ["click", "type", "scroll", "done", "wait"] },
    target: { type: Type.STRING, description: "The selector or label of the element" },
    value: { type: Type.STRING, description: "Text to type if action is 'type'" },
    reasoning: { type: Type.STRING, description: "Why this action was chosen" }
  },
  required: ["type", "reasoning"]
};

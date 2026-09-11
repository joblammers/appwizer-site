/**
 * Typen voor de AppWizer quickscans.
 * Eén scan = 6 categorieën x 4 vragen, elk antwoord 0 t/m 4 punten.
 */

export type CategoryCode = string;

export interface AnswerOption {
  /** 0 t/m 4 */
  points: number;
  label: string;
}

export interface Question {
  id: number;
  category: CategoryCode;
  text: string;
  options: AnswerOption[];
}

export interface Category {
  code: CategoryCode;
  name: string;
  /** Weging voor de gewogen score; de som van alle wegingen is 1. */
  weight: number;
  /** Tekstblok dat wordt getoond wanneer dit de laagst scorende categorie is. */
  lowScoreText: string;
}

export type ProfileQuestionType = "single" | "multi" | "text";

export interface ProfileQuestion {
  id: string;
  text: string;
  type: ProfileQuestionType;
  options?: string[];
}

export interface Tier {
  /** Ondergrens als fractie, bijvoorbeeld 0.4 voor 40%. */
  min: number;
  max: number;
  level: string;
  headline: string;
  body: string;
  recognise: string[];
  steps: string[];
}

export interface Scan {
  slug: string;
  title: string;
  subtitle: string;
  audience: string;
  intro: string;
  /** "kantoor" of "organisatie" — gebruikt in de call to action. */
  subject: string;
  categories: Category[];
  questions: Question[];
  profileQuestions: ProfileQuestion[];
  tiers: Tier[];
}

/** Antwoorden op de scorevragen: vraag-id -> behaalde punten. */
export type Answers = Record<number, number>;

/** Antwoorden op de profielvragen: vraag-id -> waarde. */
export type ProfileAnswers = Record<string, string | string[]>;

export interface CategoryScore {
  code: CategoryCode;
  name: string;
  points: number;
  maxPoints: number;
  /** Fractie tussen 0 en 1. */
  percentage: number;
  weight: number;
  /** Hoeveel de totaalscore stijgt als deze categorie naar 100% gaat. */
  improvementPotential: number;
}

export interface ScanResult {
  points: number;
  maxPoints: number;
  /** Ongewogen fractie — dit is de score die de deelnemer ziet. */
  percentage: number;
  /** Gewogen fractie voor intern gebruik in het adviesgesprek. */
  weightedPercentage: number;
  tier: Tier;
  categories: CategoryScore[];
  lowestCategory: CategoryScore;
}

export interface LeadPayload {
  scanSlug: string;
  firstName: string;
  email: string;
  company: string;
  phone?: string;
  consent: boolean;
  answers: Answers;
  profile: ProfileAnswers;
}

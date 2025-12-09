import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

// Define types reflecting the YAML structure
interface PromptConfig {
  model: string;
  temperature: number;
  max_tokens: number;
  system: string;
  user_template?: string;
  variants?: Record<string, { description: string; user_template: string }>;
}

interface PromptsFile {
  meta: any;
  tones: any;
  tasks: Record<string, PromptConfig>;
}

export interface PromptResult {
  model: string;
  temperature: number;
  max_tokens: number;
  system: string;
  messages: { role: "user" | "model"; content: string }[];
}

const PROMPTS_PATH = path.join(process.cwd(), 'prompts', 'prompts.yml');

let cachedPrompts: PromptsFile | null = null;

function loadPrompts(): PromptsFile {
  if (cachedPrompts) return cachedPrompts;

  try {
    const fileContents = fs.readFileSync(PROMPTS_PATH, 'utf8');
    cachedPrompts = yaml.load(fileContents) as PromptsFile;
    return cachedPrompts;
  } catch (e) {
    console.error("Failed to load prompts.yml", e);
    throw e;
  }
}

function interpolate(template: string, variables: Record<string, any>): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (_, key) => {
    const value = variables[key.trim()];
    return value !== undefined ? String(value) : `{{${key}}}`;
  });
}

export function getPrompt(taskName: string, variables: Record<string, any> = {}, variant?: string): PromptResult {
  const data = loadPrompts();
  const taskConfig = data.tasks[taskName];

  if (!taskConfig) {
    throw new Error(`Prompt task '${taskName}' not found in prompts.yml`);
  }

  // Determine user template: base or variant
  let userTemplate = taskConfig.user_template;
  if (variant && taskConfig.variants && taskConfig.variants[variant]) {
    userTemplate = taskConfig.variants[variant].user_template;
  }

  if (!userTemplate) {
    throw new Error(`User template not found for task '${taskName}' (variant: ${variant})`);
  }

  // Inject variables into system prompt and user prompt
  const systemPrompt = interpolate(taskConfig.system, variables);
  const userPrompt = interpolate(userTemplate, variables);

  return {
    model: taskConfig.model,
    temperature: taskConfig.temperature,
    max_tokens: taskConfig.max_tokens,
    system: systemPrompt,
    messages: [
      { role: "user", content: userPrompt }
    ]
  };
}

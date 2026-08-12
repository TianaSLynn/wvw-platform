/**
 * Renders a Notion-stored template's {{Variable}} placeholders. Per Tiána's
 * explicit instruction for MHFA-COMM-001: "Missing or conflicting values
 * must stop the communication... rather than sending incomplete
 * information" -- renderTemplate throws MissingTemplateVariablesError
 * rather than silently leaving a placeholder unfilled or blank.
 */

export class MissingTemplateVariablesError extends Error {
  constructor(public readonly missing: string[]) {
    super(`Template references variables with no provided value: ${missing.join(", ")}`);
    this.name = "MissingTemplateVariablesError";
  }
}

const PLACEHOLDER_PATTERN = /\{\{([A-Za-z0-9_]+)\}\}/g;

export function findTemplateVariables(template: string): string[] {
  const names = new Set<string>();
  for (const match of template.matchAll(PLACEHOLDER_PATTERN)) {
    names.add(match[1]);
  }
  return [...names];
}

export function renderTemplate(template: string, variables: Record<string, string>): string {
  const required = findTemplateVariables(template);
  const missing = required.filter((name) => variables[name] === undefined || variables[name] === "");
  if (missing.length > 0) throw new MissingTemplateVariablesError(missing);

  return template.replace(PLACEHOLDER_PATTERN, (_match, name: string) => variables[name]);
}

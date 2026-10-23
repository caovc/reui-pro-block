export type LocalBlueprint = {
  name: string;
  description: string;
  tasks: string[];
};

/** Free upload Hook supplies validated File objects; JSON domain schema is missing there. */
export function parseBlueprint(text: string): LocalBlueprint {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Choose a valid JSON file with name, description, and tasks fields.");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("A blueprint must be a JSON object.");
  }
  const record = parsed as Record<string, unknown>;
  if (typeof record.name !== "string" || !record.name.trim() || record.name.length > 80) {
    throw new Error("Blueprint name must contain 1–80 characters.");
  }
  if (typeof record.description !== "string" || record.description.length > 500) {
    throw new Error("Blueprint description must be text of up to 500 characters.");
  }
  if (
    !Array.isArray(record.tasks) ||
    record.tasks.length > 20 ||
    record.tasks.some((task) => typeof task !== "string" || !task.trim() || task.length > 120)
  ) {
    throw new Error(
      "Blueprint tasks must be a list of up to 20 non-empty text items, each up to 120 characters.",
    );
  }
  return {
    name: record.name.trim(),
    description: record.description.trim(),
    tasks: record.tasks.map((task: string) => task.trim()),
  };
}

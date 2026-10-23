export type ChatNode = {
  id: string;
  parent: string | null;
  children: string[];
  role: "root" | "user" | "assistant";
  text: string;
  time?: string;
  model?: string;
  code?: string;
  language?: string;
  filename?: string;
  heading?: string;
  bullets?: string[];
  after?: string;
  sources?: number[];
  attachments?: string[];
  stopped?: boolean;
};
export type ChatThread = {
  id: string;
  title: string;
  when: string;
  group: "Today" | "Yesterday" | "Earlier";
  file?: string;
};
export type ChatTree = {
  nodes: Record<string, ChatNode>;
  selection: Record<string, string>;
};
export const chatModels = ["Claude Sonnet 5", "GPT-5.1", "Gemini 3 Pro"];
export const chatModelGroups = [
  {
    provider: "Anthropic",
    models: [
      ["Claude Sonnet 5", "200K"],
      ["Claude Opus 5", "200K"],
      ["Claude Haiku 4.5", "200K"],
    ],
  },
  {
    provider: "OpenAI",
    models: [
      ["GPT-5.1", "256K"],
      ["GPT-5.1 Mini", "256K"],
      ["GPT-5", "128K"],
    ],
  },
  {
    provider: "Google",
    models: [
      ["Gemini 3 Pro", "1M"],
      ["Gemini 3 Flash", "1M"],
      ["Gemini 2.5 Pro", "2M"],
    ],
  },
  {
    provider: "Mistral",
    models: [
      ["Mistral Large 2", "128K"],
      ["Mistral Small 3", "128K"],
      ["Codestral 25.08", "256K"],
    ],
  },
];
export const chatSources = [
  { title: "release-notes-3.4.md", detail: "Draft, edited 14m ago" },
  { title: "release-notes-3.3.md", detail: "Published Jul 30" },
  { title: "changelog-3.4.yaml", detail: "3 user facing changes" },
];
export const chatThreads: ChatThread[] = [
  {
    id: "release",
    title: "Release highlights for 3.4",
    when: "2m",
    group: "Today",
    file: "release-notes-3.4.md",
  },
  {
    id: "admin",
    title: "Workspace admin guide",
    when: "1h",
    group: "Today",
    file: "admin-notes-3.4.pdf",
  },
  {
    id: "webhook",
    title: "Investigate refund webhook errors",
    when: "2h",
    group: "Today",
    file: "webhook-handler.ts",
  },
  {
    id: "churn",
    title: "Retention by subscription plan",
    when: "3h",
    group: "Today",
    file: "retention-q3.csv",
  },
  {
    id: "onboarding",
    title: "Mobile onboarding project scope",
    when: "Yesterday",
    group: "Yesterday",
  },
  {
    id: "trial",
    title: "Refresh the trial reminder email",
    when: "Tue",
    group: "Earlier",
    file: "trial-reminder.txt",
  },
  {
    id: "query",
    title: "Weekly workspace activity query",
    when: "Mon",
    group: "Earlier",
  },
];
const wrap = (text: string) => text.replace(/(.{1,48})(?:\s+|$)/g, "$1\n").trim();
const highlights = (includeNumber: boolean) =>
  `## Highlights\n\n${wrap(`Everyday work feels easier in 3.4. Refund updates arrive promptly with clearer confirmation, workspace access follows the latest team changes automatically, and ${includeNumber ? "exports with more than 40,000 rows" : "large project exports"} complete reliably without a second attempt. Teams spend less time checking status and more time moving their work forward.`)}`;

export function composeChatReply(
  prompt: string,
  variant = 0,
): Pick<ChatNode, "text" | "code" | "language" | "filename" | "sources"> {
  const common = { sources: [0, 1] };
  if (/verify|numbers|figures/i.test(prompt))
    return {
      ...common,
      text: "Check these figures against the source documents before the announcement is approved:",
      language: "markdown",
      filename: "verification-checklist.md",
      code: "## Figures to verify\n\n- Export volume: confirm the reviewed threshold\n- Refund delivery: verify the observed timing\n- Membership updates: check the sync interval\n\nRecord the source, date, and reviewer for each claim.",
    };
  if (/compare|against|previous|3\.3/i.test(prompt))
    return {
      ...common,
      text: "The earlier opening leads with a reader outcome. The revised draft now follows that pattern and keeps technical detail in the changelog:",
      language: "markdown",
      filename: "release-comparison.md",
      code: "## Opening comparison\n\n| Review point | Previous | Revised |\n| --- | --- | --- |\n| Reader outcome first | Yes | Yes |\n| One concise paragraph | Yes | Yes |\n| Unverified figures | None | Removed |\n\nNext: review the wording with the release owner.",
    };
  if (/sql|query|database/i.test(prompt))
    return {
      ...common,
      text: "Group the activity by week and keep the date range explicit. This query counts workspace events without including personal information.",
      language: "sql",
      filename: "weekly-activity.sql",
      code: "SELECT date_trunc('week', created_at) AS week,\n       COUNT(*) AS activity_count\nFROM workspace_events\nWHERE created_at >= CURRENT_DATE - INTERVAL '28 days'\nGROUP BY 1\nORDER BY 1;",
    };
  if (/json|config/i.test(prompt))
    return {
      ...common,
      text: "Keep the owner and review gate explicit in the project configuration.",
      language: "json",
      filename: "release-config.json",
      code: JSON.stringify(
        {
          project: "Workspace release",
          owner: "Release team",
          reviewRequired: true,
          checks: ["Accessibility", "Exports", "Documentation"],
        },
        null,
        2,
      ),
    };
  if (/yaml/i.test(prompt))
    return {
      ...common,
      text: "A versioned checklist keeps the release decision visible to everyone reviewing it.",
      language: "yaml",
      filename: "release-checklist.yaml",
      code: "release:\n  owner: release-team\n  checks:\n    - accessibility\n    - exports\n    - documentation\n  approval_required: true",
    };
  if (/typescript|function|code/i.test(prompt))
    return {
      ...common,
      text: "Use a typed checklist to make the remaining work explicit before publication.",
      language: "typescript",
      filename: "release-check.ts",
      code: "type Check = { label: string; done: boolean }\n\nexport function readyToPublish(checks: Check[]): boolean {\n  return checks.length > 0 && checks.every(check => check.done)\n}",
    };
  return {
    ...common,
    text:
      variant % 2
        ? "A shorter version puts the result first. Keep the implementation details in the full changelog:"
        : "Here is a reader-focused version, with the everyday improvements first:",
    language: "markdown",
    filename: "release-notes-3.4.md",
    code: /check|plan/i.test(prompt)
      ? "## Review checklist\n\n- Confirm the release owner\n- Check keyboard navigation\n- Verify a complete export\n- Review the announcement\n- Record the rollout decision"
      : highlights(!/remove|number|limit/i.test(prompt)),
  };
}

export function seedChatTree(): ChatTree {
  const tree: ChatTree = { nodes: {}, selection: {} };
  function add(parent: string, node: Omit<ChatNode, "parent" | "children">) {
    const result: ChatNode = { ...node, parent, children: [] };
    tree.nodes[node.id] = result;
    tree.nodes[parent].children.push(node.id);
    return result.id;
  }
  for (const thread of chatThreads) {
    tree.nodes[thread.id] = {
      id: thread.id,
      parent: null,
      children: [],
      role: "root",
      text: "",
    };
    if (thread.id === "release") continue;
    const prompt =
      thread.id === "query"
        ? "Write a SQL query for weekly workspace activity."
        : `Help me review the ${thread.title.toLowerCase()}.`;
    const user = add(thread.id, {
      id: `${thread.id}-u0`,
      role: "user",
      text: prompt,
      time: "09:40",
    });
    add(user, {
      id: `${thread.id}-a0`,
      role: "assistant",
      model: chatModels[0],
      time: "09:41",
      ...composeChatReply(prompt),
    });
  }
  const first = add("release", {
    id: "release-u0",
    role: "user",
    text: "The release highlights still read like a technical changelog. Could you review the opening?",
    time: "10:28",
  });
  const analysis = add(first, {
    id: "release-a0",
    role: "assistant",
    model: chatModels[0],
    time: "10:29",
    text: "The draft introduces three implementation areas before explaining how they help the reader.",
    heading: "What the opening emphasizes",
    bullets: [
      "Membership synchronization names the system before describing reliable access.",
      "Refund webhooks explain the mechanism before the faster update.",
      "Export thresholds sound like a new restriction instead of an improvement.",
    ],
    code: 'release: "3.4"\nreview: 2026-08-27\nchanges:\n  - area: billing\n    outcome: faster refund updates\n  - area: identity\n    outcome: current team access\n  - area: exports\n    outcome: reliable large exports',
    language: "yaml",
    filename: "changelog-3.4.yaml",
    sources: [0, 1, 2],
    after: "The previous introduction started with the outcome. We can use that approach here too.",
  });
  const second = add(analysis, {
    id: "release-u1",
    role: "user",
    text: "Yes. Keep it to one paragraph, without bullets.",
    time: "10:29",
  });
  const edited = add(analysis, {
    id: "release-u1-edit",
    role: "user",
    text: "Use a concise checklist for the release reviewer instead.",
    time: "10:32",
  });
  add(edited, {
    id: "release-a1-edit",
    role: "assistant",
    model: chatModels[0],
    time: "10:32",
    ...composeChatReply("Create a release review checklist"),
  });
  let selected = "";
  chatModels.forEach((model, i) => {
    const id = add(second, {
      id: `release-a1-${i}`,
      role: "assistant",
      model,
      time: ["10:30", "10:33", "10:35"][i],
      ...composeChatReply("Rewrite the release introduction", i),
      after:
        i === 1
          ? "The usage figure comes from the export review. Confirm it before sharing the final draft."
          : undefined,
    });
    if (i === 1) selected = id;
  });
  tree.selection[second] = selected;
  const third = add(selected, {
    id: "release-u2",
    role: "user",
    text: "Remove the usage limit; that figure is still under review.",
    time: "10:34",
  });
  add(third, {
    id: "release-a2-0",
    role: "assistant",
    model: chatModels[1],
    time: "10:34",
    ...composeChatReply("Remove the usage number from the release"),
    text: "The figure is removed. The benefits stay clear in the revised paragraph:",
  });
  add(third, {
    id: "release-a2-1",
    role: "assistant",
    model: chatModels[0],
    time: "10:36",
    ...composeChatReply("Remove the usage number from the release", 1),
  });
  return tree;
}

export function chatPath(tree: ChatTree, root: string): ChatNode[] {
  const path: ChatNode[] = [];
  let node = tree.nodes[root];
  while (node?.children.length) {
    const chosen = tree.selection[node.id];
    node = tree.nodes[node.children.includes(chosen) ? chosen : node.children[0]];
    if (node) path.push(node);
  }
  return path;
}

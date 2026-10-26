/** Actual free REUI c-questionnaire-1 registered-items/Card composition (MIT).
 * https://reui.io/r/radix-nova/c-questionnaire-1.json
 * Copyright (c) 2025 Keenthemes Inc.; preserve REUI-LICENSE.txt.
 * The real upstream Questionnaire owns required choices, keyboard flow and
 * FormData. Application state handles the task plan after submission.
 */
import { useId } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Questionnaire,
  QuestionnaireActions,
  QuestionnaireChoice,
  QuestionnaireChoiceDescription,
  QuestionnaireChoices,
  QuestionnaireDescription,
  QuestionnaireError,
  QuestionnaireItem,
  QuestionnaireNext,
  QuestionnairePrevious,
  QuestionnaireProgress,
  QuestionnaireSubmit,
  QuestionnaireTitle,
} from "@/components/ui/questionnaire";
import type { TaskBrief } from "./ai-chat-task-model";
const QUESTIONS = [
  {
    name: "scope",
    title: "Which context may I use?",
    choices: [
      {
        value: "selected",
        label: "Selected workspace sources",
        hint: "Use only the sources enabled above",
      },
      {
        value: "attachments",
        label: "Attached files only",
        hint: "Exclude workspace sources that were not attached",
      },
    ],
  },
  {
    name: "delivery",
    title: "What should I produce?",
    choices: [
      {
        value: "note",
        label: "A review note",
        hint: "A concise explanation with the source scope",
      },
      {
        value: "checklist",
        label: "A working checklist",
        hint: "A Markdown checklist for the team",
      },
    ],
  },
  {
    name: "depth",
    title: "How detailed should the review be?",
    choices: [
      { value: "focused", label: "A focused first pass", hint: "Keep the artifact short" },
      {
        value: "detailed",
        label: "A detailed validation pass",
        hint: "Include keyboard, narrow-screen and recovery checks",
      },
    ],
  },
];
export function AgentTaskBrief({ onComplete }: { onComplete: (brief: TaskBrief) => void }) {
  const id = useId();
  return (
    <Questionnaire
      items={QUESTIONS.map((question) => ({
        name: question.name,
        required: true,
        choices: question.choices.map((choice) => ({ value: choice.value })),
      }))}
      shortcuts="letters"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const brief = {
          scope: String(data.get("scope") ?? ""),
          delivery: String(data.get("delivery") ?? ""),
          depth: String(data.get("depth") ?? ""),
        };
        if (Object.values(brief).every(Boolean)) onComplete(brief);
      }}
    >
      <Card className="gap-0 py-0 shadow-none">
        {QUESTIONS.map((question) => (
          <QuestionnaireItem
            key={question.name}
            name={question.name}
            required
            aria-labelledby={`${id}-${question.name}`}
          >
            <CardHeader className="gap-2 p-4">
              <QuestionnaireTitle
                id={`${id}-${question.name}`}
                render={<CardTitle />}
                className="text-sm"
              >
                {question.title}
              </QuestionnaireTitle>
              <QuestionnaireProgress className="text-[10px]" />
              <QuestionnaireDescription className="text-xs">
                Confirm the brief before any local run begins.
              </QuestionnaireDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <QuestionnaireChoices>
                {question.choices.map((choice) => (
                  <QuestionnaireChoice key={choice.value} value={choice.value}>
                    {choice.label}
                    <QuestionnaireChoiceDescription className="text-xs">
                      {choice.hint}
                    </QuestionnaireChoiceDescription>
                  </QuestionnaireChoice>
                ))}
              </QuestionnaireChoices>
              <QuestionnaireError />
            </CardContent>
          </QuestionnaireItem>
        ))}
        <CardFooter className="border-t p-3">
          <QuestionnaireActions>
            <QuestionnairePrevious size="sm" />
            <QuestionnaireNext size="sm">Next</QuestionnaireNext>
            <QuestionnaireSubmit size="sm">Build task plan</QuestionnaireSubmit>
          </QuestionnaireActions>
        </CardFooter>
      </Card>
    </Questionnaire>
  );
}
export function AgentTaskFork({ onAnswer }: { onAnswer: (include: boolean) => void }) {
  const id = useId();
  return (
    <Questionnaire
      items={[
        { name: "example", required: true, choices: [{ value: "include" }, { value: "omit" }] },
      ]}
      shortcuts="letters"
      onSubmit={(event) => {
        event.preventDefault();
        const value = new FormData(event.currentTarget).get("example");
        if (value) onAnswer(value === "include");
      }}
    >
      <Card className="gap-0 py-0 shadow-none">
        <QuestionnaireItem name="example" required aria-labelledby={id}>
          <CardHeader className="p-4">
            <QuestionnaireTitle id={id} render={<CardTitle />} className="text-sm">
              Should the artifact include an example?
            </QuestionnaireTitle>
            <QuestionnaireDescription className="text-xs">
              The source does not contain a verified customer quotation. Choose whether to include a
              clearly labeled illustration.
            </QuestionnaireDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <QuestionnaireChoices>
              <QuestionnaireChoice value="include">
                Include an illustrative example
                <QuestionnaireChoiceDescription className="text-xs">
                  Label it as original demo content.
                </QuestionnaireChoiceDescription>
              </QuestionnaireChoice>
              <QuestionnaireChoice value="omit">
                Omit the example branch
                <QuestionnaireChoiceDescription className="text-xs">
                  Remove that step and continue the source-backed draft.
                </QuestionnaireChoiceDescription>
              </QuestionnaireChoice>
            </QuestionnaireChoices>
            <QuestionnaireError />
          </CardContent>
        </QuestionnaireItem>
        <CardFooter className="border-t p-3">
          <QuestionnaireActions>
            <QuestionnaireSubmit size="sm">Continue plan</QuestionnaireSubmit>
          </QuestionnaireActions>
        </CardFooter>
      </Card>
    </Questionnaire>
  );
}

/** Actual free REUI c-questionnaire-1 composition, adapted to an original brief.
 * https://reui.io/r/radix-nova/c-questionnaire-1.json
 * MIT, Copyright (c) 2025 Keenthemes Inc. Preserve REUI-LICENSE.txt.
 * The installed upstream primitive owns required answers, validation,
 * keyboard shortcuts, progression and FormData; none are reimplemented here.
 */
import { useId } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { PLAN_QUESTIONS, type PlanAnswers } from "./ai-chat-session";

export default function ChatQuestionnaire({
  onComplete,
}: {
  onComplete: (answers: PlanAnswers) => void;
}) {
  const titleId = useId();
  const items = PLAN_QUESTIONS.map((question) => ({
    name: question.name,
    required: true,
    choices: question.choices.map((choice) => ({ value: choice.value })),
  }));
  return (
    <Questionnaire
      items={items}
      shortcuts="letters"
      defaultItem="goal"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const answers = {
          goal: String(data.get("goal") ?? ""),
          audience: String(data.get("audience") ?? ""),
          pace: String(data.get("pace") ?? ""),
        };
        if (Object.values(answers).every(Boolean)) onComplete(answers);
      }}
    >
      <Card className="w-full gap-0 py-0 shadow-none">
        {PLAN_QUESTIONS.map((question) => (
          <QuestionnaireItem
            key={question.name}
            name={question.name}
            required
            aria-labelledby={`${titleId}-${question.name}`}
          >
            <CardHeader className="gap-2 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <QuestionnaireTitle
                  id={`${titleId}-${question.name}`}
                  render={<CardTitle />}
                  className="text-sm"
                >
                  {question.title}
                </QuestionnaireTitle>
                <QuestionnaireProgress className="min-w-0 text-[11px]" />
              </div>
              <QuestionnaireDescription render={<CardDescription />} className="text-xs">
                Pick the option that best fits this original demo brief.
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
        <CardFooter className="border-t p-4">
          <QuestionnaireActions>
            <QuestionnairePrevious size="sm" />
            <QuestionnaireNext size="sm">Next</QuestionnaireNext>
            <QuestionnaireSubmit size="sm">Build plan</QuestionnaireSubmit>
          </QuestionnaireActions>
        </CardFooter>
      </Card>
    </Questionnaire>
  );
}

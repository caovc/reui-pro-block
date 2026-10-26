import { useRef } from "react";
import {
  ArrowUpRight,
  BookOpen,
  Copy,
  CreditCard,
  FileSpreadsheet,
  Info,
  LifeBuoy,
  Link,
  Puzzle,
  Rocket,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { Frame } from "@/components/reui/frame";
import { IconTile } from "@/components/reui/icon-tile";
import { Alert, AlertDescription } from "@/components/reui/alert";
import { Badge } from "@/components/reui/badge";
import { Scrollspy } from "@/components/reui/scrollspy";
import { Avatar, Button, ReferenceSheet } from "./shared";
import { knowledgeCategories, type KnowledgeArticle } from "./pulse-knowledge-data";

const categoryIcons = {
  billing: CreditCard,
  technical: Wrench,
  onboarding: Rocket,
  account: LifeBuoy,
  security: ShieldCheck,
  integrations: Puzzle,
};

export function PulseKnowledgeBase({
  query,
  articleId,
  setArticleId,
}: {
  query: string;
  articleId: string;
  setArticleId: (id: string) => void;
}) {
  const scrollRef = useRef<HTMLElement | null>(null);
  const category = knowledgeCategories.find((group) =>
    group.articles.some((a) => a.id === articleId),
  );
  const article: KnowledgeArticle | undefined = category?.articles.find((a) => a.id === articleId);
  const categories = knowledgeCategories
    .map((group) => ({
      ...group,
      articles: group.articles.filter((a) =>
        `${group.title} ${a.title} ${a.summary}`.toLowerCase().includes(query.toLowerCase()),
      ),
    }))
    .filter((group) => group.articles.length);
  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Clipboard is unavailable in this browser");
    }
  }
  return (
    <>
      <div className="ct-heading">
        <p>Guides agents read while working a ticket.</p>
      </div>
      <div className="ct-kb-grid">
        {categories.map((group) => {
          const Icon = categoryIcons[group.icon as keyof typeof categoryIcons];
          return (
            <Frame key={group.title} className="ct-kb-category" variant="ghost">
              <div className="ct-kb-category-head">
                <IconTile variant="solid" style={{ background: group.color }}>
                  <Icon />
                </IconTile>
                <h2>{group.title}</h2>
                <p>{group.description}</p>
              </div>
              <div className="ct-kb-links">
                {group.articles.map((a) => (
                  <button type="button" key={a.id} onClick={() => setArticleId(a.id)}>
                    <span>{a.title}</span>
                    <ArrowUpRight size={15} />
                  </button>
                ))}
              </div>
            </Frame>
          );
        })}
      </div>
      {!categories.length && <p className="ct-muted py-8">No articles match your search.</p>}
      <ReferenceSheet
        title={`Knowledge base${category ? ` / ${category.title}` : ""}`}
        open={!!article}
        onClose={() => setArticleId("")}
        width={544}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => copy(`${location.href.split("?")[0]}?article=${articleId}`)}
            >
              <Link /> Copy link
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                article &&
                copy(
                  [
                    article.title,
                    article.summary,
                    ...article.sections.flatMap(([title, body]) => [title, body]),
                  ].join("\n\n"),
                )
              }
            >
              <Copy /> Copy article text
            </Button>
          </>
        }
      >
        {article && (
          <article
            className="ct-kb-article"
            ref={(node) => {
              scrollRef.current = node?.parentElement || null;
            }}
          >
            <BookOpen className="ct-muted" size={20} />
            <h2>{article.title}</h2>
            <div className="ct-toolbar">
              <Badge variant="outline">Internal only</Badge>
              <Badge variant="success-light">Verified</Badge>
            </div>
            <div className="ct-kb-author">
              <Avatar name="Priya Patel" />
              <span>
                Priya Patel <small>Updated 4 days ago</small>
              </span>
            </div>
            <p className="ct-kb-summary">{article.summary}</p>
            <nav aria-label="In this article" className="ct-kb-toc">
              <h3>IN THIS ARTICLE</h3>
              <Scrollspy targetRef={scrollRef} history={false} offset={16}>
                {article.sections.map(([heading], i) => (
                  <button key={heading} data-scrollspy-anchor={`article-section-${i}`}>
                    {heading}
                  </button>
                ))}
              </Scrollspy>
            </nav>
            {article.sections.map(([heading, body], i) => (
              <section id={`article-section-${i}`} key={heading}>
                <h3>{heading}</h3>
                <p>{body}</p>
                {i === 1 && (
                  <Alert variant="info" className="mt-4">
                    <Info />
                    <AlertDescription>
                      Keep the ticket owner informed and record the outcome before closing the
                      request.
                    </AlertDescription>
                  </Alert>
                )}
              </section>
            ))}
            {article.attachment && (
              <section>
                <h3>ATTACHMENTS</h3>
                <Button
                  variant="outline"
                  className="ct-kb-attachment"
                  onClick={() => {
                    const link = document.createElement("a");
                    link.href = URL.createObjectURL(
                      new Blob(
                        [
                          "Amount,Approver\nUp to 100,Ticket owner\n100 to 1000,Billing lead\nOver 1000,Finance administrator\n",
                        ],
                        { type: "text/csv;charset=utf-8" },
                      ),
                    );
                    link.download = "bricklane-refund-approval-matrix.csv";
                    link.click();
                    URL.revokeObjectURL(link.href);
                  }}
                >
                  <FileSpreadsheet />
                  <span>
                    {article.attachment}
                    <small>CSV · Demo policy</small>
                  </span>
                </Button>
              </section>
            )}
          </article>
        )}
      </ReferenceSheet>
    </>
  );
}

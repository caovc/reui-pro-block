import Flowly from "./flowly";
import Mesh from "./mesh";
import Echo from "./echo";
import Lucent from "./lucent";
import Tempo from "./tempo";
import Flux from "./flux";
import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import "./workflow.css";
const Strata = lazy(() => import("./strata"));
export default function WorkflowTemplate({ id }: { id: string }) {
  switch (id) {
    case "strata":
      return (
        <Suspense fallback={<Skeleton className="h-96 w-full" aria-label="Loading template" />}>
          <Strata />
        </Suspense>
      );
    case "flowly":
      return <Flowly />;
    case "mesh":
      return <Mesh />;
    case "echo":
      return <Echo />;
    case "lucent":
      return <Lucent />;
    case "tempo":
      return <Tempo />;
    case "flux":
      return <Flux />;
    default:
      return null;
  }
}

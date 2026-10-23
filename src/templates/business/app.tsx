import Atlas from "./atlas";
import Cohort from "./cohort";
import CommerceTemplate from "./commerce";
import Miro from "./miro";
import Verve from "./verve";
import "./business.css";
export default function BusinessApp({ id }: { id: string }) {
  if (id === "atlas") return <Atlas />;
  if (id === "verve") return <Verve />;
  if (id === "miro") return <Miro />;
  if (id === "cohort") return <Cohort />;
  return <CommerceTemplate id={id} />;
}

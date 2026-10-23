import { referencePhotos } from './photo-assets';
const reviews=[
['40%','LOWER OPS SPEND','We retired the ETL vendor, the cron box, and both status dashboards inside a quarter. Finance noticed before engineering did.','Maya Lindqvist','Head of Ops, Arclight'],
['','','A typed integration failing in CI instead of at 2am is worth the invoice on its own. Eleven schema breaks caught since March, zero reached production.','Tomas Ricci','Platform Lead, Nightjar'],
['','','Standup got shorter. That is the whole review.','Jonas Weber','Founder, Ottavo'],
['','','I was ready to write the enrichment layer myself. Scoring on ingest got us further in a week than my roadmap had us reaching by June.','Amara Diallo','CTO, Halcyon'],
['30x','LAUNCH WEEK TRAFFIC','Launch week peaked at thirty times a normal Tuesday. The per-request cost did not move. I checked twice.','Elena Vasquez','VP Engineering, Copperline'],
['','','Scheduling reads capacity and timezones better than the spreadsheet that used to run my mornings. I do not miss the spreadsheet.','Rosa Delgado','Director of Ops, Bellwether'],
['','','The cohort view settled an argument we had been having for two quarters. One afternoon, one chart, done.','Noor Haddad','Product Manager, Solvine'],
['','','Records land deduplicated and scored, so warehouse queries read like questions instead of archaeology.','Felix Andersen','Data Lead, Fernwave'],
['40h','BACK EVERY WEEK','Forty hours a week came back to the marketing team. We spent every one of them on campaigns.','Grace Okafor','CMO, Windrose'],
];
export function LimelightTestimonials(){const photos=Object.keys(referencePhotos).filter(s=>s.includes('w=96'));return <section className="ct-lime-section ct-lime-quotes"><div className="ct-lime-quote-head"><div><h2>The notices<br/>are in</h2><p>Ten teams on what changed after the move,<br/>collected from renewal calls.</p></div><blockquote>We shut four tools off on a Friday and nobody has asked for any of them since. Monday standup was the first in a year that did not open with a syncing question.<cite>INGRID BERGSTROM · COO, VELDT</cite></blockquote></div><div className="ct-lime-quote-columns">{[0,1,2].map(col=><div key={col}>{reviews.slice(col*3,col*3+3).map((r,i)=><article key={r[3]}>{r[0]&&<div className="ct-review-metric"><strong>{r[0]}</strong><small>{r[1]}</small></div>}<p>{r[2]}</p><footer><img src={photos[col*3+i]} alt=""/><span>{r[3]}<small>{r[4]}</small></span></footer></article>)}</div>)}</div></section>}

# Independent model comparison workspace

Chat 7 is a Bricklane composition with two model lanes, inset cards, an A/B identity, a separate evaluation area and an explicit local-playback notice. Its layout is authored independently rather than calibrated to a proprietary reference. The desktop header, pane framing, typography, score area, composer and phone navigation form a distinct presentation in the repository's theme tokens.

## Actual free component reuse

The consumer imports the existing free ReUI foundation implementations: Resizable (real pointer and keyboard separator), Tabs, Select, Button, Tooltip, Message, Bubble, MessageScroller, InputGroup, Field, Attachment, Table, Spinner, Badge, Alert and Empty. Source export keeps their actual transitive implementations and ReUI MIT notice. The code surface uses the existing free ReUI CodeBlock. The free patterns and registry evidence already recorded in `docs/ai-chat-free-sources.json` include c-message-4/7, c-message-scroller-2/3/4, c-input-group-19, c-attachment-2 and c-code-block-4. No foundation file is replaced or relabelled.

Custom comparison code owns the two independent playback sessions, proportional transcript-scroll coupling, fixture table sorting, quoting, transcript downloads, partial metrics and A/B preference. The free component library supplies the controls and surfaces; it has no combined comparison-session controller. Custom empty and simulated-limit markup from the preparatory draft now composes the existing Empty and Alert implementations.

## Data and behavior

The retention-review scenario, questions, tables, SQL and answers are local original fixtures. Selected files contribute only their name and size to local state; their bytes are neither read nor uploaded. Prompts choose among recorded answer variations and never call a model service. Timing, output counts and costs are fixture values, with stopped answers reporting a proportional value for the revealed text. This is a comparison interaction demo, not a live model evaluation.

Each pane independently selects its model, regenerates, rates, retries, sorts and exports its answer. Desktop views resize using the genuine foundation separator and can synchronize their relative scroll position. The phone view uses the genuine Tabs implementation, retaining both sessions when changing tabs. A shared prompt starts both local playbacks; stopping keeps each partial answer. Source view, clipboard, source-file download and the complete starter ZIP expose the same authored modules.

## Verification scope

Permanent tests cover original-fixture invariants, separate models and regeneration, keyboard and pointer resizing, locked/unlocked scrolling, numeric table sorting, answer ratings and A/B preference, clipboard content, phone tab keyboard behavior, stopped streams, model-local simulated retry, quoted follow-ups, file metadata, transcript download, responsive inset framing and eight foundation styles. Source-export tests compare the default leaf and selected modules byte for byte through source view, clipboard, file download and both complete starter archives, including transitive imports and licenses.

The preparatory layout oracle was deliberately changed from its old proprietary-reference geometry to Bricklane's independent geometry. All behavioral checks remain. Runtime results and representative standalone starter builds are recorded in the coordinator's milestone evidence.

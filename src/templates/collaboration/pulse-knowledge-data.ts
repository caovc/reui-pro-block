// Independently written demo runbooks. Reference: https://pulse-helpdesk.reui.io/knowledge-base
// No original article prose or paid media is distributed with these fixtures.
export type KnowledgeArticle = {
  id: string;
  title: string;
  summary: string;
  sections: [string, string][];
  attachment?: string;
};
export const knowledgeCategories = [
  {
    title: "Billing",
    description: "Invoices, refunds, plan changes and everything finance asks about.",
    color: "#008bcb",
    icon: "billing",
    articles: [
      {
        id: "kb-refund",
        title: "How refunds are processed",
        summary:
          "Check the original payment and approval limit before promising a refund. Bank processing starts after the refund has been issued.",
        sections: [
          [
            "How the timing works",
            "Locate the settled transaction and confirm its refundable amount. Record the reason on the ticket, submit the refund and share the payment reference with the customer. A pending bank transfer is not a second refund request.",
          ],
          [
            "Refunds above your limit",
            "Send the transaction, amount and reason to the billing approver. Keep the ticket assigned to its owner while approval is pending. Once authorised, issue the refund against the original payment and add the approval reference to the ticket.",
          ],
          [
            "Expired and replaced cards",
            "Refund to the original payment method. Card issuers normally route the credit to a replacement card. If the bank rejects it, ask Billing to investigate before offering an alternative payment route.",
          ],
        ],
        attachment: "Refund approval matrix",
      },
      {
        id: "kb-invoice-wrong",
        title: "The invoice total looks wrong after a plan change",
        summary:
          "Mid-cycle plan changes may produce both a credit for unused service and a charge for the remaining period.",
        sections: [
          [
            "Compare the billing periods",
            "Open the invoice lines and compare their service dates with the plan change timestamp. Check the billing interval, currency and quantity before treating the difference as an error.",
          ],
          [
            "Explain prorated adjustments",
            "Separate the unused-service credit from the new-plan charge. Show both dates and amounts to the customer so that the net adjustment is easy to reconcile.",
          ],
          [
            "Correct an invoice",
            "If the dates or quantities are wrong, attach the invoice number and account history to a Billing escalation. Do not edit a settled invoice or promise a credit before the correction is approved.",
          ],
        ],
      },
      {
        id: "kb-card-declined",
        title: "What to do when a card is declined",
        summary:
          "A decline can come from the issuer, an expired card or an authentication step. Never request a full card number in a ticket.",
        sections: [
          [
            "Read the decline reason",
            "Check the latest payment attempt and note its safe-to-share decline code. Confirm the billing address and expiry date through the secure billing page.",
          ],
          [
            "Retry safely",
            "Ask the customer to complete any bank authentication or choose another payment method. Retry once after a relevant detail changes; repeated unchanged attempts may trigger issuer controls.",
          ],
          [
            "When to escalate",
            "Escalate unexplained recurring declines with the account ID, payment reference and timestamp. Keep sensitive card details out of notes and attachments.",
          ],
        ],
      },
    ],
  },
  {
    title: "Technical",
    description: "Product faults, outages and the checks to run before escalating.",
    color: "#8520f5",
    icon: "technical",
    articles: [
      {
        id: "kb-export-failed",
        title: "When a data export fails",
        summary: "Identify the failed job and its scope before rerunning a large export.",
        sections: [
          [
            "Collect the job details",
            "Record the job ID, requested date range, file format and failure time. Confirm that the requesting user can access the records included in the export.",
          ],
          [
            "Check limits and filters",
            "Test a smaller date range and remove optional filters. Compare the result with the original job to distinguish a data issue from a size or timeout limit.",
          ],
          [
            "Escalate with evidence",
            "Attach the job reference and a redacted error message. Avoid attaching customer records; give Engineering a reproducible query and permission to inspect the affected workspace.",
          ],
        ],
      },
      {
        id: "kb-webhook-retries",
        title: "Why webhook retries stop",
        summary:
          "Delivery retries have a finite window. Repair the receiving endpoint before replaying failed events.",
        sections: [
          [
            "Inspect recent deliveries",
            "Compare response codes, response times and the last successful delivery. A signature failure and an endpoint timeout need different fixes.",
          ],
          [
            "Restore the endpoint",
            "Confirm that the receiver accepts the event type, uses the current signing secret and returns a success response quickly. Move expensive work into a background job.",
          ],
          [
            "Replay missing events",
            "Replay only the required event IDs after the endpoint is healthy. Use idempotency keys so previously processed events do not create duplicate changes.",
          ],
        ],
      },
      {
        id: "kb-push-notifications",
        title: "Push notifications stopped arriving",
        summary:
          "Check delivery settings on the workspace and the device before escalating a notification outage.",
        sections: [
          [
            "Check notification preferences",
            "Confirm the user is subscribed to the relevant queue and event. Check quiet hours and whether the notification was delivered through another enabled channel.",
          ],
          [
            "Check the device",
            "Ask the user to verify browser or system notification permission. Reopen the application and test with a newly created event rather than an old notification.",
          ],
          [
            "Send a delivery trace",
            "If the test still fails, record the event ID, device type and timestamp. Escalate a redacted delivery trace without including private message contents.",
          ],
        ],
      },
    ],
  },
  {
    title: "Onboarding",
    description: "Setup, imports and migrations for a customer's first weeks.",
    color: "#e47a00",
    icon: "onboarding",
    articles: [
      {
        id: "kb-bulk-import",
        title: "Mapping columns for a bulk import",
        summary:
          "Map a small sample first so required fields and duplicate identities can be checked before importing the full file.",
        sections: [
          [
            "Prepare a CSV",
            "Use a header row with one person per record. Keep dates in a consistent format and quote values containing commas. Remove columns that are not needed for onboarding.",
          ],
          [
            "Map and preview",
            "Match source headers to destination fields. Verify every required field and inspect the preview for shifted columns, invalid dates and empty names.",
          ],
          [
            "Resolve duplicates",
            "Choose an existing unique identifier such as employee ID or email. Review matches before applying an update, and download the import summary for the account record.",
          ],
        ],
      },
      {
        id: "kb-migration-window",
        title: "Booking a migration window",
        summary:
          "Agree a clear migration window with a named owner, validation plan and rollback decision.",
        sections: [
          [
            "Scope the move",
            "List the source systems, record counts and integrations that will be affected. Agree which changes must pause while data is being copied.",
          ],
          [
            "Reserve coverage",
            "Confirm the customer's timezone and reserve both a migration operator and a support contact. Avoid assigning the migration operator to a live support queue for the same period.",
          ],
          [
            "Validate and close",
            "Compare counts, sample records and permissions before reopening writes. Record the result and make the rollback decision before the agreed cut-off.",
          ],
        ],
      },
      {
        id: "kb-go-live",
        title: "Setting up a new workspace: the go-live checklist",
        summary:
          "A workspace is ready when access, routing and the first customer interaction have been tested together.",
        sections: [
          [
            "Prepare access",
            "Invite the administrators, confirm their roles and test sign-in. Review seat counts and remove unused invitations before handing over the workspace.",
          ],
          [
            "Test the support routes",
            "Send a test email and portal request. Verify queue assignment, business hours, response targets and who receives the resulting notification.",
          ],
          [
            "Handover",
            "Share the runbook and escalation contacts, record outstanding issues and agree who owns each one. Confirm that a customer can submit and follow up on a real request.",
          ],
        ],
      },
    ],
  },
  {
    title: "Account",
    description: "Access, seats, roles and who is allowed to do what.",
    color: "#009d70",
    icon: "account",
    articles: [
      {
        id: "kb-sso-lockout",
        title: "Admins locked out after an SSO change",
        summary:
          "Use a verified recovery contact and keep the previous identity-provider configuration available during an SSO change.",
        sections: [
          [
            "Verify the administrator",
            "Follow the account recovery process using an existing verified contact. Do not disable SSO based only on an inbound email or a screenshot.",
          ],
          [
            "Check the configuration",
            "Compare the entity ID, callback URL, signing certificate and assigned application groups with the last working configuration.",
          ],
          [
            "Restore access",
            "Use an approved recovery session to correct the configuration. Test with a second administrator and document the change before ending the session.",
          ],
        ],
      },
      {
        id: "kb-seat-changes",
        title: "Adding and removing seats, and what changes on the invoice",
        summary:
          "Seat changes affect access immediately, while the billing adjustment depends on the plan and billing interval.",
        sections: [
          [
            "Check the seat count",
            "Compare active users and outstanding invitations with the purchased quantity. Confirm the requester has permission to change the subscription.",
          ],
          [
            "Change access",
            "When removing a user, transfer owned records and revoke active sessions. Adding a seat does not automatically grant an administrator role.",
          ],
          [
            "Explain the bill",
            "Review the upcoming invoice preview before confirming an adjustment. Separate any prorated charge from the recurring price for the next billing period.",
          ],
        ],
      },
      {
        id: "kb-ticket-visibility",
        title: "Who can see a customer's ticket history",
        summary:
          "Ticket access follows the user's role, queue membership and account association. An email domain alone does not establish access.",
        sections: [
          [
            "Check the viewer",
            "Identify the signed-in person and their account association. Compare their role with the ticket's queue and any restricted conversation settings.",
          ],
          [
            "Review account sharing",
            "Confirm that account-wide sharing is enabled before exposing another person's tickets. Keep internal notes separate from customer-visible replies.",
          ],
          [
            "Correct unexpected access",
            "Remove incorrect account associations or role assignments. Log the affected ticket IDs and escalate any suspected data disclosure through the security process.",
          ],
        ],
      },
    ],
  },
  {
    title: "Security & Privacy",
    description: "Data handling, access reviews and what we may tell a caller.",
    color: "#eb004b",
    icon: "security",
    articles: [
      {
        id: "kb-two-factor",
        title: "Turning on two-factor authentication",
        summary:
          "Enroll a trusted authenticator and save recovery codes before enforcing two-factor authentication for the team.",
        sections: [
          [
            "Enroll a second factor",
            "Open account security, scan the setup code in a trusted authenticator and enter a fresh verification code. Never share the setup secret in a support ticket.",
          ],
          [
            "Store recovery codes",
            "Save the one-time recovery codes in an approved password manager. Confirm that they are accessible from a second device before signing out.",
          ],
          [
            "Enforce for the team",
            "Notify members of the enrollment deadline and check completion. Use verified recovery procedures for lost devices rather than bypassing the requirement.",
          ],
        ],
      },
      {
        id: "kb-access-review",
        title: "Running an access review on the Team page",
        summary:
          "Review roles and activity together so dormant accounts and unnecessary elevated access are removed.",
        sections: [
          [
            "Build the review list",
            "Open Team and include inactive members as well as active users. Record the reviewer, review date and workspace covered by the review.",
          ],
          [
            "Confirm each role",
            "Ask the relevant owner to confirm the member's continuing need for access. Check administrator roles, queue assignments and pending invitations individually.",
          ],
          [
            "Apply the decisions",
            "Deactivate accounts or reduce permissions as approved. Transfer owned work first and retain a record of decisions for the next review.",
          ],
        ],
      },
      {
        id: "kb-caller-verification",
        title: "Verifying who you are talking to on a call or a chat",
        summary:
          "Verify identity through an existing trusted channel before discussing account-specific information or changing access.",
        sections: [
          [
            "Establish identity",
            "Ask for non-sensitive identifying details and match them to the account record. Caller ID, display names and urgency do not prove identity.",
          ],
          [
            "Use a trusted channel",
            "Send a verification request to an existing verified contact method. Do not replace that method during the same unverified conversation.",
          ],
          [
            "Handle a failed check",
            "Explain that account changes require verification and keep the conversation limited to public guidance. Escalate suspicious requests with a factual internal note.",
          ],
        ],
      },
    ],
  },
  {
    title: "Integrations",
    description: "Connecting Pulse to the other tools a customer already runs.",
    color: "#5538ff",
    icon: "integrations",
    articles: [
      {
        id: "kb-api-key-rotation",
        title: "Rotating an API key without downtime",
        summary:
          "Run the new key alongside the old key long enough to verify every integration before revoking the original.",
        sections: [
          [
            "Inventory consumers",
            "List the services and scheduled jobs using the current key. Create a replacement with only the permissions each integration needs.",
          ],
          [
            "Deploy the replacement",
            "Update secrets in the approved secret store and redeploy consumers. Test a read and a permitted write operation, then watch for authentication errors.",
          ],
          [
            "Revoke the old key",
            "After all consumers use the replacement, revoke the original and check scheduled jobs again. Record the owner and next rotation date without storing the secret itself.",
          ],
        ],
      },
      {
        id: "kb-support-mailbox",
        title: "Connecting a support mailbox",
        summary:
          "Connect a dedicated mailbox, verify forwarding and test both incoming messages and outgoing replies.",
        sections: [
          [
            "Connect the account",
            "Use a dedicated support address and an authorised mailbox administrator. Complete the provider's permission flow rather than sharing a personal password.",
          ],
          [
            "Configure routing",
            "Set the default queue and sender identity. Check domain authentication and prevent forwarding loops between the mailbox and the help desk.",
          ],
          [
            "Send a round-trip test",
            "Send a new external message, reply from the ticket and verify the conversation stays on one thread. Check attachments and bounce handling before announcing the address.",
          ],
        ],
      },
      {
        id: "kb-support-portal",
        title: "Setting up the support portal and the chat widget",
        summary:
          "Publish the customer entry points with the correct branding, routing and privacy notice, then test from a signed-out browser.",
        sections: [
          [
            "Configure the portal",
            "Set the public address, approved domains and visible knowledge content. Review which fields a customer must provide to create a request.",
          ],
          [
            "Install the widget",
            "Add the widget to the intended site and configure its support queue and business hours. Restrict allowed origins and avoid sending unnecessary personal data.",
          ],
          [
            "Test the customer journey",
            "Create a ticket from the portal and a chat from the website. Verify confirmation messages, assignment and how the customer returns to the conversation.",
          ],
        ],
      },
    ],
  },
] satisfies {
  title: string;
  description: string;
  color: string;
  icon: string;
  articles: KnowledgeArticle[];
}[];

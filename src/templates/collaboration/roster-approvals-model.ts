import { useState } from "react";
export type ApprovalDecision = "Pending" | "Approved" | "Rejected";
export type ApprovalRequest = {
  id: string;
  title: string;
  description: string;
  type: string;
  requester: string;
  department: string;
  approver: string;
  waiting: number;
  date: string;
  decision: ApprovalDecision;
};
const requestFixtures = [
  [
    "Campaign shoot: £4,200",
    "Over the £1,000 threshold, agency invoice",
    "Expense",
    "Aisha Rahman",
    "Marketing",
    "Finance",
    "14",
    "16 Jul",
  ],
  [
    "Right to work renewal",
    "Visa expires 30 Sep, blocks payroll if it lapses",
    "Profile change",
    "Hannah Weber",
    "Product",
    "HR admin",
    "13",
    "17 Jul",
  ],
  [
    "Promotion to Staff Engineer",
    "Level change, effective 1 Sep",
    "Compensation",
    "Amara Okafor",
    "Engineering",
    "HR admin",
    "13",
    "17 Jul",
  ],
  [
    "Offer sign-off: Account Executive",
    "Candidate holds a competing offer",
    "Offer",
    "Bruno Duarte",
    "People",
    "Department head",
    "12",
    "18 Jul",
  ],
  [
    "Developer tooling renewal: £3,600",
    "Annual licence, over the £1,000 threshold",
    "Expense",
    "Daniel Reyes",
    "Engineering",
    "Finance",
    "11",
    "19 Jul",
  ],
  [
    "Address change",
    "Moves them into a new tax jurisdiction",
    "Profile change",
    "Yuki Tanaka",
    "Sales",
    "HR admin",
    "10",
    "20 Jul",
  ],
  [
    "Probation completion: salary review",
    "Confirmed in role on 1 Aug",
    "Compensation",
    "Mei Chen",
    "Engineering",
    "HR admin",
    "10",
    "20 Jul",
  ],
  [
    "Offer sign-off: Product Manager",
    "Above band midpoint",
    "Offer",
    "Omar Haddad",
    "People",
    "Department head",
    "9",
    "21 Jul",
  ],
  [
    "Onsite support visit: £2,310",
    "Over £1,000 threshold, flights and hotel",
    "Expense",
    "Grace Adeyemi",
    "Customer Success",
    "Finance",
    "8",
    "22 Jul",
  ],
  [
    "Client dinner: £1,420",
    "Over £1,000 threshold, six attendees",
    "Expense",
    "Elena Petrova",
    "Sales",
    "Finance",
    "7",
    "23 Jul",
  ],
  [
    "5 days unpaid leave",
    "14–18 Sep, unpaid with no balance impact",
    "Leave",
    "Rafael Costa",
    "Finance",
    "Manager",
    "6",
    "24 Jul",
  ],
  [
    "Offer sign-off: Senior Engineer",
    "Second offer on this opening, start date not yet agreed",
    "Offer",
    "Amara Okafor",
    "Engineering",
    "Department head",
    "6",
    "24 Jul",
  ],
  [
    "Legal name change",
    "Deed poll attached",
    "Profile change",
    "Lucas Moreau",
    "Marketing",
    "HR admin",
    "5",
    "25 Jul",
  ],
  [
    "Off-cycle salary adjustment",
    "Band midpoint correction",
    "Compensation",
    "Sofia Lindqvist",
    "Design",
    "HR admin",
    "4",
    "26 Jul",
  ],
  [
    "5 days annual leave",
    "3–7 Aug, team at 80% cover",
    "Leave",
    "Marco Bianchi",
    "Product",
    "Manager",
    "4",
    "26 Jul",
  ],
  [
    "Offer sign-off: Senior Engineer",
    "At top of the band, relocating from Rotterdam",
    "Offer",
    "Amara Okafor",
    "Engineering",
    "Department head",
    "4",
    "26 Jul",
  ],
  [
    "Client travel: £1,240",
    "Over £1,000 threshold",
    "Expense",
    "James Whitfield",
    "Sales",
    "Finance",
    "3",
    "27 Jul",
  ],
  [
    "Offer sign-off: Senior Engineer",
    "Candidate deadline tomorrow",
    "Offer",
    "Omar Haddad",
    "People",
    "Department head",
    "2",
    "28 Jul",
  ],
  [
    "Bank details change",
    "Requires ID verification",
    "Profile change",
    "Tomás Silva",
    "Engineering",
    "HR admin",
    "1",
    "29 Jul",
  ],
  [
    "10 days annual leave",
    "10–21 Aug, balance covers it",
    "Leave",
    "Yuki Tanaka",
    "Sales",
    "Manager",
    "1",
    "29 Jul",
  ],
];
export function initialApprovalRequests(): ApprovalRequest[] {
  return requestFixtures.map(
    ([title, description, type, requester, department, approver, waiting, date], index) => ({
      id: `request-${index + 1}`,
      title,
      description,
      type,
      requester,
      department,
      approver,
      waiting: Number(waiting),
      date,
      decision: "Pending",
    }),
  );
}
export function useRosterApprovalsState() {
  const [requests, setRequests] = useState(initialApprovalRequests);
  const [status, setStatus] = useState("All");
  const [type, setType] = useState("All");
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const decide = (id: string, decision: ApprovalDecision) =>
    setRequests((items) =>
      items.map((request) => (request.id === id ? { ...request, decision } : request)),
    );
  return {
    requests,
    setRequests,
    status,
    setStatus,
    type,
    setType,
    search,
    setSearch,
    pagination,
    setPagination,
    decide,
  };
}
export type RosterApprovalsState = ReturnType<typeof useRosterApprovalsState>;

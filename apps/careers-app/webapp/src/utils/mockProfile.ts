// Copyright (c) 2025 WSO2 LLC. (https://www.wso2.com).
//
// WSO2 LLC. licenses this file to you under the Apache License,
// Version 2.0 (the "License"); you may not use this file except
// in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.

import { ApplicationStatus } from "@config/constant";
import { Application, CandidateProfile, OfferDecision, RequiredDocument, ResumeVersion } from "@/types/types";

// In-memory stand-in for the candidate endpoints, enabled with USE_MOCK_PROFILE.
// State lives for the lifetime of the page, so edits persist across navigation
// but reset on a full refresh.

const LATENCY_MS = 250;

// Resumes referenced by a submitted application cannot be deleted, mirroring
// the backend's behavior.
const RESUMES_IN_USE = new Set(["1"]);

let profile: CandidateProfile = {
  personId: "CAND-20417",
  firstName: "Alice",
  lastName: "Bob",
  email: "alice.bob@gmail.com",
  phone: "+94 77 555 0142",
  country: "Sri Lanka",
  address: "42 Lake Road, Colombo 05",
  university: "University of Moratuwa",
  linkedIn: "https://www.linkedin.com/in/example-alice-bob",
  github: "https://github.com/example-alice-bob",
  currentRole: "Software Engineer",
  yearsOfExperience: 4,
  skills: ["Ballerina", "Java", "TypeScript", "React", "PostgreSQL", "Kubernetes", "REST APIs"],
  preferredRoles: ["Senior Software Engineer", "Solutions Engineer"],
  preferredLocations: ["Colombo", "Remote"],
  summary:
    "Backend-leaning full-stack engineer with four years of experience building integration services and " +
    "internal web apps. Comfortable owning a feature from API design through deployment, and keen to work on " +
    "open-source identity and integration platforms.",
  resumes: [
    { id: "1", name: "Alice_Bob_Resume_2026.pdf", uploadedAt: "2026-08-14", isActive: true, url: "" },
    { id: "2", name: "Alice_Bob_Resume_Backend.pdf", uploadedAt: "2026-05-02", isActive: false, url: "" },
    { id: "3", name: "Alice_Bob_Resume_2025.pdf", uploadedAt: "2025-11-21", isActive: false, url: "" },
  ],
  portfolio: [
    {
      id: "p1",
      title: "ballerina-order-service",
      description: "REST service in Ballerina with PostgreSQL persistence, JWT auth, and a Helm chart for deployment.",
      url: "https://github.com/example-alice-bob/ballerina-order-service",
      type: "github",
    },
    {
      id: "p2",
      title: "campus-events-portal",
      description: "React and TypeScript portal for university club events, used by about 1,200 students.",
      url: "https://github.com/example-alice-bob/campus-events-portal",
      type: "github",
    },
    {
      id: "p3",
      title: "Building a resilient webhook consumer",
      description: "Blog post on retries, idempotency keys, and dead-letter handling.",
      url: "https://example.com/blog/resilient-webhook-consumer",
      type: "link",
    },
  ],
  completionPercentage: 0,
};

let nextResumeId = 4;

function completionOf(p: CandidateProfile): number {
  const checks = [
    p.firstName,
    p.lastName,
    p.email,
    p.phone,
    p.country,
    p.address,
    p.university,
    p.linkedIn,
    p.github,
    p.currentRole,
    p.yearsOfExperience > 0,
    p.summary,
    p.skills.length > 0,
    p.preferredRoles.length > 0,
    p.preferredLocations.length > 0,
    p.resumes.length > 0,
    p.portfolio.length > 0,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function snapshot(): CandidateProfile {
  profile = { ...profile, completionPercentage: completionOf(profile) };
  return structuredClone(profile);
}

const delay = () => new Promise<void>((resolve) => setTimeout(resolve, LATENCY_MS));

export async function fetchProfile(): Promise<CandidateProfile> {
  await delay();
  return snapshot();
}

export async function saveProfile(partial: Partial<CandidateProfile>): Promise<CandidateProfile> {
  await delay();
  profile = { ...profile, ...partial };
  return snapshot();
}

export async function uploadResume(file: File): Promise<CandidateProfile> {
  await delay();
  const resume: ResumeVersion = {
    id: String(nextResumeId++),
    name: file.name,
    uploadedAt: new Date().toISOString().slice(0, 10),
    isActive: profile.resumes.length === 0,
    url: "",
  };
  profile = { ...profile, resumes: [...profile.resumes, resume] };
  return snapshot();
}

export async function activateResume(resumeId: string): Promise<CandidateProfile> {
  await delay();
  profile = {
    ...profile,
    resumes: profile.resumes.map((r) => ({ ...r, isActive: r.id === resumeId })),
  };
  return snapshot();
}

export async function deleteResume(resumeId: string): Promise<CandidateProfile> {
  await delay();
  if (RESUMES_IN_USE.has(resumeId)) {
    throw new Error("Resume is referenced by an application");
  }
  const remaining = profile.resumes.filter((r) => r.id !== resumeId);
  // Deleting the active resume promotes the most recently uploaded remaining one.
  if (remaining.length > 0 && !remaining.some((r) => r.isActive)) {
    remaining[remaining.length - 1] = { ...remaining[remaining.length - 1], isActive: true };
  }
  profile = { ...profile, resumes: remaining };
  return snapshot();
}

export async function downloadResume(filename: string): Promise<Blob> {
  await delay();
  return new Blob([`Sample resume placeholder for ${filename}\n`], { type: "application/pdf" });
}

// The documents HR asks for once an offer is accepted; `uploadedIds` marks which are already on file.
const sampleDocuments = (uploadedIds: string[] = []): RequiredDocument[] =>
  [
    { id: "d1", name: "ID copy", description: "National ID card or passport (PDF or image)." },
    { id: "d2", name: "Education certificates", description: "Degree and other relevant certificates." },
    { id: "d3", name: "Previous employment letter", description: "Confirmation of service from your last employer." },
    { id: "d4", name: "Passport-size photo", description: "A recent photo with a plain background." },
  ].map((doc) => ({
    ...doc,
    uploadedFileName: uploadedIds.includes(doc.id) ? `${doc.name.replace(/ /g, "_")}.pdf` : null,
    uploadedAt: uploadedIds.includes(doc.id) ? "2026-09-27" : null,
  }));

const applications: Application[] = [
  {
    id: "a3",
    jobId: "226",
    jobTitle: "Senior Software Engineer - Identity",
    department: "ENGINEERING",
    appliedDate: "2026-09-10",
    status: ApplicationStatus.Interview,
    resumeVersionId: "2",
    notes: "Technical interviews are in progress.",
    timeline: [
      { stage: ApplicationStatus.Applied, date: "2026-09-10", note: "Application received." },
      { stage: ApplicationStatus.Screening, date: "2026-09-13", note: "Shortlisted for interviews." },
      { stage: ApplicationStatus.Interview, date: "2026-09-18", note: "Technical interviews arranged." },
    ],
    interviews: [
      {
        id: "i1",
        round: "Technical Interview 1",
        dateTime: "2026-09-22T10:30:00",
        mode: "Video",
        location: "https://meet.example.com/technical-1",
        status: "Completed",
      },
      {
        id: "i2",
        round: "Technical Interview 2 - System Design",
        dateTime: "2026-10-03T14:00:00",
        mode: "Video",
        location: "https://meet.example.com/technical-2",
        status: "Upcoming",
      },
    ],
    offer: null,
  },
  {
    id: "a4",
    jobId: "219",
    jobTitle: "Solutions Architect",
    department: "SALES ENGINEERING",
    appliedDate: "2026-08-30",
    status: ApplicationStatus.Offer,
    resumeVersionId: "1",
    notes: "Congratulations! You have been selected for this position.",
    timeline: [
      { stage: ApplicationStatus.Applied, date: "2026-08-30", note: "Application received." },
      { stage: ApplicationStatus.Screening, date: "2026-09-02", note: "Shortlisted for interviews." },
      { stage: ApplicationStatus.Interview, date: "2026-09-08", note: "Interviews completed." },
      { stage: ApplicationStatus.Offer, date: "2026-09-25", note: "Offer letter issued." },
    ],
    interviews: [
      {
        id: "i1",
        round: "Technical Interview",
        dateTime: "2026-09-08T11:00:00",
        mode: "Video",
        location: "https://meet.example.com/technical",
        status: "Completed",
      },
      {
        id: "i2",
        round: "Final Interview with the Regional Head",
        dateTime: "2026-09-16T15:00:00",
        mode: "Onsite",
        location: "Colombo office, Level 20",
        status: "Completed",
      },
    ],
    offer: { position: "Solutions Architect", issuedDate: "2026-09-25", expiryDate: "2026-10-09", decision: "Pending" },
    requiredDocuments: sampleDocuments(),
    documentsSubmitted: false,
  },
  {
    id: "a5",
    jobId: "208",
    jobTitle: "Associate Technical Writer",
    department: "MARKETING",
    appliedDate: "2026-08-15",
    status: ApplicationStatus.Rejected,
    resumeVersionId: "3",
    notes: "We have decided to move forward with other candidates. We will keep your profile for future openings.",
    timeline: [
      { stage: ApplicationStatus.Applied, date: "2026-08-15", note: "Application received." },
      { stage: ApplicationStatus.Screening, date: "2026-08-19", note: "Your profile is being reviewed by the hiring team." },
      { stage: ApplicationStatus.Rejected, date: "2026-08-26", note: "Not selected for this position." },
    ],
    interviews: [],
    offer: null,
  },
  {
    id: "a7",
    jobId: "215",
    jobTitle: "Senior Solutions Engineer",
    department: "SALES ENGINEERING",
    appliedDate: "2026-09-01",
    status: ApplicationStatus.Offer,
    resumeVersionId: "1",
    notes: "Congratulations! You have been selected for this position.",
    timeline: [
      { stage: ApplicationStatus.Applied, date: "2026-09-01", note: "Application received." },
      { stage: ApplicationStatus.Screening, date: "2026-09-04", note: "Shortlisted for interviews." },
      { stage: ApplicationStatus.Interview, date: "2026-09-10", note: "Interviews completed." },
      { stage: ApplicationStatus.Offer, date: "2026-09-27", note: "Offer letter issued." },
    ],
    interviews: [
      {
        id: "i1",
        round: "Technical Interview",
        dateTime: "2026-09-10T16:00:00",
        mode: "Video",
        location: "https://meet.example.com/solutions-engineer",
        status: "Completed",
      },
    ],
    offer: { position: "Senior Solutions Engineer", issuedDate: "2026-09-27", expiryDate: "2026-10-11", decision: "Pending" },
    requiredDocuments: sampleDocuments(),
    documentsSubmitted: false,
  },
];

export async function fetchApplications(): Promise<Application[]> {
  await delay();
  return structuredClone(applications);
}

const today = () => new Date().toISOString().slice(0, 10);

function findApplication(applicationId: string): Application {
  const application = applications.find((a) => a.id === applicationId);
  if (!application) throw new Error("Application not found");
  return application;
}

export async function respondToOffer(
  applicationId: string,
  decision: Exclude<OfferDecision, "Pending">,
): Promise<Application> {
  await delay();
  const application = findApplication(applicationId);
  if (!application.offer || application.offer.decision !== "Pending") {
    throw new Error("There is no pending offer to respond to");
  }
  if (decision === "Accepted" && applications.some((a) => a.id !== applicationId && a.status === ApplicationStatus.OfferAccepted)) {
    throw new Error("You have already accepted an offer, so you can't accept another one.");
  }
  application.offer.decision = decision;
  application.status = decision === "Accepted" ? ApplicationStatus.OfferAccepted : ApplicationStatus.OfferDeclined;
  application.timeline = [
    ...(application.timeline ?? []),
    {
      stage: application.status,
      date: today(),
      note: decision === "Accepted" ? "You accepted the offer." : "You declined the offer.",
    },
  ];
  return structuredClone(application);
}

export async function uploadApplicationDocument(
  applicationId: string,
  documentId: string,
  file: File,
): Promise<Application> {
  await delay();
  const application = findApplication(applicationId);
  if (application.documentsSubmitted) throw new Error("Documents have already been submitted");
  const document = application.requiredDocuments?.find((d) => d.id === documentId);
  if (!document) throw new Error("Document not found");
  document.uploadedFileName = file.name;
  document.uploadedAt = today();
  return structuredClone(application);
}

export async function submitApplicationDocuments(applicationId: string): Promise<Application> {
  await delay();
  const application = findApplication(applicationId);
  if (application.status !== ApplicationStatus.OfferAccepted) {
    throw new Error("Documents can only be submitted after accepting the offer");
  }
  if (application.requiredDocuments?.some((d) => !d.uploadedFileName)) {
    throw new Error("Upload every required document first");
  }
  application.documentsSubmitted = true;
  application.timeline = [
    ...(application.timeline ?? []),
    { stage: application.status, date: today(), note: "Documents submitted." },
  ];
  return structuredClone(application);
}

// A guest's submission is accepted and forgotten: with no account there is no list to show it in.
export async function submitGuestApplication(): Promise<void> {
  await delay();
}

let nextApplicationId = 100;

export async function submitApplication(
  jobId: string,
  resumeId: string,
  job: { jobTitle: string; department: string },
): Promise<Application> {
  await delay();
  if (applications.some((a) => a.jobId === jobId)) {
    throw new Error("You have already applied for this position");
  }
  if (applications.some((a) => a.status === ApplicationStatus.OfferAccepted)) {
    throw new Error("You have accepted an offer, so you can't apply for other positions");
  }
  const application: Application = {
    id: `a${nextApplicationId++}`,
    jobId,
    jobTitle: job.jobTitle,
    department: job.department,
    appliedDate: today(),
    status: ApplicationStatus.Applied,
    resumeVersionId: resumeId,
    notes: "",
    timeline: [{ stage: ApplicationStatus.Applied, date: today(), note: "Application received." }],
    interviews: [],
    offer: null,
  };
  applications.unshift(application);
  return structuredClone(application);
}

export async function downloadOfferLetter(position: string): Promise<Blob> {
  await delay();
  return new Blob([`Sample offer letter placeholder for ${position}\n`], { type: "application/pdf" });
}

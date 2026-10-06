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

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  LinearProgress,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { AssignmentOutlined } from "@mui/icons-material";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Check,
  Download,
  ExternalLink,
  FileText,
  Info,
  MapPin,
  PartyPopper,
  Phone,
  Upload,
  Video,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useAuthContext } from "@asgardeo/auth-react";

import ApplicationStatusBadge from "@component/careers/ApplicationStatusBadge";
import { ApplicationStatus, SnackMessage } from "@config/constant";
import {
  loadApplications,
  respondToOffer,
  submitApplicationDocuments,
  uploadApplicationDocument,
} from "@slices/careersSlice/careers";
import { enqueueSnackbarMessage } from "@slices/commonSlice/common";
import { RootState, useAppDispatch, useAppSelector } from "@slices/store";
import { Application, ApplicationInterview, OfferDecision, State } from "@/types/types";
import { downloadOfferLetter } from "@utils/profileService";

const STAGES = ["Applied", "Screening", "Interview", "Offer", "Documents"];

const STAGE_INDEX: Partial<Record<ApplicationStatus, number>> = {
  [ApplicationStatus.Applied]: 0,
  [ApplicationStatus.Screening]: 1,
  [ApplicationStatus.Interview]: 2,
  [ApplicationStatus.Offer]: 3,
  [ApplicationStatus.OfferDeclined]: 3,
  [ApplicationStatus.OfferAccepted]: 4,
};

const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;
const ACCEPTED_DOCUMENT_TYPES = ["application/pdf", "image/jpeg", "image/png"];

type Decision = Exclude<OfferDecision, "Pending">;

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

// Rejected applications stop at the last stage they reached; a declined offer stops at the offer.
function trackerOf(application: Application): { activeStep: number; errorStep: number | null } {
  if (application.status === ApplicationStatus.Rejected) {
    const reached = Math.max(0, ...(application.timeline ?? []).map((event) => STAGE_INDEX[event.stage] ?? 0));
    return { activeStep: reached, errorStep: reached };
  }
  if (application.status === ApplicationStatus.OfferDeclined) return { activeStep: 3, errorStep: 3 };
  if (application.status === ApplicationStatus.OfferAccepted) {
    return { activeStep: application.documentsSubmitted ? STAGES.length : 4, errorStep: null };
  }
  return { activeStep: STAGE_INDEX[application.status] ?? 0, errorStep: null };
}

const needsAction = (application: Application) =>
  (application.status === ApplicationStatus.Offer && application.offer?.decision === "Pending") ||
  (application.status === ApplicationStatus.OfferAccepted && !application.documentsSubmitted);

const isSelected = (application: Application) =>
  [ApplicationStatus.Offer, ApplicationStatus.OfferAccepted, ApplicationStatus.OfferDeclined].includes(application.status);

type ApplicationTab = "active" | "offers" | "closed";

// What the list is narrowed to; "all" is the default and shows every application.
type ApplicationFilter = "all" | ApplicationTab;

// Which tab of the list an application belongs under.
const tabOf = (application: Application): ApplicationTab => {
  switch (application.status) {
    case ApplicationStatus.Offer:
    case ApplicationStatus.OfferAccepted:
      return "offers";
    case ApplicationStatus.Rejected:
    case ApplicationStatus.OfferDeclined:
      return "closed";
    default:
      return "active";
  }
};

// "today", "yesterday", "3 days ago", "last week" ... for the "Updated ..." line on a card.
const timeAgo = (value: string) => {
  const days = Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 14) return "last week";
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 60) return "last month";
  return `${Math.floor(days / 30)} months ago`;
};

// The one-line "what happens next" summary shown at the top of an application's details.
function nextStepOf(application: Application): string {
  const documents = application.requiredDocuments ?? [];
  switch (application.status) {
    case ApplicationStatus.Applied:
      return "Waiting for the hiring team to review your application";
    case ApplicationStatus.Screening:
      return "Your profile is being reviewed";
    case ApplicationStatus.Interview: {
      const upcoming = (application.interviews ?? []).find((interview) => interview.status === "Upcoming");
      return upcoming
        ? `Next: ${upcoming.round} · ${formatDateTime(upcoming.dateTime)}`
        : "Waiting for the interview outcome";
    }
    case ApplicationStatus.Offer:
      return application.offer?.decision === "Pending"
        ? `Respond to the offer by ${formatDate(application.offer.expiryDate)}`
        : "Offer under way";
    case ApplicationStatus.OfferAccepted:
      return application.documentsSubmitted
        ? "Documents received — HR will be in touch"
        : `Upload your documents (${documents.filter((doc) => doc.uploadedFileName).length} of ${documents.length})`;
    case ApplicationStatus.OfferDeclined:
      return "You declined this offer";
    case ApplicationStatus.Rejected:
      return "Not selected for this position";
    default:
      return "";
  }
}

const interviewChip: Record<ApplicationInterview["status"], { color: string; bg: string }> = {
  Upcoming: { color: "#ff6700", bg: "#ff670015" },
  Completed: { color: "#059669", bg: "rgba(5,150,105,0.14)" },
  Cancelled: { color: "#6B7280", bg: "rgba(107,114,128,0.16)" },
};

const interviewIcon = { Video, Phone, Onsite: MapPin };

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <Typography fontSize="0.8rem" fontWeight={700} letterSpacing="0.08em" color="text.secondary" mb={1.25}>
    {children}
  </Typography>
);

interface ApplicationDetailsProps {
  application: Application;
  uploadingKey: string | null;
  submittingDocumentsId: string | null;
  // Title of the job whose offer the candidate has already accepted, when it isn't this application.
  acceptedElsewhere: string | null;
  // Whether the vacancy is still listed; a closed vacancy has no page to open.
  jobOpen: boolean;
  onOpenJob: (jobId: string) => void;
  onDownloadOffer: (application: Application) => void;
  onRespond: (application: Application, decision: Decision) => void;
  onPickDocument: (application: Application, documentId: string) => void;
  onSubmitDocuments: (application: Application) => void;
}

const ApplicationDetails = ({
  application,
  uploadingKey,
  submittingDocumentsId,
  acceptedElsewhere,
  jobOpen,
  onOpenJob,
  onDownloadOffer,
  onRespond,
  onPickDocument,
  onSubmitDocuments,
}: ApplicationDetailsProps) => {
  const actionNeeded = needsAction(application);
  const { activeStep, errorStep } = trackerOf(application);

  const interviews = application.interviews ?? [];
  const documents = application.requiredDocuments ?? [];
  const uploadedCount = documents.filter((doc) => doc.uploadedFileName).length;
  const offer = application.offer;
  const offerExpired = !!offer && new Date(offer.expiryDate).getTime() + 24 * 60 * 60 * 1000 < Date.now();

  return (
    <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: "8px" }}>
      <Box sx={{ p: 3 }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" flexWrap="wrap" gap={1.5}>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              component="h1"
              sx={{ fontSize: { xs: "1.5rem", md: "1.9rem" }, lineHeight: 1.3, fontWeight: 400, color: "text.primary" }}
            >
              {application.jobTitle}
            </Typography>
            <Typography fontSize="0.9rem" color="text.secondary" mt={0.5}>
              {application.department} · Applied on {formatDate(application.appliedDate)}
            </Typography>
          </Box>
          <ApplicationStatusBadge status={application.status} />
        </Stack>
        <Typography
          fontSize="0.95rem"
          fontWeight={actionNeeded ? 700 : 500}
          sx={{ mt: 1.5, color: actionNeeded ? "#ff6700" : "text.secondary" }}
        >
          {nextStepOf(application)}
        </Typography>
      </Box>

        <CardContent sx={{ pt: 3, px: 3, pb: 3, borderTop: "1px solid", borderColor: "divider" }}>
          <Stepper
            alternativeLabel
            activeStep={activeStep}
            sx={{
              mb: 3,
              "& .MuiStepIcon-root": { color: "divider" },
              "& .MuiStepIcon-root.Mui-active, & .MuiStepIcon-root.Mui-completed": { color: "#ff6700" },
              "& .MuiStepIcon-root.Mui-error": { color: "#EF4444" },
              "& .MuiStepLabel-label": { fontSize: "0.85rem" },
              "& .MuiStepConnector-root.Mui-active .MuiStepConnector-line, & .MuiStepConnector-root.Mui-completed .MuiStepConnector-line":
                { borderColor: "#ff6700" },
            }}
          >
            {STAGES.map((label, index) => (
              <Step key={label}>
                <StepLabel error={index === errorStep}>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {isSelected(application) && (
            <Stack
              direction="row"
              gap={1.5}
              alignItems="flex-start"
              sx={{ p: 2, mb: 3, borderRadius: "10px", backgroundColor: "rgba(5,150,105,0.12)", border: "1px solid #05966930" }}
            >
              <Award size={20} color="#059669" />
              <Box>
                <Typography fontWeight={700} fontSize="0.95rem" color="text.primary">
                  Congratulations - you have been selected for this position.
                </Typography>
                {application.notes && (
                  <Typography fontSize="0.9rem" color="text.primary">
                    {application.notes}
                  </Typography>
                )}
              </Box>
            </Stack>
          )}

          {application.status === ApplicationStatus.Rejected && (
            <Stack
              direction="row"
              gap={1.5}
              alignItems="flex-start"
              sx={{ p: 2, mb: 3, borderRadius: "10px", backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid #EF444430" }}
            >
              <Info size={20} color="#DC2626" />
              <Box>
                <Typography fontWeight={700} fontSize="0.95rem" color="text.primary">
                  You were not selected this time.
                </Typography>
                {application.notes && (
                  <Typography fontSize="0.9rem" color="text.primary">
                    {application.notes}
                  </Typography>
                )}
              </Box>
            </Stack>
          )}

          {interviews.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <SectionTitle>INTERVIEWS</SectionTitle>
              <Stack gap={1.25}>
                {interviews.map((interview) => {
                  const Icon = interviewIcon[interview.mode];
                  const chip = interviewChip[interview.status];
                  const isLink = interview.mode === "Video" && /^https?:\/\//i.test(interview.location);
                  return (
                    <Box
                      key={interview.id}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: 1,
                        p: 2,
                        borderRadius: "10px",
                        border: "1px solid",
                        borderColor: "divider",
                      }}
                    >
                      <Stack direction="row" gap={1.5} alignItems="center">
                        <Box sx={{ color: "#ff6700", display: "flex" }}>
                          <Icon size={18} />
                        </Box>
                        <Box>
                          <Typography fontWeight={600} fontSize="0.95rem">
                            {interview.round}
                          </Typography>
                          <Typography fontSize="0.85rem" color="text.secondary">
                            {formatDateTime(interview.dateTime)} · {interview.mode}
                            {!isLink && ` · ${interview.location}`}
                          </Typography>
                        </Box>
                      </Stack>
                      <Stack direction="row" alignItems="center" gap={1}>
                        {isLink && interview.status === "Upcoming" && (
                          <Button
                            size="small"
                            component="a"
                            href={interview.location}
                            target="_blank"
                            rel="noreferrer"
                            endIcon={<ExternalLink size={13} />}
                            sx={{ fontWeight: 600 }}
                          >
                            Join meeting
                          </Button>
                        )}
                        <Chip
                          label={interview.status}
                          size="small"
                          sx={{ fontWeight: 600, fontSize: "11px", color: chip.color, backgroundColor: chip.bg }}
                        />
                      </Stack>
                    </Box>
                  );
                })}
              </Stack>
            </Box>
          )}

          {offer && (
            <Box sx={{ mb: 3 }}>
              <SectionTitle>OFFER LETTER</SectionTitle>
              <Box sx={{ p: 2.5, borderRadius: "10px", border: "1px solid #ff670040", backgroundColor: "#ff670008" }}>
                <Stack direction="row" flexWrap="wrap" gap={{ xs: 2, md: 5 }} mb={2}>
                  {[
                    { label: "POSITION", value: offer.position },
                    { label: "ISSUED", value: formatDate(offer.issuedDate) },
                    { label: "VALID UNTIL", value: formatDate(offer.expiryDate) },
                  ].map((item) => (
                    <Box key={item.label}>
                      <Typography fontSize="0.75rem" fontWeight={700} color="text.secondary" letterSpacing="0.06em">
                        {item.label}
                      </Typography>
                      <Typography fontSize="0.95rem" fontWeight={600}>
                        {item.value}
                      </Typography>
                    </Box>
                  ))}
                </Stack>

                <Stack direction="row" flexWrap="wrap" alignItems="center" gap={1.25}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Download size={15} />}
                    onClick={() => onDownloadOffer(application)}
                    sx={{ borderRadius: "8px" }}
                  >
                    View offer letter
                  </Button>

                  {offer.decision === "Pending" && !offerExpired && (
                    <>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<Check size={15} />}
                        disabled={!!acceptedElsewhere}
                        onClick={() => onRespond(application, "Accepted")}
                        sx={{ borderRadius: "8px" }}
                      >
                        Accept offer
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => onRespond(application, "Declined")}
                        sx={{ borderRadius: "8px" }}
                      >
                        Decline
                      </Button>
                      {acceptedElsewhere && (
                        <Typography fontSize="0.85rem" color="text.secondary" sx={{ width: "100%" }}>
                          You have already accepted the offer for {acceptedElsewhere}, so you can&apos;t accept this
                          one.
                        </Typography>
                      )}
                    </>
                  )}

                  {offer.decision === "Pending" && offerExpired && (
                    <Typography fontSize="0.9rem" color="error.main">
                      This offer has expired. Please contact HR.
                    </Typography>
                  )}
                  {offer.decision === "Accepted" && (
                    <Chip
                      label="You accepted this offer"
                      size="small"
                      sx={{ fontWeight: 600, color: "#059669", backgroundColor: "rgba(5,150,105,0.16)" }}
                    />
                  )}
                  {offer.decision === "Declined" && (
                    <Chip
                      label="You declined this offer"
                      size="small"
                      sx={{ fontWeight: 600, color: "#6B7280", backgroundColor: "rgba(107,114,128,0.16)" }}
                    />
                  )}
                </Stack>
              </Box>
            </Box>
          )}

          {application.status === ApplicationStatus.OfferAccepted && documents.length > 0 && (
            <Box id={`documents-${application.id}`} sx={{ mb: 3, scrollMarginTop: "16px" }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
                <SectionTitle>REQUIRED DOCUMENTS</SectionTitle>
                <Typography fontSize="0.85rem" color="text.secondary" mb={1.25}>
                  {uploadedCount} of {documents.length} uploaded
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={(uploadedCount / documents.length) * 100}
                sx={{
                  mb: 2,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: "action.hover",
                  "& .MuiLinearProgress-bar": { backgroundColor: "#ff6700", borderRadius: 3 },
                }}
              />

              <Stack gap={1.25}>
                {documents.map((doc) => {
                  const uploading = uploadingKey === `${application.id}:${doc.id}`;
                  return (
                    <Box
                      key={doc.id}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: 1,
                        p: 2,
                        borderRadius: "10px",
                        border: "1px solid",
                        borderColor: doc.uploadedFileName ? "#05966940" : "divider",
                        transition: "border-color 0.15s",
                        "&:hover": { borderColor: "#ff6700" },
                      }}
                    >
                      <Stack direction="row" gap={1.5} alignItems="center" sx={{ minWidth: 0 }}>
                        <Box sx={{ color: doc.uploadedFileName ? "#059669" : "#9CA3AF", display: "flex" }}>
                          {doc.uploadedFileName ? <Check size={18} /> : <FileText size={18} />}
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography fontWeight={600} fontSize="0.95rem">
                            {doc.name}
                          </Typography>
                          <Typography fontSize="0.85rem" color="text.secondary">
                            {doc.uploadedFileName
                              ? `${doc.uploadedFileName} · uploaded ${formatDate(doc.uploadedAt ?? "")}`
                              : doc.description}
                          </Typography>
                        </Box>
                      </Stack>
                      {!application.documentsSubmitted && (
                        <Button
                          size="small"
                          variant={doc.uploadedFileName ? "text" : "outlined"}
                          startIcon={uploading ? <CircularProgress size={13} /> : <Upload size={14} />}
                          disabled={uploading}
                          onClick={() => onPickDocument(application, doc.id)}
                          sx={{ borderRadius: "8px" }}
                        >
                          {doc.uploadedFileName ? "Replace" : "Upload"}
                        </Button>
                      )}
                    </Box>
                  );
                })}
              </Stack>

              {application.documentsSubmitted ? (
                <Stack
                  direction="row"
                  gap={1.5}
                  alignItems="center"
                  sx={{ mt: 2, p: 2, borderRadius: "10px", backgroundColor: "rgba(5,150,105,0.12)", border: "1px solid #05966930" }}
                >
                  <Check size={20} color="#059669" />
                  <Typography fontSize="0.95rem" fontWeight={600} color="text.primary">
                    Documents received - HR will contact you with the next steps.
                  </Typography>
                </Stack>
              ) : (
                <Stack direction="row" alignItems="center" gap={1.5} mt={2}>
                  <Button
                    variant="contained"
                    disabled={uploadedCount < documents.length || submittingDocumentsId === application.id}
                    onClick={() => onSubmitDocuments(application)}
                    sx={{ borderRadius: "999px", fontWeight: 700, px: 3.5 }}
                  >
                    {submittingDocumentsId === application.id ? "Submitting..." : "Submit documents"}
                  </Button>
                  {uploadedCount < documents.length && (
                    <Typography fontSize="0.85rem" color="text.secondary">
                      Upload all {documents.length} documents to submit. PDF, JPG or PNG, up to 5MB each.
                    </Typography>
                  )}
                </Stack>
              )}
            </Box>
          )}

          {(application.timeline ?? []).length > 0 && (
            <Box sx={{ mb: 2 }}>
              <SectionTitle>PROGRESS HISTORY</SectionTitle>
              <Stack gap={1}>
                {[...(application.timeline ?? [])].reverse().map((event, index) => (
                  <Stack key={`${event.stage}-${event.date}-${index}`} direction="row" gap={2}>
                    <Typography fontSize="0.85rem" color="text.secondary" sx={{ minWidth: 96 }}>
                      {formatDate(event.date)}
                    </Typography>
                    <Typography fontSize="0.9rem">
                      <Box component="span" fontWeight={600}>
                        {event.stage}
                      </Box>
                      {event.note && ` - ${event.note}`}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
          )}

          {jobOpen && (
            <Button size="small" onClick={() => onOpenJob(application.jobId)} sx={{ fontWeight: 600 }}>
              View job
            </Button>
          )}
        </CardContent>
    </Card>
  );
};

// One card in the list: the job title, when it last changed, its status, and a link to the details.
const ApplicationListCard = ({ application, onView }: { application: Application; onView: () => void }) => {
  const updated = (application.timeline ?? []).at(-1)?.date ?? application.appliedDate;
  const actionNeeded = needsAction(application);

  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: "8px",
        transition: "border-color 0.15s",
        "&:hover": { borderColor: "#ff6700" },
      }}
    >
      <CardContent sx={{ p: 3, height: "100%", display: "flex", flexDirection: "column", "&:last-child": { pb: 3 } }}>
        <Typography
          component="h3"
          sx={{
            fontSize: "1.2rem",
            lineHeight: 1.5,
            fontWeight: 400,
            color: "text.primary",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {application.jobTitle}
        </Typography>
        <Typography fontSize="0.9rem" color="text.secondary" mt={0.5}>
          Updated {timeAgo(updated)}
        </Typography>

        <Stack direction="row" alignItems="center" gap={1} mt={2}>
          <ApplicationStatusBadge status={application.status} />
          {actionNeeded && (
            <Typography fontSize="0.8rem" fontWeight={700} sx={{ color: "#ff6700" }}>
              Action needed
            </Typography>
          )}
        </Stack>

        <Box sx={{ flexGrow: 1 }} />
        <Box
          component="button"
          type="button"
          onClick={onView}
          sx={{
            alignSelf: "flex-end",
            mt: 3,
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            p: 0,
            border: "none",
            background: "none",
            cursor: "pointer",
            fontFamily: "inherit",
            fontSize: "0.9rem",
            fontWeight: 600,
            color: "text.primary",
          }}
        >
          View application
          <ArrowRight size={14} color="#ff6700" />
        </Box>
      </CardContent>
    </Card>
  );
};

const Applications = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { getAccessToken } = useAuthContext();
  const applications = useAppSelector((state: RootState) => state.careers.applications);
  const applicationsState = useAppSelector((state: RootState) => state.careers.applicationsState);
  const jobs = useAppSelector((state: RootState) => state.careers.jobs);

  // /applications shows the list; /applications/<id> shows one application's details.
  const { id: applicationId } = useParams<{ id: string }>();
  const [tab, setTab] = useState<ApplicationFilter>("all");

  // A candidate can hold only one accepted offer at a time.
  const acceptedApplication = applications.find((a) => a.status === ApplicationStatus.OfferAccepted) ?? null;

  const [confirm, setConfirm] = useState<{ application: Application; decision: Decision } | null>(null);
  // Set right after an offer is accepted, to show the welcome pop-up before the documents section.
  const [welcome, setWelcome] = useState<{ applicationId: string; position: string } | null>(null);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [submittingDocumentsId, setSubmittingDocumentsId] = useState<string | null>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const uploadTarget = useRef<{ applicationId: string; documentId: string } | null>(null);

  useEffect(() => {
    if (applicationsState !== State.idle) return;
    getAccessToken().then((token) => dispatch(loadApplications(token)));
  }, [applicationsState, dispatch, getAccessToken]);

  const notify = (message: string, type: "success" | "error") => dispatch(enqueueSnackbarMessage({ message, type }));

  const handleDownloadOffer = (application: Application) => {
    getAccessToken().then((token) =>
      downloadOfferLetter(token, application.id, application.offer?.position ?? application.jobTitle),
    );
  };

  const handleConfirmDecision = () => {
    if (!confirm) return;
    const { application, decision } = confirm;
    setConfirm(null);
    if (decision === "Accepted" && acceptedApplication && acceptedApplication.id !== application.id) {
      notify(SnackMessage.error.offerAlreadyAccepted, "error");
      return;
    }
    getAccessToken()
      .then((token) => dispatch(respondToOffer({ accessToken: token, applicationId: application.id, decision })).unwrap())
      .then(() => {
        if (decision === "Accepted") {
          setWelcome({ applicationId: application.id, position: application.offer?.position ?? application.jobTitle });
        } else {
          notify(SnackMessage.success.offerDeclined, "success");
        }
      })
      .catch(() => notify(SnackMessage.error.respondToOffer, "error"));
  };

  // Closing the welcome pop-up, by its button or the backdrop, lands the candidate on the documents section.
  const handleContinueToDocuments = () => {
    const target = welcome;
    setWelcome(null);
    if (!target) return;
    setTimeout(() => {
      document.getElementById(`documents-${target.applicationId}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
  };

  const handlePickDocument = (application: Application, documentId: string) => {
    uploadTarget.current = { applicationId: application.id, documentId };
    documentInputRef.current?.click();
  };

  const handleDocumentChosen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    const target = uploadTarget.current;
    if (!file || !target) return;
    if (!ACCEPTED_DOCUMENT_TYPES.includes(file.type)) {
      notify("Only PDF, JPG or PNG files are accepted.", "error");
      return;
    }
    if (file.size > MAX_DOCUMENT_BYTES) {
      notify("File must be 5MB or smaller.", "error");
      return;
    }
    setUploadingKey(`${target.applicationId}:${target.documentId}`);
    getAccessToken()
      .then((token) =>
        dispatch(
          uploadApplicationDocument({
            accessToken: token,
            applicationId: target.applicationId,
            documentId: target.documentId,
            file,
          }),
        ).unwrap(),
      )
      .then(() => notify(SnackMessage.success.documentUploaded, "success"))
      .catch(() => notify(SnackMessage.error.uploadDocument, "error"))
      .finally(() => setUploadingKey(null));
  };

  const handleSubmitDocuments = (application: Application) => {
    setSubmittingDocumentsId(application.id);
    getAccessToken()
      .then((token) =>
        dispatch(submitApplicationDocuments({ accessToken: token, applicationId: application.id })).unwrap(),
      )
      .then(() => notify(SnackMessage.success.documentsSubmitted, "success"))
      .catch(() => notify(SnackMessage.error.submitDocuments, "error"))
      .finally(() => setSubmittingDocumentsId(null));
  };

  const selectedApplication = applicationId ? applications.find((a) => a.id === applicationId) : undefined;
  const stillLoading = applicationsState === State.idle || applicationsState === State.loading;

  const tabs: { key: ApplicationFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "offers", label: "Offers" },
    { key: "closed", label: "Closed" },
  ];
  const countOf = (key: ApplicationFilter) =>
    key === "all" ? applications.length : applications.filter((a) => tabOf(a) === key).length;
  const visible = tab === "all" ? applications : applications.filter((a) => tabOf(a) === tab);

  return (
    <Box sx={{ maxWidth: 1080, mx: "auto", px: { xs: 2, md: 3 }, pt: { xs: 2.5, md: 3 }, pb: { xs: 4, md: 5 } }}>
      {applicationId ? (
        <>
          <Button
            startIcon={<ArrowLeft size={16} />}
            onClick={() => navigate("/applications")}
            sx={{ mb: 2, ml: -1, fontWeight: 600 }}
          >
            Applications
          </Button>

          {selectedApplication ? (
            <ApplicationDetails
              application={selectedApplication}
              uploadingKey={uploadingKey}
              submittingDocumentsId={submittingDocumentsId}
              acceptedElsewhere={
                acceptedApplication && acceptedApplication.id !== selectedApplication.id
                  ? acceptedApplication.jobTitle
                  : null
              }
              jobOpen={jobs.some((job) => job.id === selectedApplication.jobId)}
              onOpenJob={(jobId) => navigate(`/jobs/${jobId}`)}
              onDownloadOffer={handleDownloadOffer}
              onRespond={(app, decision) => setConfirm({ application: app, decision })}
              onPickDocument={handlePickDocument}
              onSubmitDocuments={handleSubmitDocuments}
            />
          ) : stillLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress size={32} sx={{ color: "#ff6700" }} />
            </Box>
          ) : (
            <Typography color="text.secondary">We couldn&apos;t find this application.</Typography>
          )}
        </>
      ) : (
        <>
          <Typography
            component="h2"
            sx={{
              textAlign: "center",
              fontSize: { xs: "34px", md: "48px" },
              fontWeight: 800,
              lineHeight: 1.15,
              mb: 3,
            }}
          >
            <Box component="span" sx={{ color: "#ff6700" }}>
              My
            </Box>{" "}
            <Box component="span" sx={{ color: "text.primary" }}>
              Applications
            </Box>
          </Typography>

          {applicationsState === State.loading && applications.length === 0 && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress size={32} sx={{ color: "#ff6700" }} />
            </Box>
          )}

          {applicationsState === State.failed && (
            <Typography color="error" mb={2}>
              {SnackMessage.error.fetchApplications}
            </Typography>
          )}

          {applicationsState !== State.loading && applications.length === 0 ? (
            <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: "8px" }}>
              <CardContent sx={{ py: 8, textAlign: "center" }}>
                <AssignmentOutlined sx={{ fontSize: 48, color: "text.disabled", mb: 2 }} />
                <Typography variant="h6" fontWeight={600} mb={1} color="text.primary">
                  No Applications Yet
                </Typography>
                <Typography color="text.secondary" mb={3} fontSize="0.9rem">
                  You haven&apos;t applied to any positions. Start exploring open roles!
                </Typography>
                <Button variant="contained" onClick={() => navigate("/jobs")}>
                  Browse Jobs
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <Tabs
                value={tab}
                onChange={(_, value: ApplicationFilter) => setTab(value)}
                sx={{
                  mb: 3,
                  borderBottom: "1px solid",
                  borderColor: "divider",
                  "& .MuiTabs-indicator": { backgroundColor: "#ff6700" },
                  "& .MuiTab-root": { textTransform: "none", fontSize: "1rem", fontWeight: 500, color: "text.secondary" },
                  "& .MuiTab-root.Mui-selected": { color: "text.primary" },
                }}
              >
                {tabs.map((t) => (
                  <Tab key={t.key} value={t.key} label={`${t.label} (${countOf(t.key)})`} />
                ))}
              </Tabs>

              {visible.length === 0 ? (
                <Typography color="text.secondary">No applications in this tab.</Typography>
              ) : (
                <Grid container spacing={3}>
                  {visible.map((application) => (
                    <Grid key={application.id} size={{ xs: 12, sm: 6, md: 4 }}>
                      <ApplicationListCard
                        application={application}
                        onView={() => navigate(`/applications/${application.id}`)}
                      />
                    </Grid>
                  ))}
                </Grid>
              )}
            </>
          )}
        </>
      )}

      <input
        ref={documentInputRef}
        type="file"
        accept="application/pdf,image/jpeg,image/png"
        hidden
        onChange={handleDocumentChosen}
      />

      <Dialog open={!!confirm} onClose={() => setConfirm(null)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 700 }}>
          {confirm?.decision === "Accepted" ? "Accept this offer?" : "Decline this offer?"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText fontSize="0.95rem" sx={{ color: "text.primary" }}>
            {confirm?.decision === "Accepted"
              ? `You are accepting the offer for ${confirm.application.offer?.position}. Once you accept, you can't apply for other jobs or accept other offers. This can't be undone.`
              : `You are declining the offer for ${confirm?.application.offer?.position}. You won't be able to accept it later. This can't be undone.`}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirm(null)}>Cancel</Button>
          <Button
            variant="contained"
            color={confirm?.decision === "Accepted" ? "primary" : "error"}
            onClick={handleConfirmDecision}
          >
            {confirm?.decision === "Accepted" ? "Yes, accept" : "Yes, decline"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!welcome}
        onClose={handleContinueToDocuments}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: "16px", textAlign: "center" } }}
      >
        <DialogContent sx={{ pt: 4, pb: 1 }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              mx: "auto",
              mb: 2,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#ff670018",
              color: "#ff6700",
            }}
          >
            <PartyPopper size={30} />
          </Box>
          <Typography fontWeight={800} fontSize="1.5rem" mb={1}>
            Congratulations!
          </Typography>
          <Typography fontWeight={600} fontSize="1.05rem" mb={1.5}>
            You are now part of the WSO2 family.
          </Typography>
          <Typography fontSize="0.95rem" color="text.primary">
            To complete your onboarding for {welcome?.position}, we need a few additional documents from you.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", pb: 3, pt: 2 }}>
          <Button variant="contained" onClick={handleContinueToDocuments} sx={{ borderRadius: "999px", fontWeight: 700, px: 4 }}>
            Upload documents
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Applications;

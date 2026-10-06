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

import DOMPurify from "dompurify";
import { getCountries, getCountryCallingCode, parsePhoneNumberFromString } from "libphonenumber-js";

import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  FormControlLabel,
  Grid,
  MenuItem,
  Radio,
  RadioGroup,
  Skeleton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { ArrowLeft, ArrowRight, Bookmark, BookmarkCheck, Check, Facebook, Linkedin, Twitter, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { UseMockProfile } from "@config/config";
import { ApplicationStatus, SnackMessage } from "@config/constant";
import { useAppAuthContext } from "@context/AuthContext";
import { State } from "@/types/types";
import {
  loadJobDetail,
  loadProfile,
  submitApplication,
  toggleSaveJob,
  updateProfile,
  uploadResume,
} from "@slices/careersSlice/careers";
import { enqueueSnackbarMessage } from "@slices/commonSlice/common";
import { RootState, useAppDispatch, useAppSelector } from "@slices/store";
import { submitApplicationForm } from "@utils/profileService";

const teamColors: Record<string, string> = {
  ENGINEERING: "#3B82F6",
  "CUSTOMER SUCCESS": "#8B5CF6",
  MARKETING: "#10B981",
  SALES: "#EF4444",
  "SALES ENGINEERING": "#F59E0B",
  "People Operations": "#EC4899",
  FINANCE: "#06B6D4",
  "CHANNEL SALES": "#6366F1",
  "DIGITAL TRANSFORMATION": "#14B8A6",
  "BUSINESS OPERATIONS": "#F97316",
};

const SECTION_MAX_WIDTH = 1080;

const proseStyles = {
  fontSize: "1rem",
  lineHeight: "1.6rem",
  letterSpacing: ".008rem",
  color: "text.primary",
  // The description HTML comes from the vacancy API and may carry its own inline fonts and colors;
  // paragraphs always use the full-contrast text color, and links keep the brand color.
  "&, & *": { fontFamily: "inherit !important", color: "inherit !important" },
  "& a": { color: "#ff6700 !important", textDecoration: "underline" },
  "& h1, & h2, & h3": {
    color: "text.primary",
    fontWeight: 400,
    mt: 3,
    mb: 1.5,
    fontSize: "1.5rem",
    lineHeight: "2.3rem",
  },
  "& h4": { color: "text.primary", fontWeight: 400, fontSize: "1.2rem", lineHeight: "1.8rem" },
  "& ul, & ol": { pl: 2.5 },
  "& li": { mb: 0.75 },
  "& p": { mb: 1.5, letterSpacing: ".018rem" },
  "& strong": { color: "text.primary" },
} as const;

// Every country with its dialing code, keyed by ISO region so countries sharing a code stay distinct.
const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
const COUNTRY_OPTIONS = getCountries()
  .map((iso) => ({ iso, name: regionNames.of(iso) ?? iso, dialCode: `+${getCountryCallingCode(iso)}` }))
  .sort((a, b) => a.name.localeCompare(b.name));

// The profile stores one phone string; the form edits the country and the number separately.
const splitPhone = (phone: string) => {
  const parsed = parsePhoneNumberFromString(phone);
  if (!parsed) return { countryIso: "", phone: phone.replace(/\D/g, "") };
  const countryIso =
    parsed.country ?? COUNTRY_OPTIONS.find((o) => o.dialCode === `+${parsed.countryCallingCode}`)?.iso ?? "";
  return { countryIso, phone: parsed.nationalNumber };
};

const JobDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Browser-back keeps the list's search and filters; a directly opened job has no history to go back to.
  const goBackToJobs = () => (location.key !== "default" ? navigate(-1) : navigate("/jobs"));
  const dispatch = useAppDispatch();
  const { getToken: getAccessToken, isSignedIn, appSignIn } = useAppAuthContext();

  const savedJobIds = useAppSelector((state: RootState) => state.careers.savedJobIds);
  const applications = useAppSelector((state: RootState) => state.careers.applications);
  const detail = useAppSelector((state: RootState) => (id ? state.careers.jobDetails[id] : undefined)) ?? null;

  const profile = useAppSelector((state: RootState) => state.careers.profile);
  const profileState = useAppSelector((state: RootState) => state.careers.profileState);

  const [loading, setLoading] = useState(!detail);
  const [error, setError] = useState(false);

  // The application form starts from the candidate profile; edits made here are saved back to it on submit.
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", countryIso: "", phone: "", address: "" });
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [authorized, setAuthorized] = useState<"yes" | "no" | "">("");
  const [consentData, setConsentData] = useState(false);
  const [consentChecks, setConsentChecks] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedOpen, setSubmittedOpen] = useState(false);
  // A CV chosen here is uploaded on submit and replaces any profile resume selection.
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvError, setCvError] = useState<string | null>(null);
  const cvInputRef = useRef<HTMLInputElement>(null);

  // Only a signed-in candidate has a profile to pre-fill from; a guest fills in the form by hand.
  useEffect(() => {
    if (!isSignedIn || profileState !== State.idle) return;
    getAccessToken().then((token) => dispatch(loadProfile(token)));
  }, [isSignedIn, profileState, dispatch, getAccessToken]);

  useEffect(() => {
    setForm({
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      ...splitPhone(profile.phone),
      address: profile.address,
    });
    const preferred = profile.resumes.find((r) => r.isActive) ?? profile.resumes[0];
    setSelectedResumeId(preferred?.id ?? "");
  }, [profile]);

  // A link ending in #Apply-Now opens straight at the form. The short delay lets the shell's
  // scroll-to-top on navigation happen first.
  useEffect(() => {
    if (!detail || window.location.hash !== "#Apply-Now") return;
    const timer = setTimeout(() => document.getElementById("Apply-Now")?.scrollIntoView(), 100);
    return () => clearTimeout(timer);
  }, [detail]);

  useEffect(() => {
    if (!id || detail) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(false);
    getAccessToken()
      .then((token) => dispatch(loadJobDetail({ accessToken: token, jobId: id })).unwrap())
      .catch(() => {
        setError(true);
      })
      .finally(() => setLoading(false));
  }, [id, detail, dispatch, getAccessToken]);

  if (loading) {
    return (
      <Box>
        <Box sx={{ backgroundColor: "#0B1220", py: { xs: 5, md: 7 } }}>
          <Box sx={{ maxWidth: SECTION_MAX_WIDTH, mx: "auto", px: { xs: 2, md: 3 } }}>
            <Grid container spacing={4} alignItems="center">
              <Grid size={{ xs: 12, md: 7 }}>
                <Skeleton variant="rounded" width={140} height={22} sx={{ borderRadius: "999px", mb: 2, bgcolor: "rgba(255,255,255,0.08)" }} />
                <Skeleton variant="text" width="70%" height={52} sx={{ mb: 3, bgcolor: "rgba(255,255,255,0.08)" }} />
                <Skeleton variant="rounded" width={150} height={44} sx={{ borderRadius: "999px", bgcolor: "rgba(255,255,255,0.08)" }} />
              </Grid>
              <Grid size={{ xs: 12, md: 5 }}>
                <Skeleton variant="rounded" height={180} sx={{ borderRadius: "16px", bgcolor: "rgba(255,255,255,0.08)" }} />
              </Grid>
            </Grid>
          </Box>
        </Box>
        <Box sx={{ maxWidth: SECTION_MAX_WIDTH, mx: "auto", px: { xs: 2, md: 3 }, py: { xs: 5, md: 7 } }}>
          <Skeleton variant="text" height={24} sx={{ mb: 1 }} />
          <Skeleton variant="text" height={24} sx={{ mb: 1 }} />
          <Skeleton variant="text" height={24} width="80%" />
        </Box>
      </Box>
    );
  }

  if (error || !detail) {
    return (
      <Box>
        <Box sx={{ textAlign: "center", py: 10 }}>
          <Typography variant="h5" mb={2} color="text.primary">
            Failed to load job details.
          </Typography>
          <Button variant="contained" onClick={() => navigate("/jobs")}>
            Back to Jobs
          </Button>
        </Box>
      </Box>
    );
  }

  const isSaved = savedJobIds.includes(detail.id);
  const alreadyApplied = applications.some((a) => a.jobId === detail.id);
  // A candidate who has accepted an offer can't apply for other positions.
  const acceptedApplication = applications.find((a) => a.status === ApplicationStatus.OfferAccepted);
  const applyBlocked = !!acceptedApplication && acceptedApplication.jobId !== detail.id;
  const color = teamColors[detail.team] ?? "#6B7280";
  const officeLabel = detail.officeLocations.length > 0 ? detail.officeLocations.join(", ") : "Remote";
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  const applyFormValid =
    !applyBlocked &&
    !!form.firstName.trim() &&
    !!form.lastName.trim() &&
    !!form.email.trim() &&
    !!form.countryIso &&
    !!form.phone.trim() &&
    !!form.address.trim() &&
    (!!selectedResumeId || !!cvFile) &&
    !!authorized &&
    consentData &&
    consentChecks;

  const handleSubmitApplication = async () => {
    if (!applyFormValid) return;
    setSubmitting(true);
    try {
      // The details and CV go up in one request to the backend. Guests always apply this way; so does a
      // signed-in applicant once the profile endpoints exist (demo mode keeps the profile-based flow below).
      if (!isSignedIn || !UseMockProfile) {
        if (!cvFile) throw new Error("A CV is required");
        const guestDialCode = COUNTRY_OPTIONS.find((o) => o.iso === form.countryIso)?.dialCode ?? "";
        await submitApplicationForm(
          await getAccessToken(),
          detail.id,
          {
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim(),
            email: form.email.trim(),
            // The vacancy service accepts only E.164 (+ then digits, no spaces); a leading trunk "0" is dropped.
            phone: `${guestDialCode}${form.phone.replace(/\D/g, "").replace(/^0+/, "")}`,
            address: form.address.trim(),
            authorizedToWork: authorized === "yes",
          },
          cvFile,
        );
        setSubmittedOpen(true);
        return;
      }

      const token = await getAccessToken();
      // An untouched phone keeps the profile's original formatting instead of being re-serialized.
      const original = splitPhone(profile.phone);
      const phoneUnchanged = form.countryIso === original.countryIso && form.phone.trim() === original.phone;
      const dialCode = COUNTRY_OPTIONS.find((o) => o.iso === form.countryIso)?.dialCode ?? "";
      const details = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: phoneUnchanged ? profile.phone : `${dialCode} ${form.phone.trim()}`,
        address: form.address.trim(),
      };
      const changed = (Object.keys(details) as (keyof typeof details)[]).some((key) => details[key] !== profile[key]);
      if (changed) await dispatch(updateProfile({ accessToken: token, partial: details })).unwrap();
      let resumeId = selectedResumeId;
      if (cvFile) {
        const updated = await dispatch(uploadResume({ accessToken: token, file: cvFile })).unwrap();
        const uploaded = [...updated.resumes].reverse().find((r) => r.name === cvFile.name) ?? updated.resumes.at(-1);
        if (!uploaded) throw new Error("Resume upload did not return the new resume");
        resumeId = uploaded.id;
      }
      await dispatch(submitApplication({ accessToken: token, jobId: detail.id, resumeId })).unwrap();
      setSubmittedOpen(true);
    } catch (err) {
      // The backend explains rejections (a missing field, a bad CV) in `message`.
      const data = (err as { response?: { data?: { detail?: string; message?: string } } })?.response?.data;
      const detailMessage = data?.detail ?? data?.message;
      dispatch(enqueueSnackbarMessage({ message: detailMessage ?? SnackMessage.error.submitApplication, type: "error" }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box>

      {/* Hero */}
      <Box
        sx={{
          position: "relative",
          overflow: "hidden",
          backgroundColor: "#0B1220",
          backgroundImage: [
            "radial-gradient(circle at 78% 65%, rgba(255,115,0,0.38), transparent 60%)",
            "radial-gradient(circle at 30% 20%, rgba(60,90,160,0.35), transparent 55%)",
            "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
          ].join(", "),
          backgroundSize: "auto, auto, 42px 42px, 42px 42px",
        }}
      >
        <Box sx={{ maxWidth: SECTION_MAX_WIDTH, mx: "auto", px: { xs: 2, md: 3 }, py: { xs: 5, md: 7 } }}>
          <Tooltip title="Back to jobs" arrow>
            <Box
              component="button"
              onClick={goBackToJobs}
              aria-label="Back to jobs"
              sx={{
                width: 40,
                height: 40,
                mb: 3,
                // Outdents past the centered content column so the button sits near the window's left edge.
                ml: `calc((min(${SECTION_MAX_WIDTH}px, 100vw) - 100vw) / 2)`,
                borderRadius: "50%",
                border: "1.5px solid rgba(255,255,255,0.8)",
                backgroundColor: "rgba(255,255,255,0.12)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                transition: "background-color 0.15s, border-color 0.15s",
                "&:hover": { backgroundColor: "#ff6700", borderColor: "#ff6700" },
              }}
            >
              <ArrowLeft size={20} strokeWidth={2.5} />
            </Box>
          </Tooltip>

          <Grid container spacing={4} alignItems="center">
            <Grid size={{ xs: 12, md: 7 }}>
              <Stack direction="row" gap={1} mb={2} flexWrap="wrap">
                <Box
                  sx={{
                    px: 1.5,
                    py: 0.5,
                    borderRadius: "999px",
                    border: "1px solid rgba(255,255,255,0.2)",
                    color: color,
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "0.05em",
                  }}
                >
                  • {detail.team.toUpperCase()}
                </Box>
                {detail.country.map((c) => (
                  <Box
                    key={c}
                    sx={{
                      px: 1.5,
                      py: 0.5,
                      borderRadius: "999px",
                      border: "1px solid rgba(255,255,255,0.2)",
                      color: "primary.main",
                      fontSize: "11px",
                      fontWeight: 700,
                      letterSpacing: "0.05em",
                    }}
                  >
                    • {c.toUpperCase()}
                  </Box>
                ))}
              </Stack>

              <Typography
                variant="h1"
                fontWeight={800}
                sx={{
                  color: "#fff",
                  textWrap: "balance",
                  fontSize: { xs: "2.4rem", md: "4rem" },
                  lineHeight: { xs: "3rem", md: "5rem" },
                  mb: 3,
                }}
              >
                {detail.title}
              </Typography>

              {alreadyApplied ? (
                <Box
                  sx={{ display: "inline-block", px: 2.5, py: 1.2, borderRadius: "999px", backgroundColor: "rgba(16,185,129,0.15)" }}
                >
                  <Typography fontWeight={700} sx={{ color: "#34D399" }}>
                    ✓ Application submitted
                  </Typography>
                </Box>
              ) : applyBlocked ? (
                <Box
                  sx={{ display: "inline-block", px: 2.5, py: 1.2, borderRadius: "999px", backgroundColor: "rgba(255,255,255,0.12)" }}
                >
                  <Typography fontWeight={600} sx={{ color: "#fff" }}>
                    You have accepted an offer, so new applications are closed.
                  </Typography>
                </Box>
              ) : (
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => {
                    // Updates the address bar without adding a history entry, so the back button still returns to the list.
                    window.history.replaceState(window.history.state, "", `${location.pathname}${location.search}#Apply-Now`);
                    document.getElementById("Apply-Now")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  endIcon={<ArrowRight size={17} />}
                  sx={{
                    borderRadius: "999px",
                    fontWeight: 700,
                    px: 3.5,
                    py: 1.2,
                    backgroundColor: "primary.main",
                    color: "#0B1220",
                    "&:hover": { backgroundColor: "primary.main", filter: "brightness(0.95)" },
                  }}
                >
                  Apply Now
                </Button>
              )}

              <Stack direction="row" gap={1.5} mt={3}>
                <Box
                  component="a"
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    width: 34, height: 34, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.25)",
                    display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.7)",
                  }}
                >
                  <Facebook size={15} />
                </Box>
                <Box
                  component="a"
                  href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(detail.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    width: 34, height: 34, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.25)",
                    display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.7)",
                  }}
                >
                  <Twitter size={15} />
                </Box>
                <Box
                  component="a"
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    width: 34, height: 34, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.25)",
                    display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.7)",
                  }}
                >
                  <Linkedin size={15} />
                </Box>
                {isSignedIn && (
                <Box
                  component="button"
                  onClick={() => dispatch(toggleSaveJob(detail.id))}
                  sx={{
                    width: 34, height: 34, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.25)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: isSaved ? "primary.main" : "rgba(255,255,255,0.7)",
                    background: "none", cursor: "pointer",
                  }}
                >
                  {isSaved ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
                </Box>
                )}
              </Stack>
            </Grid>

            {/* At a glance */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Box
                sx={{
                  borderRadius: "16px",
                  p: 3,
                  backgroundColor: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <Typography sx={{ color: "rgba(255,255,255,0.55)", fontSize: "12px", fontWeight: 700, letterSpacing: "0.1em", mb: 2 }}>
                  AT A GLANCE
                </Typography>
                <Stack gap={0}>
                  {[
                    { label: "TEAM", value: detail.team },
                    { label: "OFFICE", value: officeLabel },
                    { label: "TYPE", value: detail.jobType },
                  ].map((row, i) => (
                    <Stack
                      key={row.label}
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{
                        py: 1.5,
                        borderTop: i > 0 ? "1px solid rgba(255,255,255,0.1)" : "none",
                      }}
                    >
                      <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", fontWeight: 700, letterSpacing: "0.05em" }}>
                        {row.label}
                      </Typography>
                      <Typography sx={{ color: "#fff", fontWeight: 600, fontSize: "15px" }}>{row.value}</Typography>
                    </Stack>
                  ))}
                </Stack>
                <Button
                  variant="text"
                  onClick={() => navigate("/jobs")}
                  endIcon={<ArrowRight size={15} />}
                  sx={{ mt: 2, color: "primary.main", fontWeight: 700, px: 0 }}
                >
                  See all open roles
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Box>

      {/* Body content */}
      <Box sx={{ maxWidth: SECTION_MAX_WIDTH, mx: "auto", px: { xs: 2, md: 3 }, py: { xs: 5, md: 7 } }}>
        {detail.mainContent && (
          <Box sx={proseStyles} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(detail.mainContent) }} />
        )}
        {detail.taskInformation && (
          <Box sx={proseStyles} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(detail.taskInformation) }} />
        )}
        {detail.additionalContent && (
          <Box sx={proseStyles} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(detail.additionalContent) }} />
        )}

        {/* Application form — pre-filled from the candidate profile */}
        <Box
          id="Apply-Now"
          sx={{
            mt: 6,
            scrollMarginTop: "24px",
            p: { xs: 2.5, md: 4 },
            border: "1px solid",
            borderColor: "divider",
            borderRadius: "16px",
            boxShadow: "0 18px 40px -16px rgb(7 20 46 / 18%)",
            "& .MuiInputBase-root, & .MuiInputLabel-root": { fontSize: "1rem" },
            backgroundColor: "background.paper",
          }}
        >
          <Typography variant="h4" fontWeight={800} sx={{ color: "text.primary" }} mb={0.5}>
            Apply Now
          </Typography>
          {/* Before they type anything: signing in now loses nothing and fills the form from the profile. */}
          {!isSignedIn ? (
            <Stack
              direction={{ xs: "column", sm: "row" }}
              alignItems={{ xs: "flex-start", sm: "center" }}
              justifyContent="space-between"
              gap={2}
              sx={{ p: 2, mb: 3, borderRadius: "10px", border: "1px solid #ff670040", backgroundColor: "#ff670010" }}
            >
              <Stack direction="row" alignItems="center" gap={1.5}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    flexShrink: 0,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#ff670020",
                    color: "#ff6700",
                  }}
                >
                  <User size={20} />
                </Box>
                <Box>
                  <Typography fontWeight={700} fontSize="0.95rem" color="text.primary">
                    Have a Candidate Passport?
                  </Typography>
                  <Typography fontSize="0.9rem" color="text.primary">
                    Sign in or sign up to fill this form from your profile and track this application. Or continue as
                    a guest below.
                  </Typography>
                </Box>
              </Stack>
              <Button
                variant="outlined"
                onClick={appSignIn}
                sx={{ flexShrink: 0, borderRadius: "999px", fontWeight: 700, px: 3 }}
              >
                Sign in / Sign up
              </Button>
            </Stack>
          ) : (
            <Box sx={{ mb: 2 }} />
          )}

          {alreadyApplied ? (
            <Typography fontWeight={700} sx={{ color: "#059669" }}>
              ✓ You have already applied for this position.
            </Typography>
          ) : applyBlocked ? (
            <Typography fontWeight={600} color="text.primary">
              You have accepted the offer for {acceptedApplication?.jobTitle}, so you can&apos;t apply for other
              positions.
            </Typography>
          ) : profileState === State.loading && !profile.personId ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={28} sx={{ color: "#ff6700" }} />
            </Box>
          ) : (
            <Stack gap={2.5}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="First Name"
                    required
                    fullWidth
                    size="small"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Last Name"
                    required
                    fullWidth
                    size="small"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Email"
                    required
                    fullWidth
                    size="small"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    select
                    label="Country Code"
                    required
                    fullWidth
                    size="small"
                    value={form.countryIso}
                    onChange={(e) => setForm({ ...form, countryIso: e.target.value })}
                    slotProps={{
                      select: {
                        MenuProps: { slotProps: { paper: { sx: { maxHeight: 320 } } } },
                        renderValue: (iso) => COUNTRY_OPTIONS.find((o) => o.iso === iso)?.dialCode ?? "",
                      },
                    }}
                  >
                    {COUNTRY_OPTIONS.map((o) => (
                      <MenuItem key={o.iso} value={o.iso}>
                        {o.name} ({o.dialCode})
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 8 }}>
                  <TextField
                    label="Phone"
                    required
                    fullWidth
                    size="small"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 15) })}
                    slotProps={{ htmlInput: { inputMode: "numeric" } }}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Address"
                    required
                    fullWidth
                    size="small"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography fontSize="0.9rem" fontWeight={600} mb={0.75}>
                    Upload CV (PDF only / 5MB) *
                  </Typography>
                  <Stack direction="row" alignItems="center" gap={1.5}>
                    <input
                      ref={cvInputRef}
                      type="file"
                      accept="application/pdf"
                      hidden
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        e.target.value = "";
                        if (!file) return;
                        if (file.type !== "application/pdf") {
                          setCvError("Only PDF files are accepted.");
                          return;
                        }
                        if (file.size > 5 * 1024 * 1024) {
                          setCvError("File must be 5MB or smaller.");
                          return;
                        }
                        setCvError(null);
                        setCvFile(file);
                        setSelectedResumeId("");
                      }}
                    />
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => cvInputRef.current?.click()}
                      sx={{ borderRadius: "8px" }}
                    >
                      Choose file
                    </Button>
                    <Typography fontSize="0.9rem" color="text.secondary" noWrap>
                      {cvFile ? cvFile.name : "No file chosen"}
                    </Typography>
                  </Stack>
                  {cvError && (
                    <Typography fontSize="12px" color="error.main" mt={0.75}>
                      {cvError}
                    </Typography>
                  )}
                </Grid>
                {profile.resumes.length > 0 && (
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      select
                      label="Or use a resume from profile"
                      fullWidth
                      size="small"
                      value={selectedResumeId}
                      onChange={(e) => {
                        setSelectedResumeId(e.target.value);
                        setCvFile(null);
                      }}
                    >
                      {profile.resumes.map((r) => (
                        <MenuItem key={r.id} value={r.id}>
                          {r.name} {r.isActive && "(Active)"}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                )}
              </Grid>

              <Box>
                <Typography fontSize="0.9rem" fontWeight={600} mb={0.5}>
                  Do you have authorization to work in selected job location? *
                </Typography>

                <RadioGroup row value={authorized} onChange={(e) => setAuthorized(e.target.value as "yes" | "no")}>
                  <FormControlLabel value="yes" control={<Radio size="small" />} label="Yes" />
                  <FormControlLabel value="no" control={<Radio size="small" />} label="No" />
                </RadioGroup>
              </Box>

              <Stack gap={1}>
                <FormControlLabel
                  control={
                    <Checkbox size="small" checked={consentData} onChange={(e) => setConsentData(e.target.checked)} />
                  }
                  label={
                    <Typography fontSize="0.9rem">
                      Yes, I give WSO2 permission to use my personal data for recruitment purposes only. *
                    </Typography>
                  }
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={consentChecks}
                      onChange={(e) => setConsentChecks(e.target.checked)}
                    />
                  }
                  label={
                    <Typography fontSize="0.9rem">
                      I give WSO2 permission to assess my suitability for employment and to conduct independent
                      reference checks and verify the information I provided, beyond what is on my résumé. *
                    </Typography>
                  }
                />
              </Stack>

              <Button
                variant="contained"
                size="large"
                disabled={!applyFormValid || submitting}
                onClick={handleSubmitApplication}
                sx={{ borderRadius: "999px", fontWeight: 700, alignSelf: "flex-start", px: 5 }}
              >
                {submitting ? "Submitting..." : "Submit"}
              </Button>
            </Stack>
          )}
        </Box>
      </Box>

      <Dialog
        open={submittedOpen}
        onClose={() => setSubmittedOpen(false)}
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
              backgroundColor: "rgba(16,185,129,0.15)",
              color: "#10B981",
            }}
          >
            <Check size={32} strokeWidth={3} />
          </Box>
          <Typography fontWeight={800} fontSize="1.4rem" color="text.primary" mb={1}>
            Application submitted!
          </Typography>
          <Typography fontSize="0.95rem" color="text.primary">
            You have submitted your application for {detail.title}. Thank you for applying.
            {isSignedIn && " You can follow the application status through My Applications."}
          </Typography>

          {/* The application is already sent, so asking a guest to sign in now costs them nothing. */}
          {!isSignedIn && (
            <Box
              sx={{
                mt: 2.5,
                p: 2,
                borderRadius: "12px",
                border: "1px solid #ff670040",
                backgroundColor: "#ff670010",
                textAlign: "left",
              }}
            >
              <Typography fontWeight={700} fontSize="0.95rem" color="text.primary" mb={0.5}>
                Keep your Candidate Passport
              </Typography>
              <Typography fontSize="0.9rem" color="text.primary">
                Create a free Candidate Passport to track the status of this application, see interview invites and
                offers, and reuse your CV for your next role.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", gap: 1, pb: 3, pt: 2 }}>
          {isSignedIn ? (
            <Button
              variant="contained"
              onClick={() => setSubmittedOpen(false)}
              sx={{ borderRadius: "999px", fontWeight: 700, px: 4 }}
            >
              Done
            </Button>
          ) : (
            <>
              <Button onClick={() => setSubmittedOpen(false)} sx={{ fontWeight: 600 }}>
                Not now
              </Button>
              <Button variant="contained" onClick={appSignIn} sx={{ borderRadius: "999px", fontWeight: 700, px: 3 }}>
                Sign in or create account
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default JobDetail;

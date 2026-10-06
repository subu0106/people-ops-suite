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

import { Avatar, Box, Button, Card, CardContent, Chip, CircularProgress, Dialog,
 DialogActions, DialogContent, DialogTitle, Grid, IconButton, MenuItem, Select, Stack, TextField, Tooltip, Typography } from "@mui/material";
import { ArrowRight, Briefcase, Check, Download, ExternalLink, FileText, Github, Globe,
   Link as LinkIcon, Linkedin, Mail, MapPin, Pencil, Phone, Plus, Shield, Sparkles, Star, Trash2 } from "lucide-react";
import type { Theme } from "@mui/material/styles";
import { useEffect, useRef, useState } from "react";

import { useAuthContext } from "@asgardeo/auth-react";

import ProfileSection from "@component/careers/ProfileSection";
import { SnackMessage } from "@config/constant";
import {
  activateResume,
  addPortfolioItem,
  addSkill,
  deleteResume,
  loadProfile,
  removePortfolioItem,
  removeSkill,
  updateProfile,
  uploadResume,
} from "@slices/careersSlice/careers";
import { enqueueSnackbarMessage } from "@slices/commonSlice/common";
import { RootState, useAppDispatch, useAppSelector } from "@slices/store";
import { CandidateProfile, PortfolioItem, State } from "@/types/types";
import { downloadResume } from "@utils/profileService";

const MAX_RESUME_BYTES = 5 * 1024 * 1024;

const PORTFOLIO_TYPE_LABELS: Record<PortfolioItem["type"], string> = {
  github: "GitHub repository",
  project: "Project",
  link: "Link",
};

const emptyPortfolioForm: Omit<PortfolioItem, "id"> = { title: "", url: "", description: "", type: "link" };

const skillChipSx = {
  fontWeight: 500,
  color: (theme: Theme) => (theme.palette.mode === "dark" ? "#6EE7B7" : "#047857"),
  backgroundColor: "rgba(16,185,129,0.12)",
  border: "1px solid rgba(16,185,129,0.35)",
  transition: "background-color 0.15s, transform 0.15s",
  "&:hover": { backgroundColor: "rgba(16,185,129,0.22)", transform: "translateY(-1px)" },
  "& .MuiChip-deleteIcon": { color: "#10B981" },
};

const Profile = () => {
  const dispatch = useAppDispatch();
  const { getAccessToken } = useAuthContext();

  const profile = useAppSelector((state: RootState) => state.careers.profile);
  const profileState = useAppSelector((state: RootState) => state.careers.profileState);

  const [newSkill, setNewSkill] = useState("");
  const [savedOpen, setSavedOpen] = useState(false);
  // Bumped for a section after it saves, to close its edit form.
  const [closeSignals, setCloseSignals] = useState<Record<string, number>>({});

  // The "Saved" pop-up dismisses itself shortly after it appears.
  useEffect(() => {
    if (!savedOpen) return;
    const timer = setTimeout(() => setSavedOpen(false), 2500);
    return () => clearTimeout(timer);
  }, [savedOpen]);
  // The portfolio dialog is the add flow when `editingPortfolioId` is null.
  const [portfolioDialogOpen, setPortfolioDialogOpen] = useState(false);
  const [editingPortfolioId, setEditingPortfolioId] = useState<string | null>(null);
  const [portfolioForm, setPortfolioForm] = useState(emptyPortfolioForm);
  const [portfolioError, setPortfolioError] = useState<string | null>(null);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [basicForm, setBasicForm] = useState({
    firstName: profile.firstName,
    lastName: profile.lastName,
    email: profile.email,
    phone: profile.phone,
    country: profile.country,
    address: profile.address,
    linkedIn: profile.linkedIn,
    github: profile.github,
  });
  const [profForm, setProfForm] = useState({
    currentRole: profile.currentRole,
    yearsOfExperience: profile.yearsOfExperience,
    university: profile.university,
    summary: profile.summary,
  });

  useEffect(() => {
    getAccessToken().then((token) => dispatch(loadProfile(token)));
  }, [dispatch, getAccessToken]);

  // Re-seed the edit forms whenever a fresh profile lands (initial load, or
  // after any save round-trips through the backend).
  useEffect(() => {
    setBasicForm({
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      phone: profile.phone,
      country: profile.country,
      address: profile.address,
      linkedIn: profile.linkedIn,
      github: profile.github,
    });
    setProfForm({
      currentRole: profile.currentRole,
      yearsOfExperience: profile.yearsOfExperience,
      university: profile.university,
      summary: profile.summary,
    });
  }, [profile]);

  // The "Saved" pop-up only appears once the backend has accepted the change.
  // A saved section drops back to its read-only view.
  const saveProfileChanges = (partial: Partial<CandidateProfile>, section: string) => {
    getAccessToken()
      .then((token) => dispatch(updateProfile({ accessToken: token, partial })).unwrap())
      .then(() => {
        setSavedOpen(true);
        setCloseSignals((prev) => ({ ...prev, [section]: (prev[section] ?? 0) + 1 }));
      })
      .catch(() =>
        dispatch(enqueueSnackbarMessage({ message: SnackMessage.error.saveProfile, type: "error" })),
      );
  };

  const handleSaveBasic = () => saveProfileChanges(basicForm, "basic");

  const handleSaveProf = () => saveProfileChanges(profForm, "professional");

  const handleAddSkill = () => {
    const trimmed = newSkill.trim();
    if (!trimmed) return;
    getAccessToken().then((token) => {
      dispatch(addSkill({ accessToken: token, skill: trimmed }));
      setNewSkill("");
    });
  };

  const handleOpenAddPortfolio = () => {
    setEditingPortfolioId(null);
    setPortfolioForm(emptyPortfolioForm);
    setPortfolioError(null);
    setPortfolioDialogOpen(true);
  };

  const handleOpenEditPortfolio = (item: PortfolioItem) => {
    setEditingPortfolioId(item.id);
    setPortfolioForm({ title: item.title, url: item.url, description: item.description, type: item.type });
    setPortfolioError(null);
    setPortfolioDialogOpen(true);
  };

  const handleSubmitPortfolio = () => {
    const title = portfolioForm.title.trim();
    const url = portfolioForm.url.trim();
    if (!title || !/^https?:\/\/\S+$/i.test(url)) {
      setPortfolioError("A title and a valid http(s) URL are required.");
      return;
    }
    const values = { ...portfolioForm, title, url, description: portfolioForm.description.trim() };
    getAccessToken().then((token) => {
      if (editingPortfolioId) {
        const portfolio = profile.portfolio.map((p) => (p.id === editingPortfolioId ? { ...p, ...values } : p));
        dispatch(updateProfile({ accessToken: token, partial: { portfolio } }));
      } else {
        dispatch(addPortfolioItem({ accessToken: token, item: values }));
      }
    });
    setPortfolioDialogOpen(false);
  };

  const handleDeletePortfolio = (itemId: string) => {
    getAccessToken().then((token) => dispatch(removePortfolioItem({ accessToken: token, itemId })));
  };

  const handleResumeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.type !== "application/pdf") {
      setResumeError("Only PDF files are accepted.");
      return;
    }
    if (file.size > MAX_RESUME_BYTES) {
      setResumeError("File must be 5MB or smaller.");
      return;
    }
    setResumeError(null);
    getAccessToken().then((token) => {
      dispatch(uploadResume({ accessToken: token, file }))
        .unwrap()
        .then(() => {
          dispatch(enqueueSnackbarMessage({ message: SnackMessage.success.resumeUploaded, type: "success" }));
        })
        .catch(() => setResumeError("Upload failed. Please try again."));
    });
  };

  const handleActivateResume = (resumeId: string) => {
    getAccessToken().then((token) => {
      dispatch(activateResume({ accessToken: token, resumeId }));
    });
  };

  const handleDeleteResume = (resumeId: string) => {
    getAccessToken().then((token) => {
      dispatch(deleteResume({ accessToken: token, resumeId }))
        .unwrap()
        .catch(() => setResumeError("This resume has been used in an application and can't be deleted."));
    });
  };

  const handleDownloadResume = (resumeId: string, name: string) => {
    getAccessToken().then((token) => downloadResume(token, resumeId, name));
  };

  // Sections the checklist can send the candidate to. A non-zero signal makes
  // that section open its editor; sections without an editor just scroll into view.
  const [editorSignals, setEditorSignals] = useState<Record<string, number>>({});

  const goToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setEditorSignals((prev) => ({ ...prev, [sectionId]: (prev[sectionId] ?? 0) + 1 }));
  };

  const missingItems = [
    { label: "Add your phone number", section: "basic", missing: !profile.phone },
    { label: "Add your address", section: "basic", missing: !profile.address },
    { label: "Link your LinkedIn", section: "basic", missing: !profile.linkedIn },
    { label: "Link your GitHub", section: "basic", missing: !profile.github },
    { label: "Add your current role", section: "professional", missing: !profile.currentRole },
    { label: "Write a professional summary", section: "professional", missing: !profile.summary },
    { label: "Add your university", section: "professional", missing: !profile.university },
    { label: "Add some skills", section: "skills", missing: profile.skills.length === 0 },
    { label: "Upload a resume", section: "resume", missing: profile.resumes.length === 0 },
    { label: "Add a portfolio item", section: "portfolio", missing: profile.portfolio.length === 0 },
  ].filter((item) => item.missing);

  if (profileState === State.loading && !profile.personId) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
        <CircularProgress size={32} sx={{ color: "#ff6700" }} />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ maxWidth: 1080, mx: "auto", px: { xs: 2, md: 3 }, pt: { xs: 2.5, md: 3 }, pb: { xs: 4, md: 5 } }}>
        <Typography
          component="h2"
          sx={{
            textAlign: "center",
            fontSize: { xs: "34px", md: "48px" },
            fontWeight: 800,
            lineHeight: 1.15,
            mb: 1.5,
          }}
        >
          <Box component="span" sx={{ color: "#ff6700" }}>
            Candidate
          </Box>{" "}
          <Box component="span" sx={{ color: "text.primary" }}>
            Passport
          </Box>
        </Typography>
        <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
          <Chip
            icon={<Shield size={13} color="#ff6700" />}
            label={`#${profile.personId}`}
            size="small"
            sx={{ backgroundColor: "#ff670015", color: "#ff6700", fontWeight: 600 }}
          />
        </Box>

      <Grid container spacing={3}>
        {/* Left — Profile Summary Card */}
        <Grid size={{ xs: 12, md: 3 }}>
          <Card
            elevation={0}
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: "12px",
              textAlign: "center",
              position: "sticky",
              top: 16,
              boxShadow: "0 24px 48px -24px rgba(11,18,32,0.45)",
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ position: "relative", display: "inline-flex", mb: 2 }}>
                <svg width={0} height={0} style={{ position: "absolute" }}>
                  <defs>
                    <linearGradient id="completionRing" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#ffa040" />
                      <stop offset="100%" stopColor="#ff6700" />
                    </linearGradient>
                  </defs>
                </svg>
                <CircularProgress
                  variant="determinate"
                  value={100}
                  size={100}
                  thickness={3}
                  sx={{ position: "absolute", color: "divider" }}
                />
                <CircularProgress
                  variant="determinate"
                  value={profile.completionPercentage}
                  size={100}
                  thickness={3}
                  sx={{ "& .MuiCircularProgress-circle": { stroke: "url(#completionRing)", strokeLinecap: "round" } }}
                />
                <Box
                  sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Avatar sx={{ width: 76, height: 76, fontSize: "24px", fontWeight: 800, backgroundColor: "#ff6700" }}>
                    {profile.firstName.charAt(0)}
                  </Avatar>
                </Box>
              </Box>

              <Typography fontWeight={700} fontSize="16px">
                {profile.firstName} {profile.lastName}
              </Typography>
              <Typography fontSize="0.9rem" color="text.secondary" mb={0.5}>
                {profile.currentRole}
              </Typography>
              <Typography fontSize="0.8rem" color="#ff6700" fontWeight={600} mb={2}>
                {profile.completionPercentage}% complete
              </Typography>

              <Stack gap={1}>
                <Stack direction="row" alignItems="center" gap={1}>
                  <Mail size={13} color="#9CA3AF" />
                  <Typography fontSize="0.8rem" color="text.secondary" noWrap>
                    {profile.email}
                  </Typography>
                </Stack>
                <Stack direction="row" alignItems="center" gap={1}>
                  <MapPin size={13} color="#9CA3AF" />
                  <Typography fontSize="0.8rem" color="text.secondary">
                    {profile.country}
                  </Typography>
                </Stack>
                <Stack direction="row" alignItems="center" gap={1}>
                  <Briefcase size={13} color="#9CA3AF" />
                  <Typography fontSize="0.8rem" color="text.secondary">
                    {profile.yearsOfExperience} years exp.
                  </Typography>
                </Stack>
              </Stack>

              {missingItems.length > 0 && (
                <Box sx={{ mt: 2.5, pt: 2, borderTop: "1px solid", borderColor: "divider", textAlign: "left" }}>
                  <Stack direction="row" alignItems="center" gap={0.75} mb={1}>
                    <Sparkles size={14} color="#ff6700" />
                    <Typography fontSize="0.8rem" fontWeight={700}>
                      Complete your profile
                    </Typography>
                  </Stack>
                  <Stack gap={0.5}>
                    {missingItems.slice(0, 5).map((item) => (
                      <Box
                        key={item.label}
                        component="button"
                        onClick={() => goToSection(item.section)}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 1,
                          width: "100%",
                          p: "6px 8px",
                          border: "none",
                          borderRadius: "8px",
                          background: "none",
                          cursor: "pointer",
                          fontSize: "12px",
                          color: "text.secondary",
                          textAlign: "left",
                          transition: "background 0.15s, color 0.15s",
                          "&:hover": { background: "#ff670012", color: "#ff6700" },
                        }}
                      >
                        <span>{item.label}</span>
                        <ArrowRight size={12} />
                      </Box>
                    ))}
                  </Stack>
                  {missingItems.length > 5 && (
                    <Typography fontSize="11px" color="text.secondary" mt={0.5} ml={1}>
                      +{missingItems.length - 5} more
                    </Typography>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right — Sections */}
        <Grid size={{ xs: 12, md: 9 }}>
          {/* Basic Info */}
          <ProfileSection
            id="basic"
            delay={0.05}
            openEditorSignal={editorSignals.basic}
            closeEditorSignal={closeSignals.basic}
            title="Basic Information"
            icon={<Shield size={16} />}
            editContent={
              <Stack gap={2}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="First Name"
                      value={basicForm.firstName}
                      onChange={(e) => setBasicForm({ ...basicForm, firstName: e.target.value })}
                      fullWidth
                      size="small"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Last Name"
                      value={basicForm.lastName}
                      onChange={(e) => setBasicForm({ ...basicForm, lastName: e.target.value })}
                      fullWidth
                      size="small"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Email"
                      value={basicForm.email}
                      onChange={(e) => setBasicForm({ ...basicForm, email: e.target.value })}
                      fullWidth
                      size="small"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Phone"
                      value={basicForm.phone}
                      onChange={(e) =>
                        // Digits only, with a single "+" allowed at the start for the country code.
                        setBasicForm({
                          ...basicForm,
                          phone: e.target.value.replace(/[^\d+]/g, "").replace(/(?!^)\+/g, "").slice(0, 16),
                        })
                      }
                      slotProps={{ htmlInput: { inputMode: "tel" } }}
                      fullWidth
                      size="small"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Country"
                      value={basicForm.country}
                      onChange={(e) => setBasicForm({ ...basicForm, country: e.target.value })}
                      fullWidth
                      size="small"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Address"
                      value={basicForm.address}
                      onChange={(e) => setBasicForm({ ...basicForm, address: e.target.value })}
                      fullWidth
                      size="small"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="LinkedIn URL"
                      value={basicForm.linkedIn}
                      onChange={(e) => setBasicForm({ ...basicForm, linkedIn: e.target.value })}
                      fullWidth
                      size="small"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="GitHub URL"
                      value={basicForm.github}
                      onChange={(e) => setBasicForm({ ...basicForm, github: e.target.value })}
                      fullWidth
                      size="small"
                    />
                  </Grid>
                </Grid>
                <Button variant="contained" size="small" onClick={handleSaveBasic} sx={{ alignSelf: "flex-start" }}>
                  Save Changes
                </Button>
              </Stack>
            }
          >
            <Grid container spacing={2}>
              {[
                { icon: <Mail size={14} />, label: "Email", value: profile.email },
                { icon: <Phone size={14} />, label: "Phone", value: profile.phone },
                { icon: <MapPin size={14} />, label: "Country", value: profile.country },
                { icon: <MapPin size={14} />, label: "Address", value: profile.address || "Not added" },
                {
                  icon: <Linkedin size={14} />,
                  label: "LinkedIn",
                  value: profile.linkedIn ? (
                    <Typography
                      component="a"
                      href={profile.linkedIn}
                      target="_blank"
                      fontSize="0.9rem"
                      sx={{ color: "#3B82F6", textDecoration: "none" }}
                    >
                      View Profile
                    </Typography>
                  ) : (
                    "Not added"
                  ),
                },
                {
                  icon: <Github size={14} />,
                  label: "GitHub",
                  value: profile.github ? (
                    <Typography
                      component="a"
                      href={profile.github}
                      target="_blank"
                      fontSize="0.9rem"
                      sx={{ color: "#3B82F6", textDecoration: "none" }}
                    >
                      View Profile
                    </Typography>
                  ) : (
                    "Not added"
                  ),
                },
              ].map((item, i) => (
                <Grid key={i} size={{ xs: 12, sm: 6 }}>
                  <Stack direction="row" gap={1} alignItems="flex-start">
                    <Box sx={{ color: "#9CA3AF", mt: 0.15 }}>{item.icon}</Box>
                    <Box>
                      <Typography fontSize="11px" color="text.secondary" fontWeight={600} textTransform="uppercase">
                        {item.label}
                      </Typography>
                      {typeof item.value === "string" ? (
                        <Typography fontSize="0.9rem">{item.value}</Typography>
                      ) : (
                        item.value
                      )}
                    </Box>
                  </Stack>
                </Grid>
              ))}
            </Grid>
          </ProfileSection>

          {/* Professional Details */}
          <ProfileSection
            id="professional"
            delay={0.12}
            openEditorSignal={editorSignals.professional}
            closeEditorSignal={closeSignals.professional}
            title="Professional Details"
            icon={<Briefcase size={16} />}
            editContent={
              <Stack gap={2}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Current Role"
                      value={profForm.currentRole}
                      onChange={(e) => setProfForm({ ...profForm, currentRole: e.target.value })}
                      fullWidth
                      size="small"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Years of Experience"
                      type="number"
                      value={profForm.yearsOfExperience}
                      onChange={(e) =>
                        setProfForm({ ...profForm, yearsOfExperience: parseInt(e.target.value) || 0 })
                      }
                      fullWidth
                      size="small"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="University (for internship applications)"
                      value={profForm.university}
                      onChange={(e) => setProfForm({ ...profForm, university: e.target.value })}
                      fullWidth
                      size="small"
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      label="Professional Summary"
                      value={profForm.summary}
                      onChange={(e) => setProfForm({ ...profForm, summary: e.target.value })}
                      fullWidth
                      size="small"
                      multiline
                      rows={3}
                    />
                  </Grid>
                </Grid>
                <Button variant="contained" size="small" onClick={handleSaveProf} sx={{ alignSelf: "flex-start" }}>
                  Save Changes
                </Button>
              </Stack>
            }
          >
            <Stack gap={2}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography fontSize="11px" color="text.secondary" fontWeight={600} textTransform="uppercase" mb={0.5}>
                    Current Role
                  </Typography>
                  <Typography fontSize="14px">{profile.currentRole}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography fontSize="11px" color="text.secondary" fontWeight={600} textTransform="uppercase" mb={0.5}>
                    Experience
                  </Typography>
                  <Typography fontSize="14px">{profile.yearsOfExperience} years</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography fontSize="11px" color="text.secondary" fontWeight={600} textTransform="uppercase" mb={0.5}>
                    University
                  </Typography>
                  <Typography fontSize="14px">{profile.university || "Not added"}</Typography>
                </Grid>
              </Grid>
              {profile.summary && (
                <Box>
                  <Typography fontSize="11px" color="text.secondary" fontWeight={600} textTransform="uppercase" mb={0.5}>
                    Summary
                  </Typography>
                  <Typography fontSize="14px" color="text.secondary" lineHeight={1.7}>
                    {profile.summary}
                  </Typography>
                </Box>
              )}
            </Stack>
          </ProfileSection>

          {/* Skills */}
          <ProfileSection
            id="skills"
            delay={0.19}
            openEditorSignal={editorSignals.skills}
            title="Skills"
            icon={<Star size={16} />}
            editContent={
              <Stack gap={2}>
                <Stack direction="row" gap={1} flexWrap="wrap">
                  {profile.skills.map((skill) => (
                    <Chip
                      key={skill}
                      label={skill}
                      size="small"
                      onDelete={() =>
                        getAccessToken().then((token) => dispatch(removeSkill({ accessToken: token, skill })))
                      }
                      deleteIcon={<Trash2 size={12} />}
                      sx={skillChipSx}
                    />
                  ))}
                </Stack>
                <Stack direction="row" gap={1} alignItems="center">
                  <TextField
                    size="small"
                    placeholder="Add a skill"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddSkill()}
                    sx={{ maxWidth: 260 }}
                  />
                  <Button variant="outlined" size="small" startIcon={<Plus size={14} />} onClick={handleAddSkill}>
                    Add
                  </Button>
                </Stack>
              </Stack>
            }
          >
            <Stack direction="row" gap={1} flexWrap="wrap">
              {profile.skills.map((skill) => (
                <Chip key={skill} label={skill} size="small" sx={skillChipSx} />
              ))}
              {profile.skills.length === 0 && (
                <Typography fontSize="0.9rem" color="text.secondary">
                  No skills added yet.
                </Typography>
              )}
            </Stack>
          </ProfileSection>

          {/* Resume Management */}
          <ProfileSection id="resume" delay={0.26} title="Resume" icon={<FileText size={16} />}>
            <Stack gap={1.5}>
              {profile.resumes.map((resume) => (
                <Box
                  key={resume.id}
                  sx={{
                    p: 2,
                    borderRadius: "8px",
                    border: "1px solid",
                    borderColor: resume.isActive ? "#ff6700" : "divider",
                    backgroundColor: resume.isActive ? "#ff670008" : "transparent",
                    transition: "border-color 0.15s, background-color 0.15s",
                    "&:hover": { borderColor: "#ff6700", backgroundColor: "#ff670008" },
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 1,
                  }}
                >
                  <Stack direction="row" alignItems="center" gap={1.5}>
                    <FileText size={18} color={resume.isActive ? "#ff6700" : "#9CA3AF"} />
                    <Box>
                      <Typography fontSize="0.9rem" fontWeight={600}>
                        {resume.name}
                      </Typography>
                      <Typography fontSize="11px" color="text.secondary">
                        Uploaded {resume.uploadedAt}
                      </Typography>
                    </Box>
                  </Stack>
                  <Stack direction="row" alignItems="center" gap={0.5}>
                    {resume.isActive ? (
                      <Chip
                        label="Active"
                        size="small"
                        sx={{ fontSize: "10px", height: 20, backgroundColor: "rgba(16,185,129,0.14)", color: "#10B981", fontWeight: 600, mr: 0.5 }}
                      />
                    ) : (
                      <Tooltip title="Set as active">
                        <IconButton size="small" onClick={() => handleActivateResume(resume.id)}>
                          <Check size={14} />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Download">
                      <IconButton size="small" onClick={() => handleDownloadResume(resume.id, resume.name)}>
                        <Download size={14} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" onClick={() => handleDeleteResume(resume.id)}>
                        <Trash2 size={14} />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Box>
              ))}
              {resumeError && (
                <Typography fontSize="0.9rem" color="error.main">
                  {resumeError}
                </Typography>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                hidden
                onChange={handleResumeFileChange}
              />
              <Button
                variant="outlined"
                size="small"
                startIcon={<Plus size={14} />}
                onClick={() => fileInputRef.current?.click()}
                sx={{ alignSelf: "flex-start", borderRadius: "8px" }}
              >
                Upload New Resume
              </Button>
            </Stack>
          </ProfileSection>

          {/* Portfolio */}
          <ProfileSection id="portfolio" delay={0.33} title="Portfolio" icon={<Globe size={16} />}>
            <Stack gap={1.5}>
              {profile.portfolio.map((item) => (
                <Box
                  key={item.id}
                  sx={{
                    p: 2,
                    borderRadius: "8px",
                    border: "1px solid",
                    borderColor: "divider",
                    transition: "border-color 0.15s, background-color 0.15s",
                    "&:hover": { borderColor: "#ff6700", backgroundColor: "#ff670008" },
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 1,
                  }}
                >
                  <Stack direction="row" alignItems="center" gap={1.5}>
                    {item.type === "github" ? (
                      <Github size={18} color="#9CA3AF" />
                    ) : (
                      <LinkIcon size={18} color="#9CA3AF" />
                    )}
                    <Box>
                      <Typography fontSize="0.9rem" fontWeight={600}>
                        {item.title}
                      </Typography>
                      {item.description && (
                        <Typography fontSize="11px" color="text.secondary">
                          {item.description}
                        </Typography>
                      )}
                    </Box>
                  </Stack>
                  <Stack direction="row" alignItems="center" gap={0.5}>
                    <Tooltip title="Open">
                      <IconButton size="small" component="a" href={item.url} target="_blank" rel="noreferrer">
                        <ExternalLink size={14} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => handleOpenEditPortfolio(item)}>
                        <Pencil size={14} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" onClick={() => handleDeletePortfolio(item.id)}>
                        <Trash2 size={14} />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Box>
              ))}
              {profile.portfolio.length === 0 && (
                <Typography fontSize="0.9rem" color="text.secondary">
                  No portfolio items added.
                </Typography>
              )}
              <Button
                variant="outlined"
                size="small"
                startIcon={<Plus size={14} />}
                onClick={handleOpenAddPortfolio}
                sx={{ alignSelf: "flex-start", borderRadius: "8px" }}
              >
                Add Portfolio Item
              </Button>
            </Stack>

            <Dialog open={portfolioDialogOpen} onClose={() => setPortfolioDialogOpen(false)} fullWidth maxWidth="sm">
              <DialogTitle sx={{ fontWeight: 700 }}>
                {editingPortfolioId ? "Edit Portfolio Item" : "Add Portfolio Item"}
              </DialogTitle>
              <DialogContent>
                <Stack gap={2} sx={{ pt: 1 }}>
                  <TextField
                    label="Title"
                    value={portfolioForm.title}
                    onChange={(e) => setPortfolioForm({ ...portfolioForm, title: e.target.value })}
                    fullWidth
                    size="small"
                  />
                  <Select
                    size="small"
                    fullWidth
                    value={portfolioForm.type}
                    onChange={(e) =>
                      setPortfolioForm({ ...portfolioForm, type: e.target.value as PortfolioItem["type"] })
                    }
                  >
                    {(Object.keys(PORTFOLIO_TYPE_LABELS) as PortfolioItem["type"][]).map((type) => (
                      <MenuItem key={type} value={type}>
                        {PORTFOLIO_TYPE_LABELS[type]}
                      </MenuItem>
                    ))}
                  </Select>
                  <TextField
                    label="URL"
                    placeholder="https://"
                    value={portfolioForm.url}
                    onChange={(e) => setPortfolioForm({ ...portfolioForm, url: e.target.value })}
                    fullWidth
                    size="small"
                  />
                  <TextField
                    label="Description (optional)"
                    value={portfolioForm.description}
                    onChange={(e) => setPortfolioForm({ ...portfolioForm, description: e.target.value })}
                    fullWidth
                    size="small"
                    multiline
                    rows={3}
                  />
                  {portfolioError && (
                    <Typography fontSize="0.9rem" color="error.main">
                      {portfolioError}
                    </Typography>
                  )}
                </Stack>
              </DialogContent>
              <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={() => setPortfolioDialogOpen(false)}>Cancel</Button>
                <Button variant="contained" onClick={handleSubmitPortfolio}>
                  {editingPortfolioId ? "Save" : "Add"}
                </Button>
              </DialogActions>
            </Dialog>
          </ProfileSection>
        </Grid>
      </Grid>

      <Dialog
        open={savedOpen}
        onClose={() => setSavedOpen(false)}
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
            Saved!
          </Typography>
          <Typography fontSize="0.95rem" color="text.primary">
            Your profile changes have been saved.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", pb: 3, pt: 2 }}>
          <Button variant="contained" onClick={() => setSavedOpen(false)} sx={{ borderRadius: "999px", fontWeight: 700, px: 4 }}>
            Done
          </Button>
        </DialogActions>
      </Dialog>
      </Box>
    </Box>
  );
};

export default Profile;

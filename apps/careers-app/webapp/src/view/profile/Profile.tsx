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

import { Avatar, Box, Button, Card, CardContent, Checkbox, Chip, CircularProgress, FormControlLabel,
 Grid, IconButton, MenuItem, Radio, RadioGroup, Select, Stack, TextField, Tooltip, Typography } from "@mui/material";
import { Briefcase, Check, Download, FileText, Github, Globe,
   Link as LinkIcon, Linkedin, Mail, MapPin, Phone, Plus, Shield, Star, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { useAuthContext } from "@asgardeo/auth-react";

import ProfileSection from "@component/careers/ProfileSection";
import { SnackMessage } from "@config/constant";
import {
  activateResume,
  addSkill,
  deleteResume,
  loadProfile,
  removeSkill,
  submitApplication,
  updateProfile,
  uploadResume,
} from "@slices/careersSlice/careers";
import { enqueueSnackbarMessage } from "@slices/commonSlice/common";
import { RootState, useAppDispatch, useAppSelector } from "@slices/store";
import { State } from "@/types/types";
import { downloadResume } from "@utils/profileService";
import { VacancyDetail, fetchVacancyDetail } from "@utils/vacancyService";

const MAX_RESUME_BYTES = 5 * 1024 * 1024;

const Profile = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { getAccessToken } = useAuthContext();

  const profile = useAppSelector((state: RootState) => state.careers.profile);
  const profileState = useAppSelector((state: RootState) => state.careers.profileState);

  const applyForJobId = searchParams.get("applyFor");
  const [applyForJob, setApplyForJob] = useState<VacancyDetail | null>(null);
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [authorized, setAuthorized] = useState<"yes" | "no" | "">("");
  const [consentData, setConsentData] = useState(false);
  const [consentChecks, setConsentChecks] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [newSkill, setNewSkill] = useState("");
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

  useEffect(() => {
    if (!selectedResumeId) {
      const active = profile.resumes.find((r) => r.isActive) ?? profile.resumes[0];
      if (active) setSelectedResumeId(active.id);
    }
  }, [profile.resumes, selectedResumeId]);

  useEffect(() => {
    if (!applyForJobId) {
      setApplyForJob(null);
      return;
    }
    getAccessToken()
      .then((token) => fetchVacancyDetail(applyForJobId, token))
      .then(setApplyForJob)
      .catch(() => setApplyForJob(null));
  }, [applyForJobId, getAccessToken]);

  const handleSaveBasic = () => {
    getAccessToken().then((token) => {
      dispatch(updateProfile({ accessToken: token, partial: basicForm }));
      dispatch(enqueueSnackbarMessage({ message: SnackMessage.success.profileUpdated, type: "success" }));
    });
  };

  const handleSaveProf = () => {
    getAccessToken().then((token) => {
      dispatch(updateProfile({ accessToken: token, partial: profForm }));
      dispatch(enqueueSnackbarMessage({ message: SnackMessage.success.profileUpdated, type: "success" }));
    });
  };

  const handleAddSkill = () => {
    const trimmed = newSkill.trim();
    if (!trimmed) return;
    getAccessToken().then((token) => {
      dispatch(addSkill({ accessToken: token, skill: trimmed }));
      setNewSkill("");
    });
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

  const applyFormValid =
    !!applyForJob && !!selectedResumeId && !!authorized && consentData && consentChecks;

  const handleSubmitApplication = () => {
    if (!applyFormValid || !applyForJob) return;
    setSubmitting(true);
    getAccessToken()
      .then((token) =>
        dispatch(submitApplication({ accessToken: token, jobId: applyForJob.id, resumeId: selectedResumeId })).unwrap(),
      )
      .then(() => {
        dispatch(enqueueSnackbarMessage({ message: SnackMessage.success.applicationSubmitted, type: "success" }));
        setSearchParams({});
        navigate("/applications");
      })
      .catch((err) => {
        const message =
          err?.response?.data?.detail ?? SnackMessage.error.submitApplication;
        dispatch(enqueueSnackbarMessage({ message, type: "error" }));
      })
      .finally(() => setSubmitting(false));
  };

  const getCompletionColor = () => {
    if (profile.completionPercentage >= 80) return "#10B981";
    if (profile.completionPercentage >= 50) return "#F59E0B";
    return "#EF4444";
  };

  if (profileState === State.loading && !profile.personId) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
        <CircularProgress size={32} sx={{ color: "#ff6700" }} />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1080, mx: "auto", px: { xs: 2, md: 3 }, py: { xs: 4, md: 5 } }}>
      {/* Header */}
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" mb={3}>
        <Box>
          <Typography variant="h2" fontWeight={700} mb={0.5}>
            <Box component="span" sx={{ color: "#ff6700" }}>
              Candidate
            </Box>{" "}
            <Box component="span" sx={{ color: "#17223A" }}>
              Passport
            </Box>
          </Typography>
          <Typography color="text.secondary" fontSize="14px">
            Your persistent professional identity applies to every WSO2 job automatically.
          </Typography>
        </Box>
        <Chip
          icon={<Shield size={13} />}
          label={`#${profile.personId}`}
          size="small"
          sx={{ backgroundColor: "#ff670015", color: "#ff6700", fontWeight: 600 }}
        />
      </Stack>

      {/* Apply-for-job card — shown whenever we arrived via a job's Apply button */}
      {applyForJobId && applyForJob && (
        <Card
          elevation={0}
          sx={{ border: "2px solid", borderColor: "primary.main", borderRadius: "12px", mb: 3 }}
        >
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={700} mb={0.5}>
              Apply for {applyForJob.title}
            </Typography>
            <Typography color="text.secondary" fontSize="13px" mb={2.5}>
              {applyForJob.team} · {applyForJob.country.join(", ")}
            </Typography>

            <Grid container spacing={2} mb={2.5}>
              {[
                { label: "Name", value: `${profile.firstName} ${profile.lastName}`.trim() || "Not set" },
                { label: "Email", value: profile.email || "Not set" },
                { label: "Phone", value: profile.phone || "Not set" },
                { label: "Address", value: profile.address || "Not set" },
              ].map((f) => (
                <Grid key={f.label} size={{ xs: 12, sm: 6 }}>
                  <Typography fontSize="11px" color="text.secondary" fontWeight={600} textTransform="uppercase">
                    {f.label}
                  </Typography>
                  <Typography fontSize="14px">{f.value}</Typography>
                </Grid>
              ))}
            </Grid>
            <Typography fontSize="12px" color="text.secondary" mb={2.5}>
              Need to change any of these? Edit them in Basic Information / Professional Details below, then come
              back here.
            </Typography>

            <Stack gap={2.5}>
              <Box>
                <Typography fontSize="13px" fontWeight={600} mb={0.75}>
                  Resume
                </Typography>
                <Select
                  size="small"
                  fullWidth
                  value={selectedResumeId}
                  onChange={(e) => setSelectedResumeId(e.target.value)}
                  displayEmpty
                >
                  {profile.resumes.length === 0 && (
                    <MenuItem value="" disabled>
                      No resumes uploaded — add one in the Resume section below
                    </MenuItem>
                  )}
                  {profile.resumes.map((r) => (
                    <MenuItem key={r.id} value={r.id}>
                      {r.name} {r.isActive && "(Active)"}
                    </MenuItem>
                  ))}
                </Select>
              </Box>

              <Box>
                <Typography fontSize="13px" fontWeight={600} mb={0.5}>
                  Do you have authorization to work in this job's location? *
                </Typography>
                <RadioGroup row value={authorized} onChange={(e) => setAuthorized(e.target.value as "yes" | "no")}>
                  <FormControlLabel value="yes" control={<Radio size="small" />} label="Yes" />
                  <FormControlLabel value="no" control={<Radio size="small" />} label="No" />
                </RadioGroup>
              </Box>

              <Stack gap={1}>
                <FormControlLabel
                  control={<Checkbox size="small" checked={consentData} onChange={(e) => setConsentData(e.target.checked)} />}
                  label={
                    <Typography fontSize="13px">
                      Yes, I give WSO2 permission to use my personal data for recruitment purposes only.
                    </Typography>
                  }
                />
                <FormControlLabel
                  control={<Checkbox size="small" checked={consentChecks} onChange={(e) => setConsentChecks(e.target.checked)} />}
                  label={
                    <Typography fontSize="13px">
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
                sx={{ borderRadius: "999px", fontWeight: 700, alignSelf: "flex-start", px: 4 }}
              >
                {submitting ? "Submitting..." : `Submit Application for ${applyForJob.title}`}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}

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
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ position: "relative", display: "inline-flex", mb: 2 }}>
                <CircularProgress
                  variant="determinate"
                  value={profile.completionPercentage}
                  size={100}
                  thickness={3}
                  sx={{ color: getCompletionColor() }}
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
              <Typography fontSize="13px" color="text.secondary" mb={0.5}>
                {profile.currentRole}
              </Typography>
              <Typography fontSize="12px" color={getCompletionColor()} fontWeight={600} mb={2}>
                {profile.completionPercentage}% complete
              </Typography>

              <Stack gap={1}>
                <Stack direction="row" alignItems="center" gap={1}>
                  <Mail size={13} color="#9CA3AF" />
                  <Typography fontSize="12px" color="text.secondary" noWrap>
                    {profile.email}
                  </Typography>
                </Stack>
                <Stack direction="row" alignItems="center" gap={1}>
                  <MapPin size={13} color="#9CA3AF" />
                  <Typography fontSize="12px" color="text.secondary">
                    {profile.country}
                  </Typography>
                </Stack>
                <Stack direction="row" alignItems="center" gap={1}>
                  <Briefcase size={13} color="#9CA3AF" />
                  <Typography fontSize="12px" color="text.secondary">
                    {profile.yearsOfExperience} years exp.
                  </Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Right — Sections */}
        <Grid size={{ xs: 12, md: 9 }}>
          {/* Basic Info */}
          <ProfileSection
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
                      onChange={(e) => setBasicForm({ ...basicForm, phone: e.target.value })}
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
                      fontSize="13px"
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
                      fontSize="13px"
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
                        <Typography fontSize="13px">{item.value}</Typography>
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
                      sx={{ fontWeight: 500 }}
                    />
                  ))}
                </Stack>
                <Stack direction="row" gap={1} alignItems="center">
                  <TextField
                    size="small"
                    placeholder="Add a skill (e.g., Golang)"
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
                <Chip key={skill} label={skill} size="small" sx={{ fontWeight: 500 }} />
              ))}
              {profile.skills.length === 0 && (
                <Typography fontSize="13px" color="text.secondary">
                  No skills added yet.
                </Typography>
              )}
            </Stack>
          </ProfileSection>

          {/* Resume Management */}
          <ProfileSection title="Resume" icon={<FileText size={16} />}>
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
                      <Typography fontSize="13px" fontWeight={600}>
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
                        sx={{ fontSize: "10px", height: 20, backgroundColor: "#ECFDF5", color: "#10B981", fontWeight: 600, mr: 0.5 }}
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
                <Typography fontSize="13px" color="error.main">
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
          <ProfileSection title="Portfolio" icon={<Globe size={16} />}>
            <Stack gap={1.5}>
              {profile.portfolio.map((item) => (
                <Box
                  key={item.id}
                  sx={{
                    p: 2,
                    borderRadius: "8px",
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
                    <Stack direction="row" gap={1.5} alignItems="flex-start">
                      {item.type === "github" ? (
                        <Github size={16} color="#9CA3AF" />
                      ) : (
                        <LinkIcon size={16} color="#9CA3AF" />
                      )}
                      <Box>
                        <Typography fontSize="13px" fontWeight={600}>
                          {item.title}
                        </Typography>
                        <Typography fontSize="12px" color="text.secondary" lineHeight={1.6}>
                          {item.description}
                        </Typography>
                      </Box>
                    </Stack>
                    <Typography
                      component="a"
                      href={item.url}
                      target="_blank"
                      fontSize="12px"
                      sx={{ color: "#3B82F6", textDecoration: "none", fontWeight: 600, whiteSpace: "nowrap" }}
                    >
                      View →
                    </Typography>
                  </Stack>
                </Box>
              ))}
              {profile.portfolio.length === 0 && (
                <Typography fontSize="13px" color="text.secondary">
                  No portfolio items added.
                </Typography>
              )}
            </Stack>
          </ProfileSection>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Profile;

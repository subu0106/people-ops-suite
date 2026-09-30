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

import { Box, Button, Grid, Skeleton, Stack, Typography } from "@mui/material";
import { ArrowRight, Bookmark, BookmarkCheck, Facebook, Linkedin, Twitter } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useAuthContext } from "@asgardeo/auth-react";

import { loadJobDetail, toggleSaveJob } from "@slices/careersSlice/careers";
import { RootState, useAppDispatch, useAppSelector } from "@slices/store";

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
  fontSize: "15px",
  lineHeight: 1.8,
  color: "text.secondary",
  "& h1, & h2, & h3": { color: "text.primary", fontWeight: 700, mt: 3, mb: 1.5, fontSize: "20px" },
  "& ul, & ol": { pl: 2.5 },
  "& li": { mb: 0.75 },
  "& p": { mb: 1.5 },
  "& strong": { color: "text.primary" },
} as const;

const JobDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { getAccessToken } = useAuthContext();

  const savedJobIds = useAppSelector((state: RootState) => state.careers.savedJobIds);
  const applications = useAppSelector((state: RootState) => state.careers.applications);
  const detail = useAppSelector((state: RootState) => (id ? state.careers.jobDetails[id] : undefined)) ?? null;

  const [loading, setLoading] = useState(!detail);
  const [error, setError] = useState(false);

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
  const color = teamColors[detail.team] ?? "#6B7280";
  const officeLabel = detail.officeLocations.length > 0 ? detail.officeLocations.join(", ") : "Remote";
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

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
                variant="h3"
                fontWeight={800}
                sx={{ color: "#fff", textWrap: "balance", fontSize: { xs: "30px", md: "42px" }, mb: 3 }}
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
              ) : (
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate(`/profile?applyFor=${detail.id}`)}
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
                      <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", fontWeight: 700, letterSpacing: "0.05em" }}>
                        {row.label}
                      </Typography>
                      <Typography sx={{ color: "#fff", fontWeight: 600, fontSize: "14px" }}>{row.value}</Typography>
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
      </Box>
    </Box>
  );
};

export default JobDetail;

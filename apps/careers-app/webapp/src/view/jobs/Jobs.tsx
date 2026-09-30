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
  Grid,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { useAuthContext } from "@asgardeo/auth-react";

import JobCard from "@component/careers/JobCard";
import JobCardSkeleton from "@component/careers/JobCardSkeleton";
import JobFilters, { JobFilterValues } from "@component/careers/JobFilters";
const SECTION_MAX_WIDTH = 1080;
import { State } from "@/types/types";
import { loadJobs, loadOrgStructure } from "@slices/careersSlice/careers";
import { RootState, useAppDispatch, useAppSelector } from "@slices/store";

const Jobs = () => {
  const dispatch = useAppDispatch();
  const { getAccessToken } = useAuthContext();
  const jobs = useAppSelector((state: RootState) => state.careers.jobs);
  const jobsState = useAppSelector((state: RootState) => state.careers.jobsState);
  const savedJobIds = useAppSelector((state: RootState) => state.careers.savedJobIds);

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState<"available" | "saved">("available");
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  // Job type isn't a dropdown on the real site's filter bar (Team + Location
  // only) -- it's still supported as a silent deep-link constraint so the
  // Internships teaser's "Available Positions" link keeps working. Captured
  // once on mount, not synced back to the URL below (it never changes from
  // the UI, only ever arrives via a deep link).
  const [urlJobType] = useState(searchParams.get("jobType") ?? "");
  const [filters, setFilters] = useState<JobFilterValues>({
    team: searchParams.getAll("team"),
    location: searchParams.getAll("location"),
  });

  // Keeps the URL in sync with the current search/filter state -- without
  // this, clearing or changing filters through the UI updates what's shown
  // but leaves the URL (and therefore a refresh, share, or back-navigation)
  // stuck on whatever query params the page first loaded with.
  useEffect(() => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    filters.location.forEach((loc) => params.append("location", loc));
    filters.team.forEach((team) => params.append("team", team));
    if (urlJobType) params.set("jobType", urlJobType);
    setSearchParams(params, { replace: true });
  }, [search, filters, urlJobType, setSearchParams]);

  const orgStructureState = useAppSelector((state: RootState) => state.careers.orgStructureState);

  useEffect(() => {
    if (jobsState !== State.idle && orgStructureState !== State.idle) return;
    getAccessToken()
      .then((token) => {
        if (jobsState === State.idle) dispatch(loadJobs(token));
        if (orgStructureState === State.idle) dispatch(loadOrgStructure(token));
      })
      .catch(() => {
        dispatch({ type: "careers/loadJobs/rejected" });
      });
  }, [dispatch, getAccessToken, jobsState, orgStructureState]);

  const sourceJobs = useMemo(
    () => (tab === "saved" ? jobs.filter((job) => savedJobIds.includes(job.id)) : jobs),
    [jobs, tab, savedJobIds],
  );

  const filtered = useMemo(() => {
    return sourceJobs.filter((job) => {
      const matchesSearch =
        !search ||
        job.title.toLowerCase().includes(search.toLowerCase()) ||
        job.team.toLowerCase().includes(search.toLowerCase());

      const matchesLocation =
        filters.location.length === 0 ||
        job.country.some((c) =>
          filters.location.some(
            (loc) => c.toLowerCase().includes(loc.toLowerCase()) || loc.toLowerCase().includes(c.toLowerCase()),
          ),
        );

      const matchesTeam = filters.team.length === 0 || filters.team.includes(job.team);

      const matchesJobType = !urlJobType || job.jobType === urlJobType;

      return matchesSearch && matchesLocation && matchesTeam && matchesJobType;
    });
  }, [sourceJobs, search, filters, urlJobType]);

  return (
    <Box>
      <Box sx={{ maxWidth: SECTION_MAX_WIDTH, mx: "auto", px: { xs: 2, md: 3 }, py: { xs: 4, md: 5 } }}>
      <Typography
        component="h2"
        sx={{
          textAlign: "center",
          fontSize: { xs: "34px", md: "48px" },
          fontWeight: 800,
          lineHeight: 1.15,
          mb: 4,
        }}
      >
        <Box component="span" sx={{ color: "#ff6700" }}>
          Available
        </Box>{" "}
        <Box component="span" sx={{ color: "#17223A" }}>
          positions
        </Box>
      </Typography>

      {/* Available / Saved tabs */}
      <Stack direction="row" gap={1} mb={3}>
        <Button
          onClick={() => setTab("available")}
          sx={{
            borderRadius: "999px",
            fontWeight: 700,
            px: 2.5,
            backgroundColor: tab === "available" ? "#ff6700" : "transparent",
            color: tab === "available" ? "#fff" : "text.secondary",
            border: "1px solid",
            borderColor: tab === "available" ? "#ff6700" : "divider",
            "&:hover": { backgroundColor: tab === "available" ? "#e05c00" : "action.hover" },
          }}
        >
          Available Positions
        </Button>
        <Button
          onClick={() => setTab("saved")}
          sx={{
            borderRadius: "999px",
            fontWeight: 700,
            px: 2.5,
            backgroundColor: tab === "saved" ? "#ff6700" : "transparent",
            color: tab === "saved" ? "#fff" : "text.secondary",
            border: "1px solid",
            borderColor: tab === "saved" ? "#ff6700" : "divider",
            "&:hover": { backgroundColor: tab === "saved" ? "#e05c00" : "action.hover" },
          }}
        >
          Saved Jobs ({savedJobIds.length})
        </Button>
      </Stack>

      {/* Search & Filters */}
      <Stack gap={2} mb={3}>
        <TextField
          placeholder="Search by job title or team..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search size={16} color="#9CA3AF" />
              </InputAdornment>
            ),
            sx: {
              borderRadius: "10px",
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: "primary.main",
              },
            },
          }}
        />
        <JobFilters filters={filters} onChange={setFilters} />
      </Stack>

      {/* Loading */}
      {jobsState === State.loading && (
        <Grid container spacing={2}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
              <JobCardSkeleton />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Error */}
      {jobsState === State.failed && (
        <Box
          sx={{
            py: 8,
            textAlign: "center",
            border: "1px dashed",
            borderColor: "error.light",
            borderRadius: "12px",
          }}
        >
          <Typography color="error">Failed to load jobs. Please try again later.</Typography>
        </Box>
      )}

      {/* Results */}
      {jobsState === State.success && (
        <>
          <Typography fontSize="13px" color="text.secondary" mb={2}>
            Showing {filtered.length} of {sourceJobs.length} jobs
          </Typography>

          {filtered.length === 0 ? (
            <Box
              sx={{
                py: 8,
                textAlign: "center",
                border: "1px dashed",
                borderColor: "divider",
                borderRadius: "12px",
              }}
            >
              <Typography color="text.secondary">
                {tab === "saved" && sourceJobs.length === 0
                  ? "You haven't saved any jobs yet. Click the bookmark icon on a job card to save it here."
                  : "No jobs match your search. Try adjusting the filters."}
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {filtered.map((job) => (
                <Grid key={job.id} size={{ xs: 12, sm: 6, md: 4 }}>
                  <JobCard job={job} onApply={(job) => navigate(`/profile?applyFor=${job.id}`)} />
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}
      </Box>
    </Box>
  );
};

export default Jobs;

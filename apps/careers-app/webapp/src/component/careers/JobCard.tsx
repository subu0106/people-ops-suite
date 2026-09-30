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

// Styled after wso2.com/careers' own vacancy card (the `.pd-card`/`.pd-tier`/
// `.pd-tag` design): a team pill, a divider-underlined title, job-type +
// location tags, and a "See details" arrow-link footer. Save/quick-apply are
// our own additions on top, kept as small corner icons so they don't disturb
// the real layout.

import { Box, Stack, Tooltip, Typography } from "@mui/material";
import { ArrowRight, Bookmark, BookmarkCheck, Send } from "lucide-react";
import { Link } from "react-router-dom";

import { Job } from "@/types/types";
import { toggleSaveJob } from "@slices/careersSlice/careers";
import { RootState, useAppDispatch, useAppSelector } from "@slices/store";

interface JobCardProps {
  job: Job;
  onApply?: (job: Job) => void;
}

const JobCard = ({ job, onApply }: JobCardProps) => {
  const dispatch = useAppDispatch();
  const savedJobIds = useAppSelector((state: RootState) => state.careers.savedJobIds);
  const isSaved = savedJobIds.includes(job.id);

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(toggleSaveJob(job.id));
  };

  const handleApply = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onApply?.(job);
  };

  return (
    <Box component={Link} to={`/jobs/${job.id}`} sx={{ textDecoration: "none", display: "block", height: "100%" }}>
      <Box
        sx={{
          position: "relative",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "30px 28px 28px",
          border: "1px solid #e2e5ec",
          borderRadius: "14px",
          boxShadow: "0 18px 40px -16px rgb(7 20 46 / 18%)",
          backgroundColor: "#fff",
          transition: "transform 0.15s, box-shadow 0.15s, border-color 0.15s",
          "&:hover": {
            transform: "translateY(-2px)",
            boxShadow: "0 18px 40px -16px rgb(7 20 46 / 18%)",
            borderColor: "#d5d9e2",
          },
        }}
      >
        {/* Save / quick-apply corner icons */}
        <Stack direction="row" gap={0.5} sx={{ position: "absolute", top: 14, right: 14 }}>
          {onApply && (
            <Tooltip title="Quick apply" arrow>
              <Box
                component="button"
                onClick={handleApply}
                sx={{
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  p: 0.5,
                  borderRadius: "6px",
                  color: "#6b7591",
                  "&:hover": { color: "#ff6700", backgroundColor: "#f4f5f8" },
                }}
              >
                <Send size={15} />
              </Box>
            </Tooltip>
          )}
          <Tooltip title={isSaved ? "Unsave" : "Save job"} arrow>
            <Box
              component="button"
              onClick={handleSave}
              sx={{
                border: "none",
                background: "none",
                cursor: "pointer",
                p: 0.5,
                borderRadius: "6px",
                color: isSaved ? "#ff6700" : "#6b7591",
                "&:hover": { backgroundColor: "#f4f5f8" },
              }}
            >
              {isSaved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
            </Box>
          </Tooltip>
        </Stack>

        {/* Team pill */}
        <Box
          sx={{
            alignSelf: "flex-start",
            marginBottom: "16px",
            padding: "6px 10px",
            borderRadius: "999px",
            backgroundColor: "#ffe0cc",
            color: "#e55a00",
            fontSize: "11px",
            fontWeight: 700,
            lineHeight: 1.5,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          {job.team}
        </Box>

        {/* Title */}
        <Typography
          sx={{
            margin: "0 0 16px",
            paddingBottom: "16px",
            borderBottom: "1px solid #e2e5ec",
            fontSize: "1.2rem",
            lineHeight: "1.8rem",
            fontWeight: 700,
            color: "#17223a",
          }}
        >
          {job.title}
        </Typography>

        {/* Tags */}
        <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ marginBottom: "18px" }}>
          <Box
            sx={{
              padding: "4px 9px",
              backgroundColor: "#f4f5f8",
              border: "1px solid #e2e5ec",
              borderRadius: "999px",
              fontSize: "11.5px",
              fontWeight: 500,
              color: "#17223a",
            }}
          >
            {job.jobType}
          </Box>
          {job.country.map((c) => (
            <Box
              key={c}
              sx={{
                padding: "4px 9px",
                backgroundColor: "#dceffd",
                border: "1px solid transparent",
                borderRadius: "999px",
                fontSize: "11.5px",
                fontWeight: 500,
                color: "#17223a",
              }}
            >
              {c}
            </Box>
          ))}
        </Stack>

        {/* Footer CTA */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="flex-end"
          gap={0.5}
          sx={{ marginTop: "auto", paddingTop: "30px" }}
        >
          <Typography sx={{ fontSize: "0.9rem", fontWeight: 600, color: "#17223a" }}>See details</Typography>
          <ArrowRight size={14} color="#ff6700" />
        </Stack>
      </Box>
    </Box>
  );
};

export default JobCard;

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

import { Box, Card, CardContent, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { keyframes } from "@mui/material/styles";
import { Pencil, X } from "lucide-react";
import { useEffect, useState } from "react";

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
`;

interface ProfileSectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  editContent?: React.ReactNode;
  // Anchor for scrolling to the section.
  id?: string;
  // Seconds to wait before the entrance animation starts, to stagger sections.
  delay?: number;
  // Opens the editor each time the value changes to a new non-zero number.
  openEditorSignal?: number;
  // Returns the section to its read-only view each time the value changes to a new non-zero number.
  closeEditorSignal?: number;
}

const ProfileSection = ({
  title,
  icon,
  children,
  editContent,
  id,
  delay = 0,
  openEditorSignal,
  closeEditorSignal,
}: ProfileSectionProps) => {
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (openEditorSignal && editContent) setEditing(true);
  }, [openEditorSignal, editContent]);

  useEffect(() => {
    if (closeEditorSignal) setEditing(false);
  }, [closeEditorSignal]);

  return (
    <Card
      id={id}
      elevation={0}
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: "12px",
        mb: 2,
        scrollMarginTop: "24px",
        animation: `${fadeUp} 0.5s ease ${delay}s both`,
        transition: "transform 0.2s, box-shadow 0.2s, border-color 0.2s",
        "&:hover": {
          transform: "translateY(-2px)",
          borderColor: "rgba(255,103,0,0.45)",
          boxShadow: "0 12px 32px -14px rgba(255,103,0,0.35)",
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Stack direction="row" alignItems="center" gap={1.25}>
            {icon && (
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  backgroundColor: "#ff670015",
                  color: "#ff6700",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {icon}
              </Box>
            )}
            <Typography fontWeight={700} fontSize="15px">
              {title}
            </Typography>
          </Stack>
          {editContent && (
            <Tooltip title={editing ? "Cancel" : "Edit"}>
              <IconButton
                size="small"
                onClick={() => setEditing(!editing)}
                sx={{ color: editing ? "error.main" : "text.secondary" }}
              >
                {editing ? <X size={16} /> : <Pencil size={16} />}
              </IconButton>
            </Tooltip>
          )}
        </Stack>

        {editing && editContent ? editContent : children}
      </CardContent>
    </Card>
  );
};

export default ProfileSection;

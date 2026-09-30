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

import { Avatar, Box, Stack, Tooltip, Typography, useTheme } from "@mui/material";
import { Briefcase, ClipboardList, User } from "lucide-react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

import { useEffect, useState } from "react";

import { useAuthContext } from "@asgardeo/auth-react";

import wso2LogoBlack from "@assets/images/wso2-logo_black.svg";
import wso2LogoWhite from "@assets/images/wso2-logo_white.svg";
import { State } from "@/types/types";
import { useAppAuthContext } from "@context/AuthContext";
import { loadJobs } from "@slices/careersSlice/careers";
import { RootState, useAppDispatch, useAppSelector } from "@slices/store";

const SIDEBAR_COLLAPSED_WIDTH = 64;
const SIDEBAR_EXPANDED_WIDTH = 180;

const NAV_ITEMS = [
  { path: "/jobs", label: "Jobs", icon: Briefcase },
  { path: "/profile", label: "Profile", icon: User },
  { path: "/applications", label: "Applications", icon: ClipboardList },
];

// The one persistent chrome for the whole app — a thin top bar (logo + account)
// and a left icon+label sidebar (Home/Jobs/Profile/Applications) — wrapping
// every page via <Outlet/>, so no individual page owns nav JSX.
const AppShell = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const authContext = useAppAuthContext();
  const user = useAppSelector((state: RootState) => state.user);
  const dispatch = useAppDispatch();
  const { getAccessToken } = useAuthContext();
  const jobsState = useAppSelector((state: RootState) => state.careers.jobsState);

  const [sidebarHovered, setSidebarHovered] = useState(false);

  // Prefetch the job listing as soon as the app opens, on whichever page
  // loads first -- so /jobs never has to wait on a cold fetch once the user
  // actually navigates there.
  useEffect(() => {
    if (jobsState !== State.idle) return;
    getAccessToken()
      .then((token) => dispatch(loadJobs(token)))
      .catch(() => dispatch({ type: "careers/loadJobs/rejected" }));
  }, [dispatch, getAccessToken, jobsState]);

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Top bar */}
      <Box
        sx={{
          height: "87.2px",
          flexShrink: 0,
          zIndex: 20,
          backgroundColor: "background.paper",
          borderBottom: "1px solid",
          borderColor: "divider",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: "48px",
        }}
      >
        <Box
          component="img"
          src={theme.palette.mode === "dark" ? wso2LogoWhite : wso2LogoBlack}
          alt="Go to home page"
          sx={{ height: 64, width: "auto", cursor: "pointer" }}
          onClick={() => { window.location.href = "https://wso2.com"; }}
        />

        <Stack direction="row" alignItems="center" gap={2.5}>
          <Tooltip title={user.userInfo ? "My Profile" : "Sign in"} arrow>
          {user.userInfo ? (
            <Avatar
              onClick={() => navigate("/profile")}
              sx={{ width: 30, height: 30, fontSize: "12px", fontWeight: 700, cursor: "pointer", backgroundColor: "primary.main" }}
            >
              {user.userInfo.firstName?.charAt(0)}
            </Avatar>
          ) : (
            <Box
              component="button"
              onClick={() => authContext.appSignIn()}
              aria-label="Sign in"
              sx={{
                width: 30, height: 30, borderRadius: "50%", border: "1px solid", borderColor: "divider",
                background: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                color: "text.secondary",
              }}
            >
              <User size={16} />
            </Box>
          )}
          </Tooltip>
        </Stack>
      </Box>

      <Box sx={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Left sidebar — icon-only by default, expands to show labels on hover */}
        <Box
          onMouseEnter={() => setSidebarHovered(true)}
          onMouseLeave={() => setSidebarHovered(false)}
          sx={{
            width: sidebarHovered ? SIDEBAR_EXPANDED_WIDTH : SIDEBAR_COLLAPSED_WIDTH,
            flexShrink: 0,
            backgroundColor: "#0B1220",
            display: "flex",
            flexDirection: "column",
            alignItems: sidebarHovered ? "stretch" : "center",
            gap: 0.5,
            py: 2,
            px: sidebarHovered ? 1 : 0,
            transition: "width 0.18s ease",
            overflow: "hidden",
          }}
        >
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.path);
            const button = (
              <Box
                key={item.path}
                component="button"
                onClick={() => navigate(item.path)}
                aria-label={item.label}
                sx={{
                  width: sidebarHovered ? "100%" : 44,
                  border: "none",
                  cursor: "pointer",
                  background: "none",
                  display: "flex",
                  flexDirection: sidebarHovered ? "row" : "column",
                  alignItems: "center",
                  justifyContent: sidebarHovered ? "flex-start" : "center",
                  gap: sidebarHovered ? 1.25 : 0.5,
                  px: sidebarHovered ? 1.5 : 0,
                  py: sidebarHovered ? 1 : 1,
                  borderRadius: "10px",
                  backgroundColor: active ? "background.paper" : "transparent",
                  color: active ? "primary.main" : "rgba(255,255,255,0.65)",
                  transition: "all 0.15s ease",
                  whiteSpace: "nowrap",
                  "&:hover": {
                    backgroundColor: active ? "background.paper" : "rgba(255,255,255,0.08)",
                    color: active ? "primary.main" : "#fff",
                  },
                }}
              >
                <item.icon size={20} />
                {sidebarHovered && (
                  <Typography sx={{ fontSize: "13px", fontWeight: 600 }}>{item.label}</Typography>
                )}
              </Box>
            );

            return sidebarHovered ? (
              button
            ) : (
              <Tooltip key={item.path} title={item.label} placement="right" arrow>
                {button}
              </Tooltip>
            );
          })}
        </Box>

        {/* Page content */}
        <Box sx={{ flex: 1, overflowY: "auto" }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default AppShell;

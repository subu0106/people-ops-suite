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
  Container,
  Divider,
  Grid,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import {
  CheckCircle,
  Globe,
  Star,
  User,
  Zap,
} from "lucide-react";

import wso2LogoBlack from "@assets/images/wso2-logo_black.svg";
import wso2LogoWhite from "@assets/images/wso2-logo_white.svg";
import { useAppAuthContext } from "@context/AuthContext";

const LoginScreen = () => {
  const { appSignIn, appSignOut } = useAppAuthContext();
  const theme = useTheme();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background:
          theme.palette.mode === "dark"
            ? "linear-gradient(135deg, #0B1220 0%, #13204a 55%, #1a2c63 100%)"
            : "linear-gradient(135deg, #fff7f0 0%, #ffffff 50%, #f0f9ff 100%)",
        overflowY: "auto",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          borderBottom: `1px solid ${theme.palette.divider}`,
          backdropFilter: "blur(8px)",
          backgroundColor: theme.palette.mode === "dark" ? "rgba(15,30,69,0.85)" : "rgba(255,255,255,0.8)",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <Container maxWidth="lg">
          <Stack direction="row" alignItems="center" py={1.5}>
            <Stack direction="row" alignItems="center" gap={1.5}>
              <Box
                component="img"
                src={
                  theme.palette.mode === "dark" ? wso2LogoWhite : wso2LogoBlack
                }
                alt="WSO2"
                sx={{ height: 28, width: "auto" }}
              />
              <Box>
                <Typography
                  sx={{ fontWeight: 700, fontSize: "16px", lineHeight: 1, color: "text.primary" }}
                >
                  Careers
                </Typography>
                <Typography sx={{ fontSize: "11px", color: "text.secondary" }}>
                  Candidate Passport Platform
                </Typography>
              </Box>
            </Stack>
          </Stack>
        </Container>
      </Box>

      {/* Hero Section */}
      <Container maxWidth="lg" sx={{ pt: 8, pb: 6, flexGrow: 1, display: "flex", alignItems: "center" }}>
        <Grid container spacing={6} alignItems="center" sx={{ width: "100%" }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Chip
              label="Now hiring across 8 departments"
              size="small"
              sx={{
                mb: 2,
                backgroundColor: "#ff670020",
                color: "#ff6700",
                fontWeight: 600,
                border: "1px solid #ff670040",
              }}
            />
            <Typography
              variant="h3"
              sx={{ fontWeight: 800, lineHeight: 1.2, mb: 2, color: "text.primary" }}
            >
              Build the Future of{" "}
              <Box component="span" sx={{ color: "#ff6700" }}>
                Open Source
              </Box>{" "}
              Integration
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, lineHeight: 1.8 }}>
              Create your{" "}
              <Box component="span" sx={{ fontWeight: 700, color: "#ff6700" }}>
                Candidate Passport
              </Box>{" "}
              — a single profile that travels with you across all WSO2 job applications. No more
              uploading CVs repeatedly.
            </Typography>
            <Stack direction="row" gap={2} flexWrap="wrap">
              <Button
                variant="contained"
                size="large"
                onClick={() => {
                  appSignOut();
                  appSignIn();
                }}
                sx={{
                  fontWeight: 700,
                  borderRadius: "10px",
                  px: 4,
                  py: 1.5,
                  background: "linear-gradient(135deg, #ff6700, #FF9500)",
                  boxShadow: "0 4px 20px rgba(255, 115, 0, 0.3)",
                  "&:hover": { boxShadow: "0 6px 24px rgba(255, 115, 0, 0.4)" },
                }}
              >
                Create Candidate Profile
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => {
                  appSignOut();
                  appSignIn();
                }}
                sx={{ fontWeight: 600, borderRadius: "10px", px: 4, py: 1.5 }}
              >
                Sign In
              </Button>
            </Stack>

            {/* Social proof */}
            <Stack direction="row" gap={3} mt={4} flexWrap="wrap">
              {[
                { icon: <Globe size={14} />, label: "5 Countries" },
                { icon: <Star size={14} />, label: "4.8★ Glassdoor" },
              ].map((item, i) => (
                <Stack key={i} direction="row" alignItems="center" gap={0.5}>
                  <Box sx={{ color: "#ff6700" }}>{item.icon}</Box>
                  <Typography variant="caption" fontWeight={600} color="text.secondary">
                    {item.label}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            {/* Candidate Passport Card */}
            <Card
              elevation={0}
              sx={{
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: "16px",
                background:
                  theme.palette.mode === "dark"
                    ? "rgba(255,255,255,0.05)"
                    : "rgba(255,255,255,0.9)",
                backdropFilter: "blur(20px)",
                boxShadow: "0 20px 60px rgba(0,0,0,0.1)",
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" alignItems="center" gap={1.5} mb={2.5}>
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: "10px",
                      background: "linear-gradient(135deg, #ff6700, #FF9500)",
                    }}
                  >
                    <User size={20} color="#fff" />
                  </Box>
                  <Box>
                    <Typography fontWeight={700} fontSize="15px">
                      Your Candidate Passport
                    </Typography>
                    <Typography fontSize="12px" color="text.secondary">
                      One profile. Every WSO2 application.
                    </Typography>
                  </Box>
                </Stack>

                <Divider sx={{ mb: 2 }} />

                <Stack gap={1.5}>
                  {[
                    { icon: <CheckCircle size={14} />, label: "Build your profile once, reuse everywhere" },
                    { icon: <CheckCircle size={14} />, label: "Add skills, experience & portfolio" },
                    { icon: <CheckCircle size={14} />, label: "Upload your resume — no repeats" },
                    { icon: <CheckCircle size={14} />, label: "Track all your applications in one place" },
                    { icon: <CheckCircle size={14} />, label: "Apply to any role instantly" },
                  ].map((item, i) => (
                    <Stack key={i} direction="row" alignItems="center" gap={1.5}>
                      <Box sx={{ color: "#10B981" }}>{item.icon}</Box>
                      <Typography fontSize="13px" color="text.primary">
                        {item.label}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>

                <Box
                  sx={{
                    mt: 2.5,
                    p: 1.5,
                    borderRadius: "8px",
                    backgroundColor:
                      theme.palette.mode === "dark" ? "rgba(255,115,0,0.1)" : "#FFF7F0",
                    border: "1px solid #ff670030",
                  }}
                >
                  <Stack direction="row" alignItems="center" gap={1}>
                    <Zap size={14} color="#ff6700" />
                    <Typography fontSize="12px" color="#ff6700" fontWeight={600}>
                      Sign in or create a profile to get started
                    </Typography>
                  </Stack>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* Footer */}
      <Box
        sx={{
          py: 3,
          borderTop: `1px solid ${theme.palette.divider}`,
          backgroundColor:
            theme.palette.mode === "dark" ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
        }}
      >
        <Container maxWidth="lg">
          <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
            <Box
              component="img"
              src={
                theme.palette.mode === "dark" ? wso2LogoWhite : wso2LogoBlack
              }
              alt="WSO2"
              sx={{ height: 20, width: "auto", opacity: 0.7 }}
            />
            <Typography fontSize="12px" color="text.disabled" textAlign="center">
              © {new Date().getFullYear()} WSO2 LLC. Licensed under the{" "}
              <Box
                component="a"
                href="https://www.apache.org/licenses/LICENSE-2.0"
                target="_blank"
                rel="noopener noreferrer"
                sx={{ color: "text.secondary", textDecoration: "underline" }}
              >
                Apache License 2.0
              </Box>
              . All rights reserved.
            </Typography>
            <Typography fontSize="12px" color="text.disabled">
              Powered by WSO2 Asgardeo
            </Typography>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
};

export default LoginScreen;

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

import { Box, Button, Grid, MenuItem, Select, Stack, Typography } from "@mui/material";
import { ArrowRight, Flame, Handshake, HeartHandshake, Mail, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAppAuthContext } from "@context/AuthContext";

import glassdoorTeam from "@assets/images/employee-careers.jpeg";
import internsTeam from "@assets/images/interns-careers.jpeg";
import { State } from "@/types/types";
import { loadOrgStructure } from "@slices/careersSlice/careers";
import { RootState, useAppDispatch, useAppSelector } from "@slices/store";

const GLASSDOOR_URL = "https://www.glassdoor.com/Reviews/WSO2-Reviews-E327184.htm";

const MAXIMS = [
  {
    title: "Trust and openness",
    icon: Handshake,
    description:
      "We enable fluidity of information, give and receive feedback, and refrain from micromanaging teams.",
  },
  {
    title: "Courageous honesty",
    icon: HeartHandshake,
    description:
      "We don't have hidden agendas, we're honest with ourselves and others, and discuss successes and failures openly.",
  },
  {
    title: "Purpose and passion",
    icon: Flame,
    description:
      "We nurture a culture of meritocracy where performance and meaningful contribution are valued and rewarded.",
  },
  {
    title: "One team",
    icon: Users,
    description:
      "We don't have space for ‘jerks’ — we respect each other, even if we disagree, and focus on solutions instead of pointing fingers.",
  },
];

const INTERVIEW_STEPS = [
  {
    step: 1,
    text: "Each candidate goes through three independent, first-level interviews. Reasons for votes are provided to ensure transparency.",
  },
  {
    step: 2,
    text: "Candidates with at least two +1 votes move to this level where they meet our senior functional leads and directors. Meet the HR team to discuss employee benefits and work culture.",
  },
  {
    step: 3,
    text: "Meet the CEO. This conversation will focus on culture and your role in upkeeping what's important to us.",
  },
];

const SECTION_MAX_WIDTH = 1080;

const Section = ({ children, alt }: { children: React.ReactNode; alt?: boolean }) => (
  <Box sx={{ backgroundColor: alt ? "action.hover" : "transparent", py: { xs: 6, md: 9 } }}>
    <Box sx={{ maxWidth: SECTION_MAX_WIDTH, mx: "auto", px: { xs: 2, md: 3 } }}>{children}</Box>
  </Box>
);

const Home = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { getToken: getAccessToken } = useAppAuthContext();
  const orgStructure = useAppSelector((state: RootState) => state.careers.orgStructure);
  const orgStructureState = useAppSelector((state: RootState) => state.careers.orgStructureState);

  const [team, setTeam] = useState("");
  const [location, setLocation] = useState("");

  useEffect(() => {
    if (orgStructureState !== State.idle) return;
    getAccessToken()
      .then((token) => dispatch(loadOrgStructure(token)))
      .catch(() => {
        dispatch({ type: "careers/loadOrgStructure/rejected" });
      });
  }, [dispatch, getAccessToken, orgStructureState]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (team) params.set("team", team);
    if (location) params.set("location", location);
    const query = params.toString();
    navigate(query ? `/jobs?${query}` : "/jobs");
  };

  return (
    <Box>

      {/* Hero + Our maxims — one continuous dark block, independent of the app's light/dark toggle */}
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
        <Box sx={{ maxWidth: SECTION_MAX_WIDTH, mx: "auto", px: { xs: 2, md: 3 }, pt: { xs: 5, md: 6 }, pb: { xs: 7, md: 9 } }}>
          <Stack direction="row" gap={1} alignItems="center" mb={{ xs: 4, md: 6 }}>
            <Typography
              component="button"
              onClick={() => navigate("/")}
              sx={{
                border: "none",
                background: "none",
                cursor: "pointer",
                fontFamily: "monospace",
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: "0.08em",
                color: "primary.main",
              }}
            >
              HOME
            </Typography>
            <Typography sx={{ fontSize: "12px", color: "rgba(255,255,255,0.35)" }}>/</Typography>
            <Typography
              sx={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.08em", color: "rgba(255,255,255,0.55)" }}
            >
              CAREERS
            </Typography>
          </Stack>

          <Stack gap={2.5} alignItems="center" textAlign="center" maxWidth={720} mx="auto">
            <Typography
              sx={{ fontSize: "13px", fontWeight: 700, letterSpacing: "0.25em", color: "rgba(255,255,255,0.6)" }}
            >
              WSO2 CAREERS
            </Typography>
            <Typography
              variant="h1"
              fontWeight={800}
              sx={{ textWrap: "balance", color: "#fff", fontSize: { xs: "38px", md: "64px" } }}
            >
              Where Passion Meets Purpose
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.65)", fontSize: "16px", lineHeight: 1.7 }}>
              Our culture is powered by one simple value: treat people the way you want to be
              treated. This means we treat everyone in a fair, open, honest and respectful manner
              from the moment you apply for a role at WSO2.
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate("/jobs")}
              endIcon={<ArrowRight size={17} />}
              sx={{
                mt: 1,
                borderRadius: "999px",
                fontWeight: 700,
                px: 3.5,
                py: 1.2,
                backgroundColor: "primary.main",
                color: "#0B1220",
                "&:hover": { backgroundColor: "primary.main", filter: "brightness(0.95)" },
              }}
            >
              View Open Positions
            </Button>
          </Stack>

          <Stack gap={1} alignItems="center" textAlign="center" mt={{ xs: 7, md: 9 }} mb={5}>
            <Typography variant="h1" fontWeight={800}>
              <Box component="span" sx={{ color: "#fff" }}>
                Our{" "}
              </Box>
              <Box component="span" sx={{ color: "primary.main" }}>
                maxims
              </Box>
            </Typography>
            <Typography sx={{ color: "rgba(255,255,255,0.65)", maxWidth: 640 }}>
              We have no office rules and our culture is our way of life. Our four maxims guide us
              in how we treat each other across our global team.
            </Typography>
          </Stack>

          <Grid container spacing={2}>
            {MAXIMS.map((maxim) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={maxim.title}>
                <Box
                  sx={{
                    height: "100%",
                    p: 2.5,
                    borderRadius: "16px",
                    textAlign: "center",
                    backgroundColor: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <maxim.icon size={26} color="rgba(255,255,255,0.55)" style={{ marginBottom: 12 }} />
                  <Typography fontWeight={700} sx={{ color: "#fff", mb: 1, lineHeight: 1.3 }}>
                    {maxim.title}
                  </Typography>
                  <Typography fontSize="13.5px" sx={{ color: "rgba(255,255,255,0.6)" }}>
                    {maxim.description}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Box>

      {/* Glassdoor */}
      <Section>
        <Grid container spacing={{ xs: 4, md: 6 }} alignItems="center">
          <Grid size={{ xs: 12, md: 6 }}>
            <Box
              component="img"
              src={glassdoorTeam}
              alt="WSO2 employees collaborating"
              sx={{
                width: "100%",
                height: "auto",
                display: "block",
                borderRadius: "20px",
                boxShadow: "2px 5px 10px 0 rgb(0 0 0 / 20%)",
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Stack gap={2} alignItems="flex-start">
              <Typography
                component="div"
                sx={{ fontSize: { xs: "34px", md: "48px" }, fontWeight: 800, lineHeight: 1.15 }}
              >
                <Box component="span" sx={{ color: "#ff6700" }}>
                  What
                </Box>{" "}
                <Box component="span" sx={{ color: "text.primary" }}>
                  employees say in
                </Box>
              </Typography>
              <Typography
                sx={{
                  fontSize: { xs: "26px", md: "34px" },
                  fontWeight: 800,
                  color: "#2F8F5B",
                  textTransform: "uppercase",
                  letterSpacing: "0.02em",
                }}
              >
                &lsquo;GLASSDOOR&rsquo;
              </Typography>
              <Button
                component="a"
                href={GLASSDOOR_URL}
                target="_blank"
                rel="noopener noreferrer"
                endIcon={<ArrowRight size={16} />}
                sx={{
                  mt: 1,
                  borderRadius: "999px",
                  backgroundColor: "#ff6700",
                  color: "#1A1A1A",
                  fontWeight: 700,
                  px: 3.5,
                  py: 1.2,
                  textTransform: "none",
                  "&:hover": { backgroundColor: "#E86800" },
                }}
              >
                Learn More
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Section>

      {/* Interview process */}
      <Section alt>
        <Stack gap={0.5} mb={4} maxWidth={680} mx="auto" textAlign="center">
          <Typography sx={{ fontSize: "18px", fontWeight: 600, fontStyle: "italic", color: "text.primary" }}>
            What to expect throughout the
          </Typography>
          <Typography
            component="div"
            sx={{
              fontSize: { xs: "34px", md: "48px" },
              fontWeight: 800,
              lineHeight: 1.15,
              mb: 1,
            }}
          >
            <Box component="span" sx={{ color: "#ff6700" }}>
              Interview
            </Box>{" "}
            <Box component="span" sx={{ color: "text.primary" }}>
              Process
            </Box>
          </Typography>
          <Typography color="text.secondary" fontSize="16px">
            The interview process at WSO2 involves multiple conversations about your
            qualifications, skills, and what motivates you. It's a chance for us to ensure you're
            a strong match for our company culture, and just as importantly, it allows you to
            determine if WSO2 aligns with your own career aspirations.
          </Typography>
        </Stack>
        <Grid container spacing={3} mb={4}>
          {INTERVIEW_STEPS.map((s) => (
            <Grid size={{ xs: 12, sm: 4 }} key={s.step}>
              <Box
                sx={{
                  p: 3,
                  borderRadius: "16px",
                  border: "1px solid",
                  borderColor: "divider",
                  height: "100%",
                  backgroundColor: "background.paper",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    borderColor: "#ff6700",
                    boxShadow: "0 12px 30px -8px rgb(255 103 0 / 25%)",
                    transform: "translateY(-4px)",
                  },
                }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    backgroundColor: "#ff6700",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: "16px",
                    mb: 2,
                  }}
                >
                  {s.step}
                </Box>
                <Typography fontSize="14px" color="text.secondary">
                  {s.text}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
        <Box textAlign="center">
          <Button
            variant="contained"
            onClick={() => navigate("/jobs")}
            endIcon={<ArrowRight size={17} />}
            sx={{ borderRadius: "999px", fontWeight: 700, px: 3.5, py: 1.2 }}
          >
            View Open Positions
          </Button>
        </Box>
      </Section>

      {/* Internships teaser */}
      <Section>
        <Grid container spacing={{ xs: 4, md: 6 }} alignItems="center">
          <Grid size={{ xs: 12, md: 6 }}>
            <Stack gap={1.5} alignItems="flex-start">
              <Typography variant="h5" fontWeight={700}>
                WSO2 Internship Program
              </Typography>
              <Typography color="text.secondary">
                Are you ready to embark on an exciting adventure with the WSO2 Internship Program? Get
                ready for an unforgettable experience filled with learning, growth, and loads of fun
                from day one - you'll be an active member of our team, working on real projects.
              </Typography>
              <Button
                variant="outlined"
                onClick={() => navigate("/careers/internships")}
                endIcon={<ArrowRight size={15} />}
                sx={{ alignSelf: "flex-start", borderRadius: "999px", fontWeight: 700, px: 3 }}
              >
                Learn More
              </Button>
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Box
              component="img"
              src={internsTeam}
              alt="WSO2 interns collaborating"
              sx={{
                width: "100%",
                height: "auto",
                display: "block",
                borderRadius: "20px",
                boxShadow: "2px 5px 10px 0 rgb(0 0 0 / 20%)",
              }}
            />
          </Grid>
        </Grid>
      </Section>

      {/* Search your career */}
      <Section alt>
        <Box
          sx={{
            maxWidth: 640,
            mx: "auto",
            backgroundColor: "background.paper",
            borderRadius: "24px",
            boxShadow: "0 20px 50px -12px rgb(7 20 46 / 15%)",
            p: { xs: 3, md: 5 },
          }}
        >
          <Typography
            component="div"
            sx={{ fontSize: { xs: "32px", md: "42px" }, fontWeight: 800, lineHeight: 1.2, color: "text.primary", mb: 4 }}
          >
            Search for your
            <br />
            career at <Box component="span" sx={{ color: "#ff6700" }}>WSO2</Box>.
          </Typography>

          <Stack gap={2.5}>
            <Box>
              <Typography fontSize="13px" fontWeight={600} mb={0.75} color="text.secondary">
                Team
              </Typography>
              <Select
                value={team}
                onChange={(e) => setTeam(e.target.value)}
                displayEmpty
                fullWidth
                size="small"
                sx={{
                  borderRadius: "999px",
                  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "primary.main" },
                }}
              >
                {orgStructure.teams.map((t) => (
                  <MenuItem key={t} value={t}>
                    {t}
                  </MenuItem>
                ))}
              </Select>
            </Box>
            <Box>
              <Typography fontSize="13px" fontWeight={600} mb={0.75} color="text.secondary">
                Location
              </Typography>
              <Select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                displayEmpty
                fullWidth
                size="small"
                sx={{
                  borderRadius: "999px",
                  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "primary.main" },
                }}
              >
                {orgStructure.locations.map((l) => (
                  <MenuItem key={l} value={l}>
                    {l}
                  </MenuItem>
                ))}
              </Select>
            </Box>
          </Stack>

          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
            <Button
              variant="contained"
              onClick={handleSearch}
              sx={{
                borderRadius: "999px",
                backgroundColor: "#ff6700",
                fontWeight: 700,
                px: 4,
                py: 1.2,
                "&:hover": { backgroundColor: "#e05c00" },
              }}
            >
              Search
            </Button>
          </Box>
        </Box>
      </Section>

      {/* Footer */}
      <Box sx={{ borderTop: "1px solid", borderColor: "divider", py: 4 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems="center"
          gap={2}
          sx={{ maxWidth: SECTION_MAX_WIDTH, mx: "auto", px: { xs: 2, md: 3 } }}
        >
          <Typography fontSize="13px" color="text.secondary">
            © {new Date().getFullYear()} WSO2 LLC. All rights reserved.
          </Typography>
          <Stack direction="row" gap={0.75} alignItems="center">
            <Mail size={14} />
            <Typography fontSize="13px" color="text.secondary">
              careers@wso2.com
            </Typography>
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
};

export default Home;

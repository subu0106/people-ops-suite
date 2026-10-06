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

import { Box, Button, Grid, Stack, Typography } from "@mui/material";
import {
  ArrowRight,
  Award,
  Bus,
  Coffee,
  Dumbbell,
  FileSearch,
  HeartPulse,
  Lightbulb,
  MessageCircle,
  Quote,
  Smile,
  Video,
} from "lucide-react";
import { useEffect, useRef } from "react";

import { useAppAuthContext } from "@context/AuthContext";

import internsTeam from "@assets/images/internship-page-img.jpeg";
import JobCard from "@component/careers/JobCard";
import JobCardSkeleton from "@component/careers/JobCardSkeleton";
import { State } from "@/types/types";
import { loadJobs } from "@slices/careersSlice/careers";
import { RootState, useAppDispatch, useAppSelector } from "@slices/store";

const SECTION_MAX_WIDTH = 1080;

const Section = ({ children, alt, id }: { children: React.ReactNode; alt?: boolean; id?: string }) => (
  <Box id={id} sx={{ backgroundColor: alt ? "action.hover" : "transparent", py: { xs: 6, md: 9 } }}>
    <Box sx={{ maxWidth: SECTION_MAX_WIDTH, mx: "auto", px: { xs: 2, md: 3 } }}>{children}</Box>
  </Box>
);

const SectionHeading = ({ children }: { children: React.ReactNode }) => (
  <Typography
    component="h2"
    sx={{ textAlign: "center", fontSize: { xs: "28px", md: "38px" }, fontWeight: 800, color: "text.primary", mb: 5 }}
  >
    {children}
  </Typography>
);

const BENEFITS = [
  { icon: Coffee, text: "Breakfast, lunch, and snacks" },
  { icon: Bus, text: "Transportation to and from the office (within a 40 KM radius of WSO2)" },
  { icon: HeartPulse, text: "Surgical and hospitalization insurance" },
  { icon: Dumbbell, text: "Access to office amenities such as the gym, music room, and gaming area" },
];

const PROCESS_STEPS = [
  {
    icon: FileSearch,
    title: "Screen Applications",
    text: "Based on requirements, the hiring team will screen your resume and if shortlisted you will be called for an interview.",
  },
  {
    icon: MessageCircle,
    title: "First Interview",
    text: "Meet with the team to discuss your skills, experience, and interest in the role.",
  },
  {
    icon: Video,
    title: "Second Interview",
    text: "A deeper conversation with senior team members to assess fit and technical ability.",
  },
  {
    icon: Award,
    title: "Offer",
    text: "Receive your internship offer and get ready to start your journey with WSO2.",
  },
];

const QUALITIES = [
  {
    icon: Lightbulb,
    title: "Curiosity",
    text: "The driving force behind innovation, problem-solving, and personal growth - curious interns explore ideas and actively seek out learning opportunities.",
  },
  {
    icon: Smile,
    title: "Positive Attitude",
    text: "A vital characteristic for success, both individually and as part of a team - enthusiasm and determination carry you through every challenge.",
  },
];

const TESTIMONIALS = [
  {
    name: "Tharushka Millavithanachchi",
    team: "Engineering",
    quote:
      "I gained a lot of knowledge about different technologies and developed my skills as well, working on real projects with expert mentorship.",
  },
  {
    name: "P. Ahangama Vithanage",
    team: "Engineering",
    quote: "The experience was transformative, thanks to a genuinely supportive culture - I felt valued as part of the team from day one.",
  },
  {
    name: "Wanshika Wanni Arachchi",
    team: "Engineering",
    quote:
      "I gained invaluable hands-on experience working with Asgardeo, Java, JDBC, RDBMS, PostgreSQL, NoSQL, Docker, JSON, and Kubernetes.",
  },
  {
    name: "Sanjula Kalansooriya",
    team: "Engineering",
    quote: "The well-organized structure made everything go smoothly from the very first day.",
  },
  {
    name: "Ashokkumar Susitharan",
    team: "Engineering",
    quote: "It was an exceptional experience with valuable industrial exposure and a top-notch culture.",
  },
  {
    name: "E.D.M. Akshay De Silva",
    team: "Engineering",
    quote: "Nothing short of a game-changer - if you get the opportunity, seize it without hesitation!",
  },
];

const Internships = () => {
  const dispatch = useAppDispatch();
  const { getToken: getAccessToken } = useAppAuthContext();
  const jobs = useAppSelector((state: RootState) => state.careers.jobs);
  const jobsState = useAppSelector((state: RootState) => state.careers.jobsState);
  const benefitsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (jobsState !== State.idle) return;
    getAccessToken()
      .then((token) => dispatch(loadJobs(token)))
      .catch(() => dispatch({ type: "careers/loadJobs/rejected" }));
  }, [dispatch, getAccessToken, jobsState]);

  const internshipJobs = jobs.filter((job) => job.jobType === "Internship");

  return (
    <Box>
      {/* Hero */}
      <Box sx={{ maxWidth: SECTION_MAX_WIDTH, mx: "auto", px: { xs: 2, md: 3 }, py: { xs: 6, md: 9 } }}>
        <Grid container spacing={{ xs: 4, md: 6 }} alignItems="center">
          <Grid size={{ xs: 12, md: 6 }}>
            <Stack gap={2} alignItems="flex-start">
              <Typography
                sx={{ fontSize: { xs: "40px", md: "56px" }, fontWeight: 800, lineHeight: 1.1, color: "text.primary" }}
              >
                Internships
              </Typography>
              <Stack gap={2}>
                <Typography color="text.secondary" fontSize="16px">
                  Are you ready to embark on an exciting adventure with the WSO2 Internship
                  Program? Get ready for an unforgettable experience filled with learning,
                  growth, and loads of fun!
                </Typography>
                <Typography color="text.secondary" fontSize="16px">
                  At WSO2, we believe in giving our interns the chance to dive headfirst into
                  real-world projects. Say goodbye to mundane tasks and hello to meaningful work
                  that makes a difference! From day one, you&rsquo;ll be an active member of our
                  dynamic team, collaborating with talented professionals and contributing to live
                  projects.
                </Typography>
                <Typography color="text.secondary" fontSize="16px">
                  Internships at WSO2 are limited to the duration required by the university, as
                  we encourage interns to resume their studies or pursue new opportunities that
                  align with their long-term goals upon completing the program.
                </Typography>
              </Stack>
              <Button
                variant="contained"
                onClick={() => benefitsRef.current?.scrollIntoView({ behavior: "smooth" })}
                endIcon={<ArrowRight size={17} />}
                sx={{
                  alignSelf: "flex-start",
                  borderRadius: "999px",
                  backgroundColor: "#ff6700",
                  fontWeight: 700,
                  px: 3.5,
                  py: 1.2,
                  mt: 1,
                  "&:hover": { backgroundColor: "#e05c00" },
                }}
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
      </Box>

      {/* What's in it for you */}
      <Box ref={benefitsRef}>
        <Section alt>
          <SectionHeading>
            <Box component="span" sx={{ color: "#ff6700" }}>
              What&rsquo;s
            </Box>{" "}
            in It for You
          </SectionHeading>
          <Grid container spacing={3}>
            {BENEFITS.map(({ icon: Icon, text }) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={text}>
                <Box
                  sx={{
                    p: 3,
                    height: "100%",
                    borderRadius: "16px",
                    border: "1px solid",
                    borderColor: "divider",
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
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      backgroundColor: "#ffe0cc",
                      color: "#ff6700",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mb: 2,
                    }}
                  >
                    <Icon size={20} />
                  </Box>
                  <Typography fontSize="14px" color="text.secondary">
                    {text}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Section>
      </Box>

      {/* Internship interview process */}
      <Section>
        <SectionHeading>
          Internship{" "}
          <Box component="span" sx={{ color: "#ff6700" }}>
            Interview Process
          </Box>
        </SectionHeading>
        <Grid container spacing={3}>
          {PROCESS_STEPS.map(({ icon: Icon, title, text }, idx) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={title}>
              <Box
                sx={{
                  p: 3,
                  height: "100%",
                  borderRadius: "16px",
                  border: "1px solid",
                  borderColor: "divider",
                  backgroundColor: "background.paper",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    borderColor: "#ff6700",
                    boxShadow: "0 12px 30px -8px rgb(255 103 0 / 25%)",
                    transform: "translateY(-4px)",
                  },
                }}
              >
                <Stack direction="row" alignItems="center" gap={1.5} mb={1.5}>
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
                    }}
                  >
                    <Icon size={18} />
                  </Box>
                  <Typography fontSize="12px" fontWeight={700} color="text.secondary">
                    STEP {idx + 1}
                  </Typography>
                </Stack>
                <Typography fontWeight={700} fontSize="15px" color="text.primary" mb={1}>
                  {title}
                </Typography>
                <Typography fontSize="14px" color="text.secondary">
                  {text}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Section>

      {/* What do we look for in our interns */}
      <Section alt>
        <SectionHeading>
          What Do We Look for in{" "}
          <Box component="span" sx={{ color: "#ff6700" }}>
            Our Interns?
          </Box>
        </SectionHeading>
        <Grid container spacing={3}>
          {QUALITIES.map(({ icon: Icon, title, text }) => (
            <Grid size={{ xs: 12, md: 6 }} key={title}>
              <Box
                sx={{
                  p: 3.5,
                  height: "100%",
                  borderRadius: "16px",
                  border: "1px solid",
                  borderColor: "divider",
                  backgroundColor: "background.paper",
                }}
              >
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    backgroundColor: "#ffe0cc",
                    color: "#ff6700",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mb: 2,
                  }}
                >
                  <Icon size={22} />
                </Box>
                <Typography fontWeight={700} fontSize="17px" color="text.primary" mb={1}>
                  {title}
                </Typography>
                <Typography fontSize="14px" color="text.secondary">
                  {text}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Section>

      {/* Available positions */}
      <Section id="positions">
        <SectionHeading>
          Available{" "}
          <Box component="span" sx={{ color: "#ff6700" }}>
            Positions
          </Box>
        </SectionHeading>

        {jobsState === State.loading && (
          <Grid container spacing={2}>
            {Array.from({ length: 3 }).map((_, i) => (
              <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
                <JobCardSkeleton />
              </Grid>
            ))}
          </Grid>
        )}

        {jobsState === State.success && internshipJobs.length === 0 && (
          <Box
            sx={{
              py: 6,
              textAlign: "center",
              border: "1px dashed",
              borderColor: "divider",
              borderRadius: "12px",
            }}
          >
            <Typography color="text.secondary">
              There are no available vacancies that match your search.
            </Typography>
          </Box>
        )}

        {internshipJobs.length > 0 && (
          <Grid container spacing={2}>
            {internshipJobs.map((job) => (
              <Grid key={job.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <JobCard job={job} />
              </Grid>
            ))}
          </Grid>
        )}
      </Section>

      {/* Testimonials */}
      <Section alt>
        <SectionHeading>
          Hear It from{" "}
          <Box component="span" sx={{ color: "#ff6700" }}>
            Our Very Own Interns!
          </Box>
        </SectionHeading>
        <Grid container spacing={3}>
          {TESTIMONIALS.map(({ name, team, quote }) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={name}>
              <Box
                sx={{
                  p: 3,
                  height: "100%",
                  borderRadius: "16px",
                  border: "1px solid",
                  borderColor: "divider",
                  backgroundColor: "background.paper",
                }}
              >
                <Quote size={22} color="#ff6700" style={{ marginBottom: 12 }} />
                <Typography fontSize="14px" color="text.secondary" fontStyle="italic" mb={2}>
                  &ldquo;{quote}&rdquo;
                </Typography>
                <Typography fontWeight={700} fontSize="14px" color="text.primary">
                  {name}
                </Typography>
                <Typography fontSize="12px" color="text.secondary">
                  {team}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Section>
    </Box>
  );
};

export default Internships;

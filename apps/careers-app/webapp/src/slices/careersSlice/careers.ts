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

import { PayloadAction, createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { Application, CandidateProfile, Job, OfferDecision, PortfolioItem } from "@/types/types";
import { State } from "@/types/types";
import {
  activateResume as activateResumeApi,
  deleteResume as deleteResumeApi,
  fetchApplications as fetchApplicationsApi,
  fetchProfile as fetchProfileApi,
  respondToOffer as respondToOfferApi,
  saveProfile as saveProfileApi,
  submitApplication as submitApplicationApi,
  submitApplicationDocuments as submitApplicationDocumentsApi,
  uploadApplicationDocument as uploadApplicationDocumentApi,
  uploadResume as uploadResumeApi,
} from "@utils/profileService";
import {
  OrgStructure,
  VacancyDetail,
  fetchOrgStructure,
  fetchVacancies,
  fetchVacancyDetail,
} from "@utils/vacancyService";

interface CareersState {
  profile: CandidateProfile;
  profileState: State;
  jobs: Job[];
  jobsState: State;
  jobDetails: Record<string, VacancyDetail>;
  orgStructure: OrgStructure;
  orgStructureState: State;
  applications: Application[];
  applicationsState: State;
  savedJobIds: string[];
}

const emptyProfile: CandidateProfile = {
  personId: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  country: "",
  address: "",
  university: "",
  linkedIn: "",
  github: "",
  currentRole: "",
  yearsOfExperience: 0,
  skills: [],
  preferredRoles: [],
  preferredLocations: [],
  summary: "",
  resumes: [],
  portfolio: [],
  completionPercentage: 0,
};

const initialState: CareersState = {
  profile: emptyProfile,
  profileState: State.idle,
  jobs: [],
  jobsState: State.idle,
  jobDetails: {},
  orgStructure: { locations: [], teams: [] },
  orgStructureState: State.idle,
  applications: [],
  applicationsState: State.idle,
  // Save state is local/in-memory only -- not yet persisted to the backend,
  // so it resets on refresh.
  savedJobIds: [],
};

export const loadJobs = createAsyncThunk("careers/loadJobs", async (accessToken: string) => {
  return await fetchVacancies(accessToken);
});

export const loadOrgStructure = createAsyncThunk("careers/loadOrgStructure", async (accessToken: string) => {
  return await fetchOrgStructure(accessToken);
});

export const loadJobDetail = createAsyncThunk(
  "careers/loadJobDetail",
  async ({ accessToken, jobId }: { accessToken: string; jobId: string }) => {
    return await fetchVacancyDetail(jobId, accessToken);
  },
);

export const loadProfile = createAsyncThunk("careers/loadProfile", async (accessToken: string) => {
  return await fetchProfileApi(accessToken);
});

export const updateProfile = createAsyncThunk(
  "careers/updateProfile",
  async ({ accessToken, partial }: { accessToken: string; partial: Partial<CandidateProfile> }) => {
    return await saveProfileApi(accessToken, partial);
  },
);

export const addSkill = createAsyncThunk(
  "careers/addSkill",
  async ({ accessToken, skill }: { accessToken: string; skill: string }, { getState }) => {
    const { careers } = getState() as { careers: CareersState };
    if (careers.profile.skills.includes(skill)) {
      return careers.profile;
    }
    return await saveProfileApi(accessToken, { skills: [...careers.profile.skills, skill] });
  },
);

export const removeSkill = createAsyncThunk(
  "careers/removeSkill",
  async ({ accessToken, skill }: { accessToken: string; skill: string }, { getState }) => {
    const { careers } = getState() as { careers: CareersState };
    return await saveProfileApi(accessToken, {
      skills: careers.profile.skills.filter((s) => s !== skill),
    });
  },
);

export const addPortfolioItem = createAsyncThunk(
  "careers/addPortfolioItem",
  async ({ accessToken, item }: { accessToken: string; item: Omit<PortfolioItem, "id"> }, { getState }) => {
    const { careers } = getState() as { careers: CareersState };
    const portfolio = [...careers.profile.portfolio, { ...item, id: `p-${Date.now()}` }];
    return await saveProfileApi(accessToken, { portfolio });
  },
);

export const removePortfolioItem = createAsyncThunk(
  "careers/removePortfolioItem",
  async ({ accessToken, itemId }: { accessToken: string; itemId: string }, { getState }) => {
    const { careers } = getState() as { careers: CareersState };
    return await saveProfileApi(accessToken, {
      portfolio: careers.profile.portfolio.filter((p) => p.id !== itemId),
    });
  },
);

export const uploadResume = createAsyncThunk(
  "careers/uploadResume",
  async ({ accessToken, file }: { accessToken: string; file: File }) => {
    return await uploadResumeApi(accessToken, file);
  },
);

export const activateResume = createAsyncThunk(
  "careers/activateResume",
  async ({ accessToken, resumeId }: { accessToken: string; resumeId: string }) => {
    return await activateResumeApi(accessToken, resumeId);
  },
);

export const deleteResume = createAsyncThunk(
  "careers/deleteResume",
  async ({ accessToken, resumeId }: { accessToken: string; resumeId: string }) => {
    return await deleteResumeApi(accessToken, resumeId);
  },
);

export const loadApplications = createAsyncThunk("careers/loadApplications", async (accessToken: string) => {
  return await fetchApplicationsApi(accessToken);
});

export const submitApplication = createAsyncThunk(
  "careers/submitApplication",
  async (
    { accessToken, jobId, resumeId }: { accessToken: string; jobId: string; resumeId: string },
    { getState },
  ) => {
    // The job's title and team travel with the request so a stand-in backend can list the new application.
    const { careers } = getState() as { careers: CareersState };
    const job = careers.jobDetails[jobId] ?? careers.jobs.find((j) => j.id === jobId);
    return await submitApplicationApi(accessToken, jobId, resumeId, {
      jobTitle: job?.title ?? "",
      department: job?.team ?? "",
    });
  },
);

export const respondToOffer = createAsyncThunk(
  "careers/respondToOffer",
  async ({
    accessToken,
    applicationId,
    decision,
  }: {
    accessToken: string;
    applicationId: string;
    decision: Exclude<OfferDecision, "Pending">;
  }) => {
    return await respondToOfferApi(accessToken, applicationId, decision);
  },
);

export const uploadApplicationDocument = createAsyncThunk(
  "careers/uploadApplicationDocument",
  async ({
    accessToken,
    applicationId,
    documentId,
    file,
  }: {
    accessToken: string;
    applicationId: string;
    documentId: string;
    file: File;
  }) => {
    return await uploadApplicationDocumentApi(accessToken, applicationId, documentId, file);
  },
);

export const submitApplicationDocuments = createAsyncThunk(
  "careers/submitApplicationDocuments",
  async ({ accessToken, applicationId }: { accessToken: string; applicationId: string }) => {
    return await submitApplicationDocumentsApi(accessToken, applicationId);
  },
);

// Swaps in the server's latest copy of one application, leaving the rest of the list untouched.
function replaceApplication(applications: Application[], updated: Application) {
  const idx = applications.findIndex((a) => a.id === updated.id);
  if (idx >= 0) applications[idx] = updated;
}

export const CareersSlice = createSlice({
  name: "careers",
  initialState,
  reducers: {
    toggleSaveJob: (state, action: PayloadAction<string>) => {
      const idx = state.savedJobIds.indexOf(action.payload);
      if (idx >= 0) {
        state.savedJobIds.splice(idx, 1);
      } else {
        state.savedJobIds.push(action.payload);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadJobs.pending, (state) => {
        state.jobsState = State.loading;
      })
      .addCase(loadJobs.fulfilled, (state, action) => {
        state.jobs = action.payload;
        state.jobsState = State.success;
      })
      .addCase(loadJobs.rejected, (state) => {
        state.jobsState = State.failed;
      })
      .addCase(loadOrgStructure.pending, (state) => {
        state.orgStructureState = State.loading;
      })
      .addCase(loadOrgStructure.fulfilled, (state, action) => {
        state.orgStructure = action.payload;
        state.orgStructureState = State.success;
      })
      .addCase(loadOrgStructure.rejected, (state) => {
        state.orgStructureState = State.failed;
        state.orgStructure = { locations: [], teams: [] };
      })
      .addCase(loadJobDetail.fulfilled, (state, action) => {
        state.jobDetails[action.payload.id] = action.payload;
      })
      .addCase(loadProfile.pending, (state) => {
        state.profileState = State.loading;
      })
      .addCase(loadProfile.fulfilled, (state, action) => {
        state.profile = action.payload;
        state.profileState = State.success;
      })
      .addCase(loadProfile.rejected, (state) => {
        state.profileState = State.failed;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.profile = action.payload;
      })
      .addCase(addSkill.fulfilled, (state, action) => {
        state.profile = action.payload;
      })
      .addCase(removeSkill.fulfilled, (state, action) => {
        state.profile = action.payload;
      })
      .addCase(addPortfolioItem.fulfilled, (state, action) => {
        state.profile = action.payload;
      })
      .addCase(removePortfolioItem.fulfilled, (state, action) => {
        state.profile = action.payload;
      })
      .addCase(uploadResume.fulfilled, (state, action) => {
        state.profile = action.payload;
      })
      .addCase(activateResume.fulfilled, (state, action) => {
        state.profile = action.payload;
      })
      .addCase(deleteResume.fulfilled, (state, action) => {
        state.profile = action.payload;
      })
      .addCase(loadApplications.pending, (state) => {
        state.applicationsState = State.loading;
      })
      .addCase(loadApplications.fulfilled, (state, action) => {
        state.applications = action.payload;
        state.applicationsState = State.success;
      })
      .addCase(loadApplications.rejected, (state) => {
        state.applicationsState = State.failed;
      })
      .addCase(respondToOffer.fulfilled, (state, action) => {
        replaceApplication(state.applications, action.payload);
      })
      .addCase(uploadApplicationDocument.fulfilled, (state, action) => {
        replaceApplication(state.applications, action.payload);
      })
      .addCase(submitApplicationDocuments.fulfilled, (state, action) => {
        replaceApplication(state.applications, action.payload);
      })
      .addCase(submitApplication.fulfilled, (state, action) => {
        const idx = state.applications.findIndex((a) => a.id === action.payload.id);
        if (idx >= 0) {
          state.applications[idx] = action.payload;
        } else {
          state.applications.unshift(action.payload);
        }
      });
  },
});

export const { toggleSaveJob } = CareersSlice.actions;
export default CareersSlice.reducer;

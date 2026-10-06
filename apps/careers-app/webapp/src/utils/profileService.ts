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

import axios from "axios";

import { AppConfig, UseMockProfile } from "@config/config";
import { Application, CandidateProfile, GuestApplicationDetails, OfferDecision } from "@/types/types";
import * as mockProfile from "@utils/mockProfile";

// The Ballerina backend decodes this header directly without verifying its
// signature, matching every other Ballerina backend in this repo.
function authHeader(accessToken: string) {
  return { "x-jwt-assertion": accessToken };
}

export async function fetchProfile(accessToken: string): Promise<CandidateProfile> {
  if (UseMockProfile) return mockProfile.fetchProfile();
  const response = await axios.get<CandidateProfile>(`${AppConfig.serviceUrls.candidates}/me`, {
    headers: authHeader(accessToken),
  });
  return response.data;
}

export async function saveProfile(
  accessToken: string,
  partial: Partial<CandidateProfile>,
): Promise<CandidateProfile> {
  if (UseMockProfile) return mockProfile.saveProfile(partial);
  const response = await axios.patch<CandidateProfile>(`${AppConfig.serviceUrls.candidates}/me`, partial, {
    headers: authHeader(accessToken),
  });
  return response.data;
}

export async function uploadResume(accessToken: string, file: File): Promise<CandidateProfile> {
  if (UseMockProfile) return mockProfile.uploadResume(file);
  const form = new FormData();
  form.append("file", file);
  const response = await axios.post<CandidateProfile>(`${AppConfig.serviceUrls.candidates}/me/resumes`, form, {
    headers: { ...authHeader(accessToken), "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

export async function activateResume(accessToken: string, resumeId: string): Promise<CandidateProfile> {
  if (UseMockProfile) return mockProfile.activateResume(resumeId);
  const response = await axios.patch<CandidateProfile>(
    `${AppConfig.serviceUrls.candidates}/me/resumes/${resumeId}/activate`,
    {},
    { headers: authHeader(accessToken) },
  );
  return response.data;
}

export async function deleteResume(accessToken: string, resumeId: string): Promise<CandidateProfile> {
  if (UseMockProfile) return mockProfile.deleteResume(resumeId);
  const response = await axios.delete<CandidateProfile>(
    `${AppConfig.serviceUrls.candidates}/me/resumes/${resumeId}`,
    { headers: authHeader(accessToken) },
  );
  return response.data;
}

interface SaveFilePickerWindow {
  showSaveFilePicker?: (options: {
    suggestedName: string;
    types: { description: string; accept: Record<string, string[]> }[];
  }) => Promise<{ createWritable: () => Promise<{ write: (data: Blob) => Promise<void>; close: () => Promise<void> }> }>;
}

// Browsers with the File System Access API ask where to save the file. The
// picker has to open inside the click's user activation, so it opens before
// the file is fetched. Other browsers get a plain download to their default folder.
async function saveWithLocationPrompt(filename: string, getBlob: () => Promise<Blob>): Promise<void> {
  const { showSaveFilePicker } = window as unknown as SaveFilePickerWindow;

  if (showSaveFilePicker) {
    let handle;
    try {
      handle = await showSaveFilePicker.call(window, {
        suggestedName: filename,
        types: [{ description: "PDF document", accept: { "application/pdf": [".pdf"] } }],
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      throw err;
    }
    const writable = await handle.createWritable();
    await writable.write(await getBlob());
    await writable.close();
    return;
  }

  const url = window.URL.createObjectURL(await getBlob());
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

// The download endpoint needs a bearer token, so it can't be a plain
// `<a href>` -- fetch it as a blob and save it through the location prompt.
export async function downloadResume(accessToken: string, resumeId: string, filename: string): Promise<void> {
  return saveWithLocationPrompt(filename, async () => {
    if (UseMockProfile) return mockProfile.downloadResume(filename);
    const response = await axios.get(`${AppConfig.serviceUrls.candidates}/me/resumes/${resumeId}/download`, {
      headers: authHeader(accessToken),
      responseType: "blob",
    });
    return response.data as Blob;
  });
}

export async function submitApplication(
  accessToken: string,
  jobId: string,
  resumeId: string,
  job: { jobTitle: string; department: string },
): Promise<Application> {
  if (UseMockProfile) return mockProfile.submitApplication(jobId, resumeId, job);
  const response = await axios.post<Application>(
    `${AppConfig.serviceUrls.jobs}/${jobId}/apply`,
    { resumeId: Number(resumeId) },
    { headers: authHeader(accessToken) },
  );
  return response.data;
}

// The application form and CV go up together in one multipart request; the backend creates the candidate in
// the vacancy service. A guest sends no token, and a signed-in applicant's token is sent along.
export async function submitApplicationForm(
  accessToken: string,
  jobId: string,
  details: GuestApplicationDetails,
  cv: File,
): Promise<void> {
  if (UseMockProfile) return mockProfile.submitGuestApplication();
  const form = new FormData();
  Object.entries(details).forEach(([key, value]) => form.append(key, String(value)));
  form.append("cv", cv);
  // No Content-Type here: the browser adds it with the multipart boundary.
  await axios.post(`${AppConfig.serviceUrls.jobs}/${jobId}/apply`, form, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  });
}

export async function fetchApplications(accessToken: string): Promise<Application[]> {
  if (UseMockProfile) return mockProfile.fetchApplications();
  const response = await axios.get<Application[]>(AppConfig.serviceUrls.applications, {
    headers: authHeader(accessToken),
  });
  return response.data;
}

export async function respondToOffer(
  accessToken: string,
  applicationId: string,
  decision: Exclude<OfferDecision, "Pending">,
): Promise<Application> {
  if (UseMockProfile) return mockProfile.respondToOffer(applicationId, decision);
  const response = await axios.patch<Application>(
    `${AppConfig.serviceUrls.applications}/${applicationId}/offer`,
    { decision },
    { headers: authHeader(accessToken) },
  );
  return response.data;
}

export async function uploadApplicationDocument(
  accessToken: string,
  applicationId: string,
  documentId: string,
  file: File,
): Promise<Application> {
  if (UseMockProfile) return mockProfile.uploadApplicationDocument(applicationId, documentId, file);
  const form = new FormData();
  form.append("file", file);
  const response = await axios.post<Application>(
    `${AppConfig.serviceUrls.applications}/${applicationId}/documents/${documentId}`,
    form,
    { headers: { ...authHeader(accessToken), "Content-Type": "multipart/form-data" } },
  );
  return response.data;
}

export async function submitApplicationDocuments(accessToken: string, applicationId: string): Promise<Application> {
  if (UseMockProfile) return mockProfile.submitApplicationDocuments(applicationId);
  const response = await axios.post<Application>(
    `${AppConfig.serviceUrls.applications}/${applicationId}/documents/submit`,
    {},
    { headers: authHeader(accessToken) },
  );
  return response.data;
}

export async function downloadOfferLetter(accessToken: string, applicationId: string, position: string): Promise<void> {
  const filename = `${position.trim().replace(/\s+/g, "_")}_Offer_Letter.pdf`;
  return saveWithLocationPrompt(filename, async () => {
    if (UseMockProfile) return mockProfile.downloadOfferLetter(position);
    const response = await axios.get(`${AppConfig.serviceUrls.applications}/${applicationId}/offer/download`, {
      headers: authHeader(accessToken),
      responseType: "blob",
    });
    return response.data as Blob;
  });
}

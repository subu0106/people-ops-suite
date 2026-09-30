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

import { AppConfig } from "@config/config";
import { Application, CandidateProfile } from "@/types/types";

// The Ballerina backend decodes this header directly without verifying its
// signature, matching every other Ballerina backend in this repo.
function authHeader(accessToken: string) {
  return { "x-jwt-assertion": accessToken };
}

export async function fetchProfile(accessToken: string): Promise<CandidateProfile> {
  const response = await axios.get<CandidateProfile>(`${AppConfig.serviceUrls.candidates}/me`, {
    headers: authHeader(accessToken),
  });
  return response.data;
}

export async function saveProfile(
  accessToken: string,
  partial: Partial<CandidateProfile>,
): Promise<CandidateProfile> {
  const response = await axios.patch<CandidateProfile>(`${AppConfig.serviceUrls.candidates}/me`, partial, {
    headers: authHeader(accessToken),
  });
  return response.data;
}

export async function uploadResume(accessToken: string, file: File): Promise<CandidateProfile> {
  const form = new FormData();
  form.append("file", file);
  const response = await axios.post<CandidateProfile>(`${AppConfig.serviceUrls.candidates}/me/resumes`, form, {
    headers: { ...authHeader(accessToken), "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

export async function activateResume(accessToken: string, resumeId: string): Promise<CandidateProfile> {
  const response = await axios.patch<CandidateProfile>(
    `${AppConfig.serviceUrls.candidates}/me/resumes/${resumeId}/activate`,
    {},
    { headers: authHeader(accessToken) },
  );
  return response.data;
}

export async function deleteResume(accessToken: string, resumeId: string): Promise<CandidateProfile> {
  const response = await axios.delete<CandidateProfile>(
    `${AppConfig.serviceUrls.candidates}/me/resumes/${resumeId}`,
    { headers: authHeader(accessToken) },
  );
  return response.data;
}

// The download endpoint needs a bearer token, so it can't be a plain
// `<a href>` -- fetch it as a blob and trigger the browser's save-as flow.
export async function downloadResume(accessToken: string, resumeId: string, filename: string): Promise<void> {
  const response = await axios.get(`${AppConfig.serviceUrls.candidates}/me/resumes/${resumeId}/download`, {
    headers: authHeader(accessToken),
    responseType: "blob",
  });
  const url = window.URL.createObjectURL(response.data as Blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export async function submitApplication(
  accessToken: string,
  jobId: string,
  resumeId: string,
): Promise<Application> {
  const response = await axios.post<Application>(
    `${AppConfig.serviceUrls.jobs}/${jobId}/apply`,
    { resumeId: Number(resumeId) },
    { headers: authHeader(accessToken) },
  );
  return response.data;
}

export async function fetchApplications(accessToken: string): Promise<Application[]> {
  const response = await axios.get<Application[]>(AppConfig.serviceUrls.applications, {
    headers: authHeader(accessToken),
  });
  return response.data;
}

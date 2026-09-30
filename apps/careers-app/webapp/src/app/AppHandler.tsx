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

import { Navigate, RouterProvider, createBrowserRouter } from "react-router-dom";

import { useMemo } from "react";

import AppShell from "@component/common/AppShell";
import Layout from "@layout/Layout";
import NotFoundPage from "@layout/pages/404";
import { RootState, useAppSelector } from "@slices/store";
import { View } from "@view/index";

import { getActiveRoutesV2, routes } from "../route";

const AppHandler = () => {
  const auth = useAppSelector((state: RootState) => state.auth);

  const router = useMemo(
    () =>
      createBrowserRouter([
        {
          element: <AppShell />,
          errorElement: <NotFoundPage />,
          children: [
            { path: "/", element: <Navigate to="/jobs" replace /> },
            { path: "/careers/internships", element: <View.internships /> },
            { path: "/jobs", element: <View.jobs /> },
            { path: "/jobs/:id", element: <View.jobDetail /> },
            { path: "/profile", element: <View.profile /> },
            { path: "/applications", element: <View.applications /> },
          ],
        },
        {
          element: <Layout />,
          errorElement: <NotFoundPage />,
          children: [...getActiveRoutesV2(routes, auth.roles)],
        },
        { path: "*", element: <NotFoundPage /> },
      ]),
    [auth.roles],
  );

  return <RouterProvider router={router} />;
};

export default AppHandler;

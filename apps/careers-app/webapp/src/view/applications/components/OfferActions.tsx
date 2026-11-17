// Copyright (c) 2026 WSO2 LLC. (https://www.wso2.com).
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

import { Box, Button, Dialog, DialogActions, DialogContent, Stack, Typography } from "@wso2/oxygen-ui";
import { ClipboardList } from "@wso2/oxygen-ui-icons-react";
import { useRef, useState } from "react";

import type { OfferSummary } from "@/types/types";
import CenteredSpinner from "@component/common/CenteredSpinner";
import { useAppAuthContext } from "@context/AuthContext";
import { fetchOfferSummary } from "@utils/profileService";
import { pillButtonSx } from "@utils/styles";
import { formatDate } from "@view/applications/applicationHelpers";

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);

// The country name of a country code; the code itself when it is not a standard one.
const countryName = (code: string | null): string | null => {
  if (!code) return null;
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
};

// The rows of the summary in the order they are shown; a detail the offer does not have is left out.
const summaryRows = (summary: OfferSummary): [string, string][] => {
  const pay = summary.compensation;
  const rows: [string, string | null][] = [
    ["Position", summary.vacancyTitle],
    ["Offer type", summary.offerType],
    ["Coming from", countryName(summary.originCountry)],
    ["Work location", summary.location],
    ["Team", summary.team],
    ["Reports to", summary.reporting],
    ["Employment type", summary.empType],
    ["Shift", summary.shift],
    ["Contract duration", summary.duration],
    ["Probation", summary.probation],
    ["Salary option", summary.salaryOption ? `Option ${summary.salaryOption}` : null],
    ["Start date", summary.startDate ? formatDate(summary.startDate) : null],
    ["Monthly salary", pay?.monthlySalary ?? null],
    ["Annual salary", pay?.annualSalary ?? null],
    ["Commission or bonus", pay?.commissionBonus ?? null],
    ["OTE", pay?.ote ?? null],
    ["Offer sent on", summary.offeredDate ? formatDate(summary.offeredDate) : null],
    ["Answer by", summary.offerExpiry ? formatDate(summary.offerExpiry) : null],
  ];
  return rows.filter((row): row is [string, string] => Boolean(row[1] && row[1].trim() !== "" && row[1] !== "-"));
};

// The printable page of the summary.
const summaryPage = (summary: OfferSummary): string =>
  `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Summary of your offer</title>
<style>body{font-family:Arial,Helvetica,sans-serif;color:#17223a;margin:40px}h1{font-size:22px;margin:0 0 4px}
p{font-size:13px;color:#555}table{width:100%;border-collapse:collapse;margin-top:16px}
td{padding:8px 0;border-bottom:1px solid #ddd;font-size:14px}td:first-child{color:#555;width:40%}</style></head><body>
<h1>Summary of your offer</h1><p>${escapeHtml(summary.vacancyTitle)}</p>
<table>${summaryRows(summary)
    .map(([label, value]) => `<tr><td>${escapeHtml(label)}</td><td>${escapeHtml(value)}</td></tr>`)
    .join("")}</table>
<p style="margin-top:24px">This is a summary. Your full offer letter was sent to your email.</p></body></html>`;

// Prints a page through a hidden frame, where the reader can save it as a PDF.
const printPage = (html: string) => {
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
  frame.onload = () => {
    const printed = frame.contentWindow;
    if (!printed) return;
    printed.onafterprint = () => frame.remove();
    printed.focus();
    printed.print();
  };
  frame.srcdoc = html;
  document.body.appendChild(frame);
  window.setTimeout(() => frame.remove(), 120_000);
};

interface OfferSummaryButtonProps {
  applicationId: string;
  jobTitle: string;
}

// A button that opens the summary of the offer, which can also be saved as a PDF.
export const OfferSummaryButton = ({ applicationId, jobTitle }: OfferSummaryButtonProps) => {
  const { getToken } = useAppAuthContext();
  const [open, setOpen] = useState(false);
  // Undefined while loading, null when there is no offer to show, and "failed" when it could not be loaded.
  const [summary, setSummary] = useState<OfferSummary | null | undefined | "failed">(undefined);
  const attempt = useRef(0);

  const show = () => {
    const current = ++attempt.current;
    setSummary(undefined);
    setOpen(true);
    getToken()
      .then((token) => fetchOfferSummary(token, applicationId))
      .then((loaded) => {
        if (attempt.current === current) setSummary(loaded);
      })
      .catch(() => {
        if (attempt.current === current) setSummary("failed");
      });
  };

  const close = () => {
    attempt.current += 1;
    setOpen(false);
    setSummary(undefined);
  };

  return (
    <>
      <Button variant="outlined" startIcon={<ClipboardList size={16} />} onClick={show} sx={{ ...pillButtonSx, px: 3 }}>
        View offer details
      </Button>
      <Dialog open={open} onClose={close} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: "16px" } }}>
        <DialogContent sx={{ pt: 3 }}>
          <Typography fontWeight={800} fontSize="1.3rem" color="text.primary">
            Summary of your offer
          </Typography>
          <Typography fontSize="0.9rem" color="text.secondary" mb={2}>
            {jobTitle}
          </Typography>
          {summary === undefined ? (
            <CenteredSpinner py={4} />
          ) : summary === "failed" ? (
            <Typography fontSize="0.95rem" color="text.primary">
              We could not load your offer. Please try again.
            </Typography>
          ) : summary === null ? (
            <Typography fontSize="0.95rem" color="text.primary">
              There is no offer to show.
            </Typography>
          ) : (
            <Box>
              {summaryRows(summary).map(([label, value]) => (
                <Stack
                  key={label}
                  direction="row"
                  justifyContent="space-between"
                  gap={2}
                  sx={{ py: 1, borderBottom: "1px solid", borderColor: "divider" }}
                >
                  <Typography fontSize="0.9rem" color="text.secondary">
                    {label}
                  </Typography>
                  <Typography fontSize="0.9rem" fontWeight={600} color="text.primary" sx={{ textAlign: "right" }}>
                    {value}
                  </Typography>
                </Stack>
              ))}
              <Typography fontSize="0.8rem" color="text.secondary" mt={2}>
                This is a summary. Your full offer letter was sent to your email.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: "flex-end", gap: 1, pb: 2, px: 3 }}>
          <Button onClick={close} sx={{ fontWeight: 600 }}>
            Close
          </Button>
          {summary && summary !== "failed" && (
            <Button variant="contained" onClick={() => printPage(summaryPage(summary))} sx={{ ...pillButtonSx, px: 3 }}>
              Download PDF
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};

interface OfferActionsProps {
  applicationId: string;
  jobTitle: string;
  // False when the candidate has already accepted another offer.
  canAccept: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

// The buttons that answer an offer; accepting is not offered once another offer has been accepted.
const OfferActions = ({ applicationId, jobTitle, canAccept, onAccept, onDecline }: OfferActionsProps) => (
  <Stack direction="row" alignItems="center" gap={1.5} flexWrap="wrap" sx={{ mb: 3 }}>
    <OfferSummaryButton applicationId={applicationId} jobTitle={jobTitle} />
    {canAccept ? (
      <Button variant="contained" onClick={onAccept} sx={{ ...pillButtonSx, px: 3 }}>
        Accept offer
      </Button>
    ) : (
      <Typography fontSize="0.9rem" color="text.secondary">
        You have already accepted another offer, so you can&apos;t accept this one.
      </Typography>
    )}
    <Button variant="outlined" onClick={onDecline} sx={{ ...pillButtonSx, px: 3 }}>
      Decline offer
    </Button>
  </Stack>
);

export default OfferActions;

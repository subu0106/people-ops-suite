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

import { Box, Button, Typography } from "@wso2/oxygen-ui";
import { Award } from "@wso2/oxygen-ui-icons-react";
import { useEffect, useState } from "react";

import StatusDialog from "@component/common/StatusDialog";
import { useAppAuthContext } from "@context/AuthContext";
import { fetchOfferSummary } from "@utils/profileService";
import { pillButtonSx } from "@utils/styles";
import { SelectInput } from "@view/documents/FormInputs";

const SALARY_OPTIONS = ["Option 1", "Option 2"];

interface AcceptOfferDialogProps {
  applicationId: string;
  jobTitle: string;
  sending: boolean;
  onConfirm: (salaryOption?: "1" | "2") => void;
  onClose: () => void;
}

// Asks the candidate to confirm accepting an offer, since the answer cannot be changed here afterwards. An offer with
// salary options also asks which option is accepted.
const AcceptOfferDialog = ({ applicationId, jobTitle, sending, onConfirm, onClose }: AcceptOfferDialogProps) => {
  const { getToken } = useAppAuthContext();
  // Undefined while the offer is checked, true when a salary option must be chosen, and null when the check failed.
  const [hasOptions, setHasOptions] = useState<boolean | null | undefined>(undefined);
  const [option, setOption] = useState("");

  useEffect(() => {
    let cancelled = false;
    getToken()
      .then((token) => fetchOfferSummary(token, applicationId))
      .then((summary) => {
        if (!cancelled) setHasOptions(summary?.hasSalaryOptions ?? false);
      })
      .catch(() => {
        if (!cancelled) setHasOptions(null);
      });
    return () => {
      cancelled = true;
    };
  }, [applicationId, getToken]);

  const canConfirm = !sending && hasOptions !== undefined && hasOptions !== null && (!hasOptions || option !== "");

  return (
    <StatusDialog
      open
      onClose={sending ? () => undefined : onClose}
      tone="brand"
      icon={<Award size={32} />}
      title="Accept this offer?"
      actions={
        <>
          <Button onClick={onClose} disabled={sending} sx={{ fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => onConfirm(hasOptions ? (option === SALARY_OPTIONS[0] ? "1" : "2") : undefined)}
            disabled={!canConfirm}
            sx={{ ...pillButtonSx, px: 3 }}
          >
            {sending ? "Accepting..." : "Yes, accept"}
          </Button>
        </>
      }
    >
      <Typography fontSize="0.95rem" color="text.primary">
        You are about to accept the offer for {jobTitle}. You will not be able to change this answer here afterwards.
      </Typography>
      {hasOptions === null && (
        <Typography fontSize="0.9rem" color="text.secondary" mt={2}>
          We could not check your offer. Please close this and try again.
        </Typography>
      )}
      {hasOptions && (
        <Box sx={{ display: "grid", mt: 2, textAlign: "left" }}>
          <SelectInput
            label="Salary option"
            value={option}
            onChange={setOption}
            options={SALARY_OPTIONS}
            disabled={sending}
            required
            span={12}
          />
        </Box>
      )}
    </StatusDialog>
  );
};

export default AcceptOfferDialog;

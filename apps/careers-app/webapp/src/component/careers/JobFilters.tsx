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

// Styled after wso2.com/careers' own vacancy filter bar (the `.pd-filterbar`/
// `.pd-dropdown`/`.pd-chip` design) -- pill-shaped multi-select dropdowns with
// a count badge, plus an active-filter chip row underneath.

import { Box, ClickAwayListener, Fade, Paper, Popper, Stack, Typography } from "@mui/material";
import { Check, ChevronDown, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { RootState, useAppSelector } from "@slices/store";

export interface JobFilterValues {
  team: string[];
  location: string[];
}

interface JobFiltersProps {
  filters: JobFilterValues;
  onChange: (filters: JobFilterValues) => void;
}

type DropdownKey = "team" | "location";

const JobFilters = ({ filters, onChange }: JobFiltersProps) => {
  const { locations, teams } = useAppSelector((state: RootState) => state.careers.orgStructure);
  const jobs = useAppSelector((state: RootState) => state.careers.jobs);
  const [openDropdown, setOpenDropdown] = useState<DropdownKey | null>(null);
  const teamAnchor = useRef<HTMLButtonElement>(null);
  const locationAnchor = useRef<HTMLButtonElement>(null);

  // How many open positions each dropdown option would match, shown next to
  // the option so candidates know a filter is worth picking before they do.
  const teamCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    teams.forEach((team) => {
      counts[team] = jobs.filter((job) => job.team === team).length;
    });
    return counts;
  }, [jobs, teams]);

  const locationCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    locations.forEach((loc) => {
      counts[loc] = jobs.filter((job) =>
        job.country.some(
          (c) => c.toLowerCase().includes(loc.toLowerCase()) || loc.toLowerCase().includes(c.toLowerCase()),
        ),
      ).length;
    });
    return counts;
  }, [jobs, locations]);

  const counts: Record<DropdownKey, Record<string, number>> = { team: teamCounts, location: locationCounts };

  const anchors: Record<DropdownKey, React.RefObject<HTMLButtonElement | null>> = {
    team: teamAnchor,
    location: locationAnchor,
  };

  const toggleValue = (key: DropdownKey, value: string) => {
    const current = filters[key];
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    onChange({ ...filters, [key]: next });
  };

  const removeChip = (key: DropdownKey, value: string) => {
    onChange({ ...filters, [key]: filters[key].filter((v) => v !== value) });
  };

  const clearAll = () => onChange({ team: [], location: [] });

  const hasActive = filters.team.length > 0 || filters.location.length > 0;

  const renderDropdown = (key: DropdownKey, label: string, options: string[], columns: number) => {
    const selected = filters[key];
    const isOpen = openDropdown === key;

    return (
      <Box sx={{ position: "relative", height: "48px" }}>
        <Box
          component="div"
          role="button"
          tabIndex={0}
          ref={anchors[key]}
          onClick={() => setOpenDropdown(isOpen ? null : key)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setOpenDropdown(isOpen ? null : key);
            }
          }}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            width: "100%",
            height: "100%",
            minWidth: 150,
            padding: "0 14px",
            background: isOpen ? "#eceef3" : "transparent",
            border: "none",
            borderRadius: "40px",
            textAlign: "left",
            cursor: "pointer",
            transition: "background 0.15s",
            "&:hover": { background: "#eceef3" },
          }}
        >
          <Stack direction="row" alignItems="center" gap={1} sx={{ overflow: "hidden" }}>
            <Typography
              component="span"
              noWrap
              sx={{
                fontSize: selected.length ? "14px" : "1rem",
                fontWeight: selected.length ? 600 : 400,
                color: selected.length ? "#0e1a33" : "rgba(23,34,58,0.7)",
              }}
            >
              {selected.length
                ? `${label}: ${selected[0]}${selected.length > 1 ? ` +${selected.length - 1}` : ""}`
                : label}
            </Typography>
          </Stack>
          {selected.length > 0 ? (
            <Box
              component="button"
              type="button"
              aria-label={`Clear ${label} filter`}
              onClick={(e) => {
                e.stopPropagation();
                onChange({ ...filters, [key]: [] });
              }}
              sx={{
                display: "flex",
                flexShrink: 0,
                border: "none",
                background: "none",
                cursor: "pointer",
                color: "#6b7591",
                borderRadius: "50%",
                p: 0.25,
                "&:hover": { background: "#dfe2e8", color: "#17223a" },
              }}
            >
              <X size={14} />
            </Box>
          ) : (
            <ChevronDown
              size={16}
              color="#6b7591"
              style={{
                flexShrink: 0,
                transition: "transform 0.2s",
                transform: isOpen ? "rotate(180deg)" : "none",
              }}
            />
          )}
        </Box>

        <Popper open={isOpen} anchorEl={anchors[key].current} placement="bottom-start" transition sx={{ zIndex: 60 }}>
          {({ TransitionProps }) => (
            <Fade {...TransitionProps} timeout={150}>
              <Paper
                sx={{
                  mt: "6px",
                  minWidth: 240,
                  maxWidth: 440,
                  maxHeight: 320,
                  overflowY: "auto",
                  border: "1px solid #e2e5ec",
                  borderRadius: "12px",
                  boxShadow: "0 20px 50px -12px rgb(7 20 46 / 20%), 0 4px 8px rgb(7 20 46 / 4%)",
                  padding: "8px",
                  columnCount: { xs: 1, sm: columns },
                  columnGap: 0,
                }}
              >
                {options.map((opt) => {
                  const checked = selected.includes(opt);
                  return (
                    <Box
                      key={opt}
                      component="button"
                      onClick={() => toggleValue(key, opt)}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        width: "100%",
                        padding: "9px 10px",
                        border: "none",
                        background: "none",
                        borderRadius: "6px",
                        fontSize: "14px",
                        color: "#17223a",
                        textAlign: "left",
                        cursor: "pointer",
                        breakInside: "avoid",
                        "&:hover": { background: "#eceef3" },
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: 16,
                          height: 16,
                          flexShrink: 0,
                          background: checked ? "#ff6700" : "#fff",
                          border: checked ? "1.5px solid #ff6700" : "1.5px solid #d5d9e2",
                          borderRadius: "4px",
                        }}
                      >
                        {checked && <Check size={11} color="#fff" strokeWidth={3} />}
                      </Box>
                      <Box component="span" sx={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>
                        {opt}
                      </Box>
                      <Box
                        component="span"
                        sx={{
                          flexShrink: 0,
                          minWidth: 20,
                          height: 20,
                          px: "6px",
                          borderRadius: "999px",
                          background: "#ff6700",
                          color: "#fff",
                          fontSize: "11px",
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {counts[key][opt] ?? 0}
                      </Box>
                    </Box>
                  );
                })}
              </Paper>
            </Fade>
          )}
        </Popper>
      </Box>
    );
  };

  return (
    <ClickAwayListener onClickAway={() => setOpenDropdown(null)}>
      <Box>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(2, minmax(0, 1fr)) auto" },
            gap: 1,
            alignItems: "center",
            maxWidth: 1200,
            padding: "10px",
            background: "#fff",
            borderRadius: "40px",
            boxShadow: "0 14px 40px -14px rgb(7 20 46 / 35%), 0 1px 0 rgb(7 20 46 / 6%)",
          }}
        >
          {renderDropdown("team", "Team", teams, 2)}
          {renderDropdown("location", "Location", locations, 3)}
        </Box>

        {hasActive && (
          <Stack direction="row" flexWrap="wrap" alignItems="center" gap={1} sx={{ mt: 2 }}>
            {filters.team.map((t) => (
              <Stack
                key={`team-${t}`}
                direction="row"
                alignItems="center"
                gap={0.75}
                sx={{
                  padding: "6px 8px 6px 12px",
                  background: "#fff",
                  border: "1px solid #e2e5ec",
                  borderRadius: "999px",
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "#0e1a33",
                }}
              >
                <span>{t}</span>
                <Box
                  component="button"
                  onClick={() => removeChip("team", t)}
                  sx={{ display: "flex", border: "none", background: "none", cursor: "pointer", p: 0, color: "#6b7591" }}
                >
                  <X size={13} />
                </Box>
              </Stack>
            ))}
            {filters.location.map((l) => (
              <Stack
                key={`location-${l}`}
                direction="row"
                alignItems="center"
                gap={0.75}
                sx={{
                  padding: "6px 8px 6px 12px",
                  background: "#fff",
                  border: "1px solid #e2e5ec",
                  borderRadius: "999px",
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "#0e1a33",
                }}
              >
                <span>{l}</span>
                <Box
                  component="button"
                  onClick={() => removeChip("location", l)}
                  sx={{ display: "flex", border: "none", background: "none", cursor: "pointer", p: 0, color: "#6b7591" }}
                >
                  <X size={13} />
                </Box>
              </Stack>
            ))}
            <Box
              component="button"
              onClick={clearAll}
              sx={{
                background: "none",
                border: "none",
                padding: "6px 8px",
                fontSize: "13px",
                fontWeight: 600,
                color: "#ff6700",
                cursor: "pointer",
              }}
            >
              Clear all
            </Box>
          </Stack>
        )}
      </Box>
    </ClickAwayListener>
  );
};

export default JobFilters;

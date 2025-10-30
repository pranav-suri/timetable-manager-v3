import { Box, Tabs, Tab, Container } from "@mui/material";
import { Link, useLocation } from "@tanstack/react-router";
import SchoolIcon from "@mui/icons-material/School";
import ElectricBoltIcon from "@mui/icons-material/ElectricBolt";
import EditIcon from "@mui/icons-material/Edit";
import EventNoteIcon from "@mui/icons-material/EventNote";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import CategoryIcon from "@mui/icons-material/Category";
import SupervisorAccountIcon from "@mui/icons-material/SupervisorAccount";
import MenuBookIcon from "@mui/icons-material/MenuBook";

interface TimetableNavigationTabsProps {
  timetableId: string;
}

interface TabConfig {
  label: string;
  path: string;
  icon: React.ReactNode;
  group: "data" | "generate" | "edit" | "ai";
}

const TABS: TabConfig[] = [
  // Data Management Group
  {
    label: "Teachers",
    path: "/tt/:timetableId/teachers",
    icon: <SupervisorAccountIcon />,
    group: "data",
  },
  {
    label: "Subject Types",
    path: "/tt/:timetableId/groups",
    icon: <CategoryIcon />,
    group: "data",
  },
  {
    label: "Subjects",
    path: "/tt/:timetableId/subjects",
    icon: <EventNoteIcon />,
    group: "data",
  },
  {
    label: "Classrooms",
    path: "/tt/:timetableId/classrooms",
    icon: <LocationOnIcon />,
    group: "data",
  },
  {
    label: "Lectures",
    path: "/tt/:timetableId/lectures",
    icon: <MenuBookIcon />,
    group: "data",
  },
  // Generation Group
  {
    label: "Generate",
    path: "/tt/:timetableId/generate",
    icon: <ElectricBoltIcon />,
    group: "generate",
  },
  // Edit Group
  {
    label: "Edit Schedule",
    path: "/tt/:timetableId/edit",
    icon: <EditIcon />,
    group: "edit",
  },
  // AI Group
  {
    label: "AI Assistant",
    path: "/tt/:timetableId/chatbot",
    icon: <SmartToyIcon />,
    group: "ai",
  },
] as const;

export function TimetableNavigationTabs({
  timetableId,
}: TimetableNavigationTabsProps) {
  const location = useLocation();

  // Determine the current tab based on the pathname
  const getCurrentTabValue = (): number | false => {
    const currentPath = location.pathname;

    // Check if current path matches any tab
    // Sort by path length descending to check longer paths first (e.g., /edit/ before /)
    const sortedTabs = TABS.map((tab, i) => ({
      ...tab,
      originalIndex: i,
    })).sort((a, b) => b.path.length - a.path.length);

    for (const tab of sortedTabs) {
      // @ts-ignore Error: tab may be undefined, this won't happen
      const tabPath = tab.path.replace(":timetableId", timetableId);
      if (currentPath.startsWith(tabPath)) {
        return tab.originalIndex;
      }
    }

    return false;
  };

  const currentTabValue = getCurrentTabValue();

  return (
    <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
      <Container sx={{ display: "flex", justifyContent: "center" }}>
        <Tabs
          value={currentTabValue}
          aria-label="timetable navigation"
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            "& .MuiTab-root": {
              minHeight: 56,
            },
          }}
        >
          {TABS.map((tab) => {
            const resolvedPath = tab.path.replace(":timetableId", timetableId);
            return (
              <Tab
                key={tab.path}
                label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {tab.icon}
                    <span>{tab.label}</span>
                  </Box>
                }
                component={Link}
                to={resolvedPath}
                sx={{
                  textTransform: "none",
                  fontSize: "0.95rem",
                  fontWeight: 500,
                  minHeight: 56,
                }}
              />
            );
          })}
        </Tabs>
      </Container>
    </Box>
  );
}

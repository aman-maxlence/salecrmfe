import { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import {
  Briefcase,
  Building2,
  ChevronRight,
  ChevronDown,
  Search,
  Plus,
  Users,
  Layers,
  Trash2,
  Download,
  Edit,
  ChevronUp,
  ListOrdered,
  LayoutGrid,
  MapPin,
} from 'lucide-react';
import { RootState } from '@/store/store';
import {
  useDeleteTerritoryMutation,
  useGetTerritoriesQuery,
  useCreateTerritoryMutation,
} from '../services/territoriesApi';
import {
  useGetDepartmentsQuery,
  useCreateDepartmentMutation,
} from '../services/departmentsApi';
import { useGetTeamsQuery } from '../services/teamsApi';
import {
  useGetUsersQuery,
  useUpdateUserTerritoryMutation,
  useUpdateUserTeamMutation,
  useUpdateUserManagerMutation,
} from '../services/usersApi';
import { getErrorMessage, PortalUser, Team, Territory } from '../models';
import { usePermissions } from '../hooks/usePermissions';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { CreateTeamModal } from '../components/CreateTeamModal';
import { Dialog, DialogContent, DialogFooter } from '../components/ui/Dialog';

/** Each level of the org-chart gets its own color so the tier is obvious at
 * a glance instead of every box looking identical. Keys/order also drive
 * the legend rendered above the chart, and the matching hex values below
 * are reused for the static HTML export. */
type TreeTier = 'admin' | 'territory' | 'department' | 'team' | 'member';

const TIER_LABELS: Record<TreeTier, string> = {
  admin: 'Workspace Admin',
  territory: 'Territory',
  department: 'Department',
  team: 'Team',
  member: 'Member',
};

const TIER_GRADIENTS: Record<TreeTier, string> = {
  admin: 'from-[#1e293b] to-[#334155]',
  territory: 'from-[#2e5d99] to-[#3a70ad]',
  department: 'from-[#0f766e] to-[#14b8a6]',
  team: 'from-[#6d28d9] to-[#8b5cf6]',
  member: 'from-[#047857] to-[#10b981]',
};

// Same 5 colors as TIER_GRADIENTS above, as plain hex for the CSS export (no Tailwind there).
const TIER_HEX: Record<TreeTier, [string, string]> = {
  admin: ['#1e293b', '#334155'],
  territory: ['#2e5d99', '#3a70ad'],
  department: ['#0f766e', '#14b8a6'],
  team: ['#6d28d9', '#8b5cf6'],
  member: ['#047857', '#10b981'],
};

const TREE_TIERS: TreeTier[] = ['admin', 'territory', 'department', 'team', 'member'];

/** One box in the Tree View org-chart (see the `.org-chart` CSS in index.css
 * for how sibling boxes get connected) - every tier (Territory, Department,
 * Team, Member) renders the same card shape, colored by `tier`. */
function TreeCard({ tier, initials, title, subtitle }: { tier: TreeTier; initials: string; title: string; subtitle: string }) {
  return (
    <div className={`w-52 p-3 rounded-xl bg-gradient-to-r ${TIER_GRADIENTS[tier]} text-white shadow-md flex items-center gap-3 border border-white/15 hover:shadow-lg transition-all hover:scale-[1.02]`}>
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-800 font-bold text-xs border-2 border-white/40 shadow-xs">
        {initials}
      </div>
      <div className="min-w-0 text-left">
        <h4 className="text-sm font-bold text-white truncate leading-tight">{title}</h4>
        <p className="text-xs text-sky-200 font-normal truncate">{subtitle}</p>
      </div>
    </div>
  );
}

/** Small color-key above the org-chart so the tier colors are self-explanatory. */
function TreeLegend() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 pb-2">
      {TREE_TIERS.map((tier) => (
        <div key={tier} className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <span className={`h-2.5 w-2.5 rounded-full bg-gradient-to-r ${TIER_GRADIENTS[tier]}`} />
          {TIER_LABELS[tier]}
        </div>
      ))}
    </div>
  );
}

/** A team's members, nested by their "Reports To" manager rather than shown
 * as a flat list - whoever a member reports to (within the same team)
 * becomes their parent node, recursively. `visited` guards against a
 * reporting-chain cycle (e.g. manually mis-set data) looping forever. */
function MemberTreeNode({
  member,
  allMembers,
  visited,
}: {
  member: PortalUser;
  allMembers: PortalUser[];
  visited: Set<string>;
}) {
  const memberName = member.name || member.email?.split('@')[0] || `User #${member.user_id}`;
  const key = String(member.user_id);
  const reports = visited.has(key) ? [] : allMembers.filter((m) => String(m.manager_id) === key);
  const nextVisited = new Set(visited).add(key);

  return (
    <li>
      <TreeCard
        tier="member"
        initials={memberName.substring(0, 2).toUpperCase()}
        title={memberName}
        subtitle={member.role?.role_name || 'Member'}
      />
      {reports.length > 0 && (
        <ul>
          {reports.map((report) => (
            <MemberTreeNode key={report.id} member={report} allMembers={allMembers} visited={nextVisited} />
          ))}
        </ul>
      )}
    </li>
  );
}

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** One box in the exported tree - same look as the on-screen TreeCard, colored by tier, as a static HTML string. */
function treeCardHtml(tier: TreeTier, initials: string, title: string, subtitle: string): string {
  return `<div class="tree-card tier-${tier}"><div class="tree-avatar">${escapeHtml(initials)}</div><div class="tree-text"><h4>${escapeHtml(title)}</h4><p>${escapeHtml(subtitle)}</p></div></div>`;
}

/** Walks a team's members the same way MemberTreeNode does (roots first, then their reports), as nested <ul><li> HTML instead of JSX. */
function memberNodeHtml(member: PortalUser, allMembers: PortalUser[], visited: Set<string>): string {
  const key = String(member.user_id);
  const memberName = member.name || member.email?.split('@')[0] || `User #${member.user_id}`;
  const reports = visited.has(key) ? [] : allMembers.filter((m) => String(m.manager_id) === key);
  const nextVisited = new Set(visited).add(key);
  const childrenHtml =
    reports.length > 0
      ? `<ul>${reports.map((r) => memberNodeHtml(r, allMembers, nextVisited)).join('')}</ul>`
      : '';
  return `<li>${treeCardHtml('member', memberName.substring(0, 2).toUpperCase(), memberName, member.role?.role_name || 'Member')}${childrenHtml}</li>`;
}

/** Rebuilds the same Territory -> Department -> Team -> Member tree the Tree View renders, as a static HTML document. */
function buildHierarchyTreeHtml(
  territories: Territory[],
  teamsList: Team[],
  userList: PortalUser[],
  adminName: string,
  orgName: string
): string {
  const territoriesHtml = territories
    .map((territory) => {
      const territoryTeams = teamsList.filter((t) => t.territory_id === territory.id);
      const departmentGroups = new Map<number, { department?: Team['department']; teams: Team[] }>();
      territoryTeams.forEach((t) => {
        const key = t.department_id;
        if (!departmentGroups.has(key)) {
          departmentGroups.set(key, { department: t.department, teams: [] });
        }
        departmentGroups.get(key)!.teams.push(t);
      });

      const deptsHtml =
        departmentGroups.size > 0
          ? `<ul>${[...departmentGroups.values()]
              .map((group) => {
                const deptName = group.department?.name || 'Department';
                const teamsHtml = group.teams
                  .map((team) => {
                    const teamMembers = (team.members ?? [])
                      .map((tm) => userList.find((u) => String(u.user_id) === String(tm.user_id)))
                      .filter((u): u is PortalUser => !!u);

                    let membersHtml = '';
                    if (teamMembers.length > 0) {
                      const memberIds = new Set(teamMembers.map((m) => String(m.user_id)));
                      const roots = teamMembers.filter((m) => !m.manager_id || !memberIds.has(String(m.manager_id)));
                      membersHtml = `<ul>${roots.map((r) => memberNodeHtml(r, teamMembers, new Set())).join('')}</ul>`;
                    }

                    return `<li>${treeCardHtml(
                      'team',
                      team.name.substring(0, 2).toUpperCase(),
                      team.name,
                      `${teamMembers.length} member${teamMembers.length === 1 ? '' : 's'}`
                    )}${membersHtml}</li>`;
                  })
                  .join('');

                return `<li>${treeCardHtml(
                  'department',
                  deptName.substring(0, 2).toUpperCase(),
                  deptName,
                  `${group.teams.length} team${group.teams.length === 1 ? '' : 's'}`
                )}<ul>${teamsHtml}</ul></li>`;
              })
              .join('')}</ul>`
          : '';

      return `<li>${treeCardHtml(
        'territory',
        territory.name.substring(0, 2).toUpperCase(),
        territory.name,
        `${departmentGroups.size} department${departmentGroups.size === 1 ? '' : 's'}`
      )}${deptsHtml}</li>`;
    })
    .join('');

  const legendHtml = `<div class="legend">${TREE_TIERS.map(
    (tier) => `<span class="legend-item"><span class="legend-dot tier-${tier}"></span>${escapeHtml(TIER_LABELS[tier])}</span>`
  ).join('')}</div>`;

  const rootHtml = `<div class="org-chart"><ul><li>${treeCardHtml(
    'admin',
    adminName.substring(0, 2).toUpperCase(),
    adminName,
    'Workspace Admin'
  )}<ul>${territoriesHtml}</ul></li></ul></div>`;

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>${escapeHtml(orgName)} - Hierarchy Tree</title>
<style>
  body { font-family: -apple-system, "Segoe UI", Arial, sans-serif; background: #f8fafc; margin: 0; padding: 40px 16px; }
  h1 { text-align: center; font-size: 18px; color: #0f172a; margin: 0 0 32px; }
  .org-chart { display: table; margin: 0 auto; padding-top: 24px; }
  .org-chart ul, .org-chart li { list-style: none; margin: 0; padding: 0; position: relative; }
  .org-chart ul { padding-top: 32px; display: flex; justify-content: center; }
  .org-chart li { display: flex; flex-direction: column; align-items: center; padding: 32px 14px 0 14px; }
  .org-chart li::before, .org-chart li::after { content: ''; position: absolute; top: 0; right: 50%; width: 50%; height: 32px; border-top: 2px solid #38bdf8; }
  .org-chart li::after { right: auto; left: 50%; border-left: 2px solid #38bdf8; }
  .org-chart li:only-child { padding-top: 0; }
  .org-chart li:only-child::before, .org-chart li:only-child::after { display: none; }
  .org-chart li:first-child::before, .org-chart li:last-child::after { border: 0 none; }
  .org-chart li:last-child::before { border-right: 2px solid #38bdf8; border-radius: 0 8px 0 0; }
  .org-chart li:first-child::after { border-radius: 8px 0 0 0; }
  .tree-card { width: 208px; padding: 12px; border-radius: 12px; color: #fff; box-shadow: 0 4px 10px rgba(0,0,0,.15); display: flex; align-items: center; gap: 12px; border: 1px solid rgba(255,255,255,.15); }
  .tree-avatar { flex-shrink: 0; height: 40px; width: 40px; border-radius: 9999px; background: #e2e8f0; color: #1e293b; font-weight: 700; font-size: 12px; display: flex; align-items: center; justify-content: center; border: 2px solid rgba(255,255,255,.4); }
  .tree-text { min-width: 0; text-align: left; }
  .tree-text h4 { margin: 0; font-size: 13px; font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .tree-text p { margin: 2px 0 0; font-size: 11px; color: #bae6fd; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  ${TREE_TIERS.map((tier) => `.tier-${tier} { background: linear-gradient(to right, ${TIER_HEX[tier][0]}, ${TIER_HEX[tier][1]}); }`).join('\n  ')}
  .legend { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px 20px; margin-bottom: 8px; }
  .legend-item { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 500; color: #64748b; }
  .legend-dot { display: inline-block; height: 10px; width: 10px; border-radius: 9999px; }
</style>
</head>
<body>
<h1>${escapeHtml(orgName)} - Organization Hierarchy</h1>
${legendHtml}
${rootHtml}
</body>
</html>`;
}

function downloadHierarchyHtml(html: string) {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `hierarchy-export-${new Date().toISOString().slice(0, 10)}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function HierarchyPage() {
  const org = useSelector((state: RootState) => state.auth.organization);
  const orgId = org?.id;
  const { hasPermission, isLoading: permsLoading } = usePermissions();
  const canManageTerritories = permsLoading ? true : hasPermission('manage_territories');

  // Main navigation view: 'structure' | 'assign-users' | 'overview'
  const [currentView, setCurrentView] = useState<'structure' | 'assign-users' | 'overview'>('structure');

  // Live API hooks
  const { data: apiTerritories, isLoading: territoriesLoading } = useGetTerritoriesQuery(orgId ?? 0, {
    skip: !orgId,
  });
  const { data: members, isLoading: usersLoading } = useGetUsersQuery(orgId ?? 0, {
    skip: !orgId,
  });
  const [deleteTerritory, { isLoading: isDeleting }] = useDeleteTerritoryMutation();
  const [createTerritory] = useCreateTerritoryMutation();
  const [updateUserTerritory, { isLoading: isUpdatingUserTerritory }] = useUpdateUserTerritoryMutation();
  const [updateUserTeam, { isLoading: isUpdatingUserTeam }] = useUpdateUserTeamMutation();
  const [updateUserManager, { isLoading: isUpdatingUserManager }] = useUpdateUserManagerMutation();
  const { data: apiDepartments } = useGetDepartmentsQuery(orgId ?? 0, { skip: !orgId });
  const [createDepartment] = useCreateDepartmentMutation();
  const { data: apiTeams, refetch: refetchTeams } = useGetTeamsQuery({ orgId: orgId ?? 0 }, { skip: !orgId });

  // Search & Expansion states
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTerritoryIds, setExpandedTerritoryIds] = useState<Record<number, boolean>>({});
  const [expandedTeamIds, setExpandedTeamIds] = useState<Record<number, boolean>>({});
  const [pendingDelete, setPendingDelete] = useState<{ id: number; name: string } | null>(null);

  // Add Dropdown Menu state (+ Add ▾)
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);

  // Modal States: Department Form (Image 2)
  const [isDepartmentModalOpen, setIsDepartmentModalOpen] = useState(false);
  const [deptFormName, setDeptFormName] = useState('');
  const [deptFormDescription, setDeptFormDescription] = useState('');
  const [deptFormHead, setDeptFormHead] = useState<{ id?: number | string; name: string; role: string } | null>(null);

  // Modal State: Create Team (the form itself lives in CreateTeamModal, shared with TeamPage)
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);

  // Modal States: Add Region / Territory Form
  const [isRegionModalOpen, setIsRegionModalOpen] = useState(false);
  const [regionFormName, setRegionFormName] = useState('');
  const [regionFormManagerId, setRegionFormManagerId] = useState<string>('');

  // Table selection & Mapping states (Assign Users mode - Image 1 & 5)
  const [selectedUser, setSelectedUser] = useState<PortalUser | null>(null);
  const [selectedRowIds, setSelectedRowIds] = useState<number[]>([]);
  const [isMappingEditing, setIsMappingEditing] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);

  // Departments - persisted via departmentsApi (see apiDepartments above)
  const departmentsList = apiDepartments ?? [];

  // Teams - persisted via teamsApi (see apiTeams above)
  const teamsList = apiTeams ?? [];

  // Hierarchy Mapping Modal state
  const [isHierarchyMappingModalOpen, setIsHierarchyMappingModalOpen] = useState(false);

  // Hierarchy Mapping Form fields - a step-by-step drill-down: Territory ->
  // Department (derived - only departments that have a team in that
  // territory) -> Team (derived - that territory+department's teams) ->
  // Manager (this person's own "reports to", picked from the selected
  // team's other members). Department itself isn't saved anywhere (no
  // per-user department column) - it only narrows the Team choices.
  const [mappingRegion, setMappingRegion] = useState('');
  const [mappingDept, setMappingDept] = useState('');
  const [mappingTeam, setMappingTeam] = useState('');
  const [mappingManagerId, setMappingManagerId] = useState('');

  // Bulk Assign Modal state
  const [isBulkAssignOpen, setIsBulkAssignOpen] = useState(false);
  const [bulkRegion, setBulkRegion] = useState('');
  const [bulkTeam, setBulkTeam] = useState('');

  const territories: Territory[] = apiTerritories ?? [];
  const userList: PortalUser[] = members ?? [];
  const managerUsers: PortalUser[] = userList.filter((u) =>
    u.role?.role_name?.toLowerCase().includes('manager')
  );

  // The Tree View's root box - whoever holds the org's admin role.
  const workspaceAdmin = userList.find((u) => u.role?.is_admin);


  // Close add dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(event.target as Node)) {
        setIsAddMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleTerritoryExpand = (id: number) => {
    setExpandedTerritoryIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleTeamExpand = (id: number) => {
    setExpandedTeamIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Open Create Department Modal cleanly
  const handleOpenAddDepartment = () => {
    setDeptFormName('');
    setDeptFormDescription('');
    setDeptFormHead(null);
    setIsDepartmentModalOpen(true);
  };

  // Create Department Handler
  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptFormName.trim() || !orgId) {
      toast.error('Please enter department name');
      return;
    }
    try {
      await createDepartment({
        orgId,
        body: {
          name: deptFormName.trim(),
          description: deptFormDescription.trim() || undefined,
          headUserId: deptFormHead?.id ?? undefined,
        },
      }).unwrap();
      toast.success(`Department "${deptFormName}" created successfully!`);
      setIsDepartmentModalOpen(false);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to create department'));
    }
  };

  // Create Region / Territory Handler
  const handleCreateRegion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regionFormName.trim() || !orgId) {
      toast.error('Please enter territory name');
      return;
    }
    try {
      await createTerritory({
        orgId,
        body: {
          name: regionFormName.trim(),
          managerUserId: regionFormManagerId || undefined,
        },
      }).unwrap();
      toast.success(`Territory "${regionFormName}" created successfully!`);
      setIsRegionModalOpen(false);
      setRegionFormName('');
      setRegionFormManagerId('');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to create territory'));
    }
  };

  // Delete Territory Handler
  const handleDeleteTerritory = async () => {
    if (!pendingDelete || !orgId) return;
    try {
      await deleteTerritory({ orgId, id: pendingDelete.id }).unwrap();
      toast.success('Territory deleted successfully');
      setPendingDelete(null);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete territory'));
    }
  };

  // Save single user mapping (Image 1) - Territory, Team, and Manager
  // ("reports to") are the three relations this actually persists (see the
  // state comment above; Department only narrows the Team dropdown).
  const handleSaveUserMapping = async () => {
    if (!selectedUser || !orgId) return;
    try {
      const matchingTerritory = territories.find(
        (t) => t.name.toLowerCase() === mappingRegion.toLowerCase() || String(t.id) === mappingRegion
      );
      if (matchingTerritory) {
        await updateUserTerritory({
          orgId,
          userId: selectedUser.user_id,
          territoryId: matchingTerritory.id,
        }).unwrap();
      }

      const matchingTeam = mappingTeam
        ? teamsList.find((t) => t.name.toLowerCase() === mappingTeam.toLowerCase() || String(t.id) === mappingTeam)
        : null;
      // Blank selection explicitly clears the team (the field is pre-filled
      // with the user's current team when the modal opens, so an empty
      // value on save is a deliberate "remove from team").
      if (matchingTeam || selectedUser.team_id) {
        await updateUserTeam({
          orgId,
          userId: selectedUser.user_id,
          teamId: matchingTeam ? matchingTeam.id : null,
        }).unwrap();
        refetchTeams();
      }

      const matchingManager = mappingManagerId
        ? userList.find((u) => String(u.user_id) === mappingManagerId)
        : null;
      if (matchingManager || selectedUser.manager_id) {
        await updateUserManager({
          orgId,
          userId: selectedUser.user_id,
          managerId: matchingManager ? matchingManager.user_id : null,
        }).unwrap();
      }

      toast.success(`Hierarchy placement updated for ${selectedUser.name || selectedUser.email}`);
      setIsMappingEditing(false);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to reassign user'));
    }
  };

  // Bulk assign users - leaving a field blank keeps existing values (per the
  // modal's own copy), so Team is only touched when one was actually picked.
  const handleApplyBulkChanges = async () => {
    if (!orgId || selectedRowIds.length === 0) return;
    try {
      const matchingTerritory = territories.find(
        (t) => t.name.toLowerCase() === bulkRegion.toLowerCase() || String(t.id) === bulkRegion
      );
      const matchingTeam = bulkTeam
        ? teamsList.find((t) => t.name.toLowerCase() === bulkTeam.toLowerCase() || String(t.id) === bulkTeam)
        : null;

      for (const userId of selectedRowIds) {
        const u = userList.find((usr) => usr.id === userId);
        if (!u) continue;
        if (matchingTerritory) {
          await updateUserTerritory({
            orgId,
            userId: u.user_id,
            territoryId: matchingTerritory.id,
          }).unwrap();
        }
        if (bulkTeam) {
          await updateUserTeam({
            orgId,
            userId: u.user_id,
            teamId: matchingTeam ? matchingTeam.id : null,
          }).unwrap();
        }
      }

      if (bulkTeam) refetchTeams();
      toast.success(`Assigned ${selectedRowIds.length} user(s) to hierarchy`);
      setIsBulkAssignOpen(false);
      setSelectedRowIds([]);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to bulk assign users'));
    }
  };

  const handleToggleSelectAll = () => {
    if (selectedRowIds.length === userList.length) {
      setSelectedRowIds([]);
    } else {
      setSelectedRowIds(userList.map((u) => u.id));
    }
  };

  const handleToggleSelectRow = (id: number) => {
    setSelectedRowIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Filtered territories based on search
  const filteredTerritories = territories.filter((t) => {
    const manager = userList.find((m) => String(m.user_id) === String(t.manager_user_id));
    const term = searchQuery.toLowerCase();
    return (
      t.name.toLowerCase().includes(term) ||
      (manager?.name && manager.name.toLowerCase().includes(term))
    );
  });

  const filteredUsers = userList.filter((u) => {
    const term = searchQuery.toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(term)) ||
      (u.email && u.email.toLowerCase().includes(term)) ||
      String(u.user_id).toLowerCase().includes(term)
    );
  });

  const activeSelectedUser = selectedUser || userList[0] || null;

  return (
    <div className="space-y-6 pb-12">
      {/* ---------------------------------------------------- */}
      {/* TOP HEADER SECTION                                   */}
      {/* ---------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Briefcase className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Hierarchy Management
            </h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your organization's structure and reporting lines
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Button
            onClick={() => setCurrentView(currentView === 'overview' ? 'structure' : 'overview')}
            className={`h-9 gap-2 font-medium px-4 shadow-sm transition-all ${
              currentView === 'overview'
                ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                : 'border-primary/30 bg-primary/10 text-primary hover:bg-primary/15'
            }`}
            variant={currentView === 'overview' ? 'default' : 'outline'}
          >
            <Layers className="h-4 w-4" />
            <span>Overview</span>
          </Button>

          <Button
            onClick={() => setCurrentView(currentView === 'assign-users' ? 'structure' : 'assign-users')}
            className={`h-9 gap-2 font-medium px-4 shadow-sm transition-all ${
              currentView === 'assign-users'
                ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                : 'border-primary/30 bg-primary/10 text-primary hover:bg-primary/15'
            }`}
            variant={currentView === 'assign-users' ? 'default' : 'outline'}
          >
            <Users className="h-4 w-4" />
            <span>Assign Users</span>
          </Button>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* MODE 1: ORGANISATION STRUCTURE (Matching Screenshot) */}
      {/* ---------------------------------------------------- */}
      {currentView === 'structure' && (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          {/* Card Toolbar */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-foreground">
              Organisation Structure
            </h2>

            <div className="flex items-center gap-3">
              {/* Search Input */}
              <div className="relative min-w-[220px] max-w-xs flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 pl-9 text-sm bg-background border-border"
                />
              </div>

              {/* SPLIT + Add ▾ DROPDOWN (Matching Image 1 & 4) */}
              <div className="relative" ref={addMenuRef}>
                <div className="inline-flex rounded-lg shadow-sm">
                  <button
                    onClick={() => {
                      setRegionFormName('');
                      setRegionFormManagerId('');
                      setIsRegionModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-l-lg bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add</span>
                  </button>
                  <button
                    onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
                    className="inline-flex items-center justify-center rounded-r-lg border-l border-primary-foreground/20 bg-primary px-2 py-2 text-primary-foreground hover:bg-primary/90 transition-colors"
                    title="Choose item to add"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>

                {/* Dropdown Menu */}
                {isAddMenuOpen && (
                  <div className="absolute right-0 mt-1.5 w-48 rounded-xl border border-border bg-popover p-1.5 shadow-xl z-50 animate-in fade-in-50 zoom-in-95">
                    <button
                      onClick={() => {
                        setIsAddMenuOpen(false);
                        handleOpenAddDepartment();
                      }}
                      className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-popover-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      <ListOrdered className="h-4 w-4 text-primary" />
                      <span>Add Department</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsAddMenuOpen(false);
                        setIsTeamModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-popover-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      <LayoutGrid className="h-4 w-4 text-primary" />
                      <span>Add Team</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsAddMenuOpen(false);
                        setRegionFormName('');
                        setRegionFormManagerId('');
                        setIsRegionModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-popover-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      <MapPin className="h-4 w-4 text-primary" />
                      <span>Add Territory / Region</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Hierarchy Tree Container (Matching Screenshot 1 & 2) */}
          <div className="space-y-3.5">
            {/* Root Node: Organization / Company HQ (Purple gradient box) */}
            <div className="rounded-xl border border-purple-200/70 dark:border-purple-900/50 bg-gradient-to-r from-purple-50/70 to-purple-50/20 dark:from-purple-950/30 dark:to-purple-950/10 p-4 transition-all">
              <div className="flex items-center gap-3.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-300">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Organization
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {org?.name || 'Company HQ'}
                  </p>
                </div>
              </div>
            </div>

            {/* Territory Nodes (Delhi, Gurgaon, West Gurgaon, MP, Hyderabad) - Matching Screenshot 1 & 2 */}
            {territoriesLoading ? (
              <div className="py-8 text-center text-sm text-muted-foreground">Loading organization structure...</div>
            ) : filteredTerritories.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border py-12 text-center space-y-2">
                <p className="text-sm text-muted-foreground">No territories or regions found in your organization.</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setRegionFormName('');
                    setRegionFormManagerId('');
                    setIsRegionModalOpen(true);
                  }}
                  className="gap-1.5 text-xs"
                >
                  <Plus className="h-3.5 w-3.5 text-primary" />
                  <span>Create first territory</span>
                </Button>
              </div>
            ) : (
              filteredTerritories.map((territory) => {
                const isTerritoryExpanded = !!expandedTerritoryIds[territory.id];
                const manager = userList.find((m) => String(m.user_id) === String(territory.manager_user_id));
                const territoryMembers = userList.filter((m) => m.territory_id === territory.id);
                const managerName = manager?.name || (manager?.email ? manager.email.split('@')[0] : 'Unassigned');
                const managerInitials = managerName.substring(0, 2).toUpperCase();

                return (
                  <div key={territory.id} className="space-y-3">
                    {/* Territory Row Card (Matching Screenshot 1 & 2) */}
                    <div
                      className={`group flex items-center justify-between rounded-xl border border-primary/15 bg-primary/5 px-4 py-3.5 transition-all hover:bg-primary/10 hover:shadow-sm ${
                        isTerritoryExpanded ? 'ring-1 ring-primary/20' : ''
                      }`}
                    >
                      {/* Left: Chevron, Icon, Name, Dept */}
                      <div
                        className="flex items-center gap-3 cursor-pointer flex-1"
                        onClick={() => toggleTerritoryExpand(territory.id)}
                      >
                        <button
                          type="button"
                          className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors"
                        >
                          {isTerritoryExpanded ? (
                            <ChevronUp className="h-4 w-4 text-primary" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>

                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
                          <Building2 className="h-4.5 w-4.5" />
                        </div>

                        <div>
                          <h4 className="text-sm font-semibold text-foreground">
                            {territory.name}
                          </h4>
                        </div>
                      </div>

                      {/* Right: Manager Avatar & Name + Hover Edit Button (Matching Screenshot 2) */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-slate-700 to-slate-900 text-white text-xs font-semibold shadow-2xs">
                            {managerInitials || 'NA'}
                          </div>
                          <span className="text-sm font-medium text-foreground">
                            {managerName}
                          </span>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setRegionFormName(territory.name);
                            setRegionFormManagerId(territory.manager_user_id ? String(territory.manager_user_id) : '');
                            setIsRegionModalOpen(true);
                          }}
                          className="h-7 px-2.5 text-xs font-medium border-border opacity-0 group-hover:opacity-100 transition-opacity bg-background hover:bg-accent"
                        >
                          Edit
                        </Button>
                      </div>
                    </div>

                    {/* Expanded: org's departments, then this territory's actual assigned members - no fabricated grouping */}
                    {isTerritoryExpanded && (
                      <div className="space-y-4 pl-4 sm:pl-6">
                        <div className="space-y-2">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
                            Departments
                          </p>
                          {departmentsList.length === 0 ? (
                            <div className="rounded-lg border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
                              No departments created yet. Use 'Add Department' to create one.
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                              {departmentsList.map((dept) => {
                                const head = userList.find((m) => String(m.user_id) === String(dept.head_user_id));
                                const headName = head?.name || (head?.email ? head.email.split('@')[0] : 'Unassigned');

                                return (
                                  <div
                                    key={dept.id}
                                    className="rounded-lg border border-border bg-card p-3 flex items-center gap-2.5"
                                  >
                                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400">
                                      <Building2 className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-sm font-medium text-foreground truncate">{dept.name}</p>
                                      <p className="text-xs text-muted-foreground truncate">Head: {headName}</p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
                            Teams
                          </p>
                          {(() => {
                            const territoryTeams = teamsList.filter((t) => t.territory_id === territory.id);
                            if (territoryTeams.length === 0) {
                              return (
                                <div className="rounded-lg border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
                                  No teams in this territory yet. Use 'Add Team' to create one.
                                </div>
                              );
                            }
                            return (
                              <div className="space-y-3">
                                {territoryTeams.map((team) => {
                                  const isTeamExpanded = !!expandedTeamIds[team.id];
                                  const manager = userList.find((m) => String(m.user_id) === String(team.manager_user_id));
                                  const managerName = manager?.name || (manager?.email ? manager.email.split('@')[0] : 'Unassigned');
                                  const managerInitials = managerName.substring(0, 2).toUpperCase();
                                  const teamMembers = (team.members ?? [])
                                    .map((tm) => userList.find((u) => String(u.user_id) === String(tm.user_id)))
                                    .filter((u): u is PortalUser => !!u);

                                  return (
                                    <div key={team.id} className="space-y-2">
                                      <div
                                        onClick={() => toggleTeamExpand(team.id)}
                                        className="group/team flex items-center justify-between rounded-xl border border-emerald-200/80 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/20 px-4 py-3 cursor-pointer hover:bg-emerald-50/70 dark:hover:bg-emerald-950/40 transition-all shadow-2xs"
                                      >
                                        <div className="flex items-center gap-3">
                                          <button type="button" className="text-emerald-700 dark:text-emerald-400">
                                            {isTeamExpanded ? (
                                              <ChevronDown className="h-4 w-4" />
                                            ) : (
                                              <ChevronRight className="h-4 w-4" />
                                            )}
                                          </button>

                                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-400">
                                            <Users className="h-4 w-4" />
                                          </div>

                                          <div>
                                            <h5 className="text-sm font-semibold text-foreground">{team.name}</h5>
                                            <p className="text-xs text-muted-foreground">
                                              {team.department?.name ? `${team.department.name} · ` : ''}
                                              {teamMembers.length} member{teamMembers.length === 1 ? '' : 's'}
                                            </p>
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-white text-xs font-semibold">
                                            {managerInitials}
                                          </div>
                                          <span className="text-xs font-semibold text-foreground">{managerName}</span>
                                        </div>
                                      </div>

                                      {isTeamExpanded && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 pl-3">
                                          {teamMembers.length === 0 ? (
                                            <div className="col-span-full rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                                              No members in this team yet.
                                            </div>
                                          ) : (
                                            teamMembers.map((member) => {
                                              const memberName = member.name || member.email?.split('@')[0] || 'User';
                                              const memberStatus = (member.status === 'active' || member.status === 'Active') ? 'Active' : 'Inactive';

                                              return (
                                                <div
                                                  key={member.id}
                                                  className="rounded-xl border border-border bg-card p-4 shadow-xs hover:shadow-sm transition-all flex items-start gap-3.5"
                                                >
                                                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-slate-700 text-white font-bold text-xs">
                                                    {memberName.substring(0, 2).toUpperCase()}
                                                  </div>

                                                  <div className="flex-1 min-w-0 space-y-1">
                                                    <h6 className="text-sm font-semibold text-foreground truncate">
                                                      {memberName}
                                                    </h6>
                                                    <p className="text-xs text-muted-foreground truncate">
                                                      {member.role?.role_name || 'Sales Rep'}
                                                    </p>

                                                    <div className="pt-1.5">
                                                      <span
                                                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                                                          memberStatus === 'Active'
                                                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                                            : 'bg-muted text-muted-foreground'
                                                        }`}
                                                      >
                                                        {memberStatus}
                                                      </span>
                                                    </div>
                                                  </div>
                                                </div>
                                              );
                                            })
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })()}
                        </div>

                        <div className="space-y-2">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
                            Members not yet in a team
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                            {territoryMembers.filter((m) => !m.team_id).length === 0 ? (
                              <div className="col-span-full rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                                {territoryMembers.length === 0
                                  ? "No members assigned to this territory yet. Use 'Assign Users' to add members."
                                  : 'Every member in this territory is already in a team.'}
                              </div>
                            ) : (
                              territoryMembers
                                .filter((m) => !m.team_id)
                                .map((member) => {
                                  const memberName = member.name || member.email?.split('@')[0] || 'User';
                                  const memberStatus = (member.status === 'active' || member.status === 'Active') ? 'Active' : 'Inactive';

                                  return (
                                    <div
                                      key={member.id}
                                      className="rounded-xl border border-border bg-card p-4 shadow-xs hover:shadow-sm transition-all flex items-start gap-3.5"
                                    >
                                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-slate-700 text-white font-bold text-xs">
                                        {memberName.substring(0, 2).toUpperCase()}
                                      </div>

                                      <div className="flex-1 min-w-0 space-y-1">
                                        <h6 className="text-sm font-semibold text-foreground truncate">
                                          {memberName}
                                        </h6>
                                        <p className="text-xs text-muted-foreground truncate">
                                          {member.role?.role_name || 'Sales Rep'}
                                        </p>

                                        <div className="pt-1.5">
                                          <span
                                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                                              memberStatus === 'Active'
                                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                                : 'bg-muted text-muted-foreground'
                                            }`}
                                          >
                                            {memberStatus}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODE 2: ASSIGN USERS TO HIERARCHY (Live Table)       */}
      {/* ---------------------------------------------------- */}
      {currentView === 'assign-users' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-6">
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-foreground">
                Assign Users to Hierarchy
              </h2>

              <div className="flex items-center gap-3">
                <div className="relative min-w-[220px] max-w-xs flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-9 pl-9 text-sm bg-background border-border"
                  />
                </div>

                <Button
                  onClick={() => toast.success('Exporting users list...')}
                  className="h-9 gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-4"
                >
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </Button>
              </div>
            </div>

            {/* Table Header Controls */}
            <div className="flex items-center justify-between pt-2">
              <h3 className="text-sm font-semibold text-foreground">
                Users ({filteredUsers.length})
              </h3>

              <div className="flex items-center gap-2.5">
                {isSelectMode && selectedRowIds.length > 0 && (
                  <button
                    onClick={() => {
                      setSelectedRowIds([]);
                      setIsSelectMode(false);
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground font-medium px-2 py-1"
                  >
                    Clear selection
                  </button>
                )}
                <Button
                  onClick={() => {
                    if (!isSelectMode) {
                      setIsSelectMode(true);
                      return;
                    }
                    if (selectedRowIds.length === 0) {
                      toast.info('Please check the checkboxes for the users you want to assign, then click Bulk Assign.');
                      return;
                    }
                    setIsBulkAssignOpen(true);
                  }}
                  className={`h-8 gap-1.5 text-xs font-semibold px-3.5 transition-all ${
                    selectedRowIds.length > 0
                      ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm ring-2 ring-primary/20'
                      : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                  }`}
                >
                  <Users className="h-3.5 w-3.5" />
                  <span>
                    {selectedRowIds.length > 0
                      ? `Bulk Assign (${selectedRowIds.length} selected)`
                      : 'Bulk Assign'}
                  </span>
                </Button>
              </div>
            </div>

            {/* Live Users Data Table */}
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/40 border-b border-border text-xs text-muted-foreground uppercase font-medium">
                  <tr>
                    {isSelectMode && (
                      <th className="px-4 py-3 w-10">
                        <input
                          type="checkbox"
                          checked={userList.length > 0 && selectedRowIds.length === userList.length}
                          onChange={handleToggleSelectAll}
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                          title="Select All Users"
                        />
                      </th>
                    )}
                    <th className="px-4 py-3">User ID</th>
                    <th className="px-4 py-3">Full name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Region / Territory</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {usersLoading ? (
                    <tr>
                      <td colSpan={isSelectMode ? 7 : 6} className="px-4 py-8 text-center text-xs text-muted-foreground">
                        Loading users...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={isSelectMode ? 7 : 6} className="px-4 py-8 text-center text-xs text-muted-foreground">
                        No users found in organization.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => {
                      const isSelected = selectedRowIds.includes(user.id);
                      const displayName = user.name || (user.email ? user.email.split('@')[0] : `User #${user.user_id}`);
                      const userTerritory = territories.find((t) => t.id === user.territory_id);

                      return (
                        <tr
                          key={user.id}
                          className={`transition-colors ${
                            isSelected ? 'bg-primary/10' : 'hover:bg-accent/40'
                          }`}
                        >
                          {isSelectMode && (
                            <td className="px-4 py-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleSelectRow(user.id)}
                                className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                              />
                            </td>
                          )}
                          <td className="px-4 py-3 text-xs font-mono text-muted-foreground">
                            USR_{user.user_id}
                          </td>
                          <td className="px-4 py-3 font-medium text-foreground">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-xs">
                                {displayName.substring(0, 1).toUpperCase()}
                              </div>
                              <span>{displayName}</span>
                              {user.role?.is_admin && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary border border-primary/20">
                                  Admin
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {user.email || '—'}
                          </td>
                          <td className="px-4 py-3 text-xs font-medium text-foreground">
                            {userTerritory?.name ? (
                              <span className="px-2 py-0.5 rounded bg-muted text-foreground">
                                {userTerritory.name}
                              </span>
                            ) : (
                              <span className="text-muted-foreground italic">Unassigned</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                              <div className="h-2 w-2 rounded-full bg-emerald-500" />
                              <span>{user.status || 'Active'}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const userTeam = teamsList.find((t) => t.id === user.team_id);
                                const userManager = userList.find((u) => String(u.user_id) === String(user.manager_id));
                                setSelectedUser(user);
                                setMappingRegion(userTerritory?.name || '');
                                setMappingDept(userTeam?.department?.name || '');
                                setMappingTeam(userTeam?.name || '');
                                setMappingManagerId(userManager ? String(userManager.user_id) : '');
                                setIsMappingEditing(false);
                                setIsHierarchyMappingModalOpen(true);
                              }}
                              className="h-7 px-2.5 text-xs font-medium gap-1.5 border-primary/20 bg-primary/10 text-primary hover:bg-primary/15"
                            >
                              <Edit className="h-3 w-3" />
                              <span>Hierarchy Mapping</span>
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: INDIVIDUAL HIERARCHY MAPPING (Matching Image) */}
      {/* ---------------------------------------------------- */}
      <Dialog open={isHierarchyMappingModalOpen} onOpenChange={setIsHierarchyMappingModalOpen}>
        <DialogContent
          title="Hierarchy Mapping"
          description={`Current organizational placement for ${selectedUser?.name || selectedUser?.email || 'User'}`}
        >
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between pb-1 border-b border-border">
              <span className="text-xs font-semibold text-foreground">Placement Details</span>
              {isMappingEditing ? (
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleSaveUserMapping}
                    disabled={isUpdatingUserTerritory || isUpdatingUserTeam || isUpdatingUserManager}
                    size="sm"
                    className="h-7 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-3"
                  >
                    {isUpdatingUserTerritory || isUpdatingUserTeam || isUpdatingUserManager ? 'Saving...' : 'Save'}
                  </Button>
                  <button
                    onClick={() => setIsMappingEditing(false)}
                    className="text-xs text-muted-foreground hover:text-foreground font-medium px-2"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <Button
                  onClick={() => setIsMappingEditing(true)}
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1.5 text-xs border-primary/20 bg-primary/10 text-primary hover:bg-primary/15 font-medium"
                >
                  <Edit className="h-3 w-3" />
                  <span>Reassign User</span>
                </Button>
              )}
            </div>

            {isMappingEditing ? (() => {
              // Drill-down options, each scoped to the previous pick.
              const deptOptions = mappingRegion
                ? Array.from(
                    new Set(
                      teamsList
                        .filter((t) => t.territory?.name === mappingRegion && t.department?.name)
                        .map((t) => t.department!.name)
                    )
                  )
                : [];
              const teamOptions = mappingRegion && mappingDept
                ? teamsList.filter((t) => t.territory?.name === mappingRegion && t.department?.name === mappingDept)
                : [];
              const selectedTeamForManager = teamOptions.find((t) => t.name === mappingTeam);
              const managerOptions = (selectedTeamForManager?.members ?? [])
                .map((m) => userList.find((u) => String(u.user_id) === String(m.user_id)))
                .filter((u): u is PortalUser => !!u && String(u.user_id) !== String(selectedUser?.user_id));

              return (
                /* Editable Dropdowns - Territory -> Department -> Team -> Manager,
                   each narrowed by the previous pick. */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">1. Territory</label>
                    <select
                      value={mappingRegion}
                      onChange={(e) => {
                        setMappingRegion(e.target.value);
                        setMappingDept('');
                        setMappingTeam('');
                        setMappingManagerId('');
                      }}
                      className="w-full h-8 px-2.5 rounded-md border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="">Select Territory</option>
                      {territories.map((t) => (
                        <option key={t.id} value={t.name}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">2. Department</label>
                    <select
                      value={mappingDept}
                      onChange={(e) => {
                        setMappingDept(e.target.value);
                        setMappingTeam('');
                        setMappingManagerId('');
                      }}
                      disabled={!mappingRegion}
                      className="w-full h-8 px-2.5 rounded-md border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                    >
                      <option value="">{mappingRegion ? 'Select Department' : 'Pick a territory first'}</option>
                      {deptOptions.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>
                    {mappingRegion && deptOptions.length === 0 && (
                      <p className="text-[11px] text-muted-foreground">No teams in this territory yet</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">3. Team</label>
                    <select
                      value={mappingTeam}
                      onChange={(e) => {
                        setMappingTeam(e.target.value);
                        setMappingManagerId('');
                      }}
                      disabled={!mappingDept}
                      className="w-full h-8 px-2.5 rounded-md border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                    >
                      <option value="">{mappingDept ? 'No team' : 'Pick a department first'}</option>
                      {teamOptions.map((t) => (
                        <option key={t.id} value={t.name}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">4. Manager (Reports To)</label>
                    <select
                      value={mappingManagerId}
                      onChange={(e) => setMappingManagerId(e.target.value)}
                      disabled={!mappingTeam}
                      className="w-full h-8 px-2.5 rounded-md border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                    >
                      <option value="">No manager</option>
                      {managerOptions.map((u) => (
                        <option key={u.id} value={u.user_id}>
                          {u.name || u.email} ({u.role?.role_name || 'Member'})
                        </option>
                      ))}
                    </select>
                    {mappingTeam && managerOptions.length === 0 && (
                      <p className="text-[11px] text-muted-foreground">No other members in this team yet</p>
                    )}
                  </div>
                </div>
              );
            })() : (
              /* Read-Only Display Cards */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Territory</label>
                  <div className="h-9 px-3 rounded-lg border border-border bg-muted/30 flex items-center text-xs font-medium text-foreground">
                    {territories.find((t) => t.id === selectedUser?.territory_id)?.name || 'Unassigned'}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Department</label>
                  <div className="h-9 px-3 rounded-lg border border-border bg-muted/30 flex items-center text-xs font-medium text-foreground">
                    {teamsList.find((t) => t.id === selectedUser?.team_id)?.department?.name || 'Unassigned'}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Team</label>
                  <div className="h-9 px-3 rounded-lg border border-border bg-muted/30 flex items-center text-xs font-medium text-foreground">
                    {teamsList.find((t) => t.id === selectedUser?.team_id)?.name || 'No team'}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Manager (Reports To)</label>
                  <div className="h-9 px-3 rounded-lg border border-border bg-muted/30 flex items-center text-xs font-medium text-foreground">
                    {(() => {
                      const manager = userList.find((u) => String(u.user_id) === String(selectedUser?.manager_id));
                      return manager?.name || manager?.email || 'No manager';
                    })()}
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsHierarchyMappingModalOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------------------------------------------------- */}
      {/* MODE 3: OVERVIEW / TREE VIEW (100% Dynamic Live Data) */}
      {/* ---------------------------------------------------- */}
      {currentView === 'overview' && (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-6">
          {/* Tree View Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Tree View
              </h2>
              <p className="text-xs text-muted-foreground">
                Territory → Department → Team → Member, built from your actual data
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={() => {
                  if (territories.length === 0) {
                    toast.info('Nothing to export yet — add territories, teams, and members first.');
                    return;
                  }
                  const adminName = workspaceAdmin?.name || workspaceAdmin?.email || org?.name || 'Workspace';
                  const html = buildHierarchyTreeHtml(territories, teamsList, userList, adminName, org?.name || 'Workspace');
                  downloadHierarchyHtml(html);
                  toast.success('Tree structure exported successfully');
                }}
                className="h-9 gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-4 shadow-sm"
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
              </Button>
            </div>
          </div>

          {/* Canvas Viewport */}
          {territories.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border py-16 text-center space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mx-auto">
                <Layers className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold text-foreground">No Territories Yet</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Create a territory, add teams under it, and assign members to visualize your live organizational tree.
              </p>
              <Button
                onClick={() => setCurrentView('structure')}
                className="h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Go to Structure
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto thin-scrollbar rounded-2xl border border-border/80 bg-slate-50/60 dark:bg-slate-950/60 p-8">
              <TreeLegend />
              <div className="org-chart">
                <ul>
                  {/* Root: whoever holds the org's admin role */}
                  <li>
                    <TreeCard
                      tier="admin"
                      initials={(workspaceAdmin?.name || org?.name || 'WA').substring(0, 2).toUpperCase()}
                      title={workspaceAdmin?.name || workspaceAdmin?.email || org?.name || 'Workspace'}
                      subtitle="Workspace Admin"
                    />

                    <ul>
                      {territories.map((territory) => {
                    const territoryTeams = teamsList.filter((t) => t.territory_id === territory.id);
                    const departmentGroups = new Map<number, { department: typeof territoryTeams[number]['department']; teams: typeof territoryTeams }>();
                    territoryTeams.forEach((t) => {
                      const key = t.department_id;
                      if (!departmentGroups.has(key)) {
                        departmentGroups.set(key, { department: t.department, teams: [] });
                      }
                      departmentGroups.get(key)!.teams.push(t);
                    });
                    const deptEntries = [...departmentGroups.entries()];

                    return (
                      <li key={territory.id}>
                        <TreeCard
                          tier="territory"
                          initials={territory.name.substring(0, 2).toUpperCase()}
                          title={territory.name}
                          subtitle={`${departmentGroups.size} department${departmentGroups.size === 1 ? '' : 's'}`}
                        />

                        {deptEntries.length > 0 && (
                          <ul>
                            {deptEntries.map(([deptId, group]) => {
                              const deptName = group.department?.name || 'Department';
                              return (
                                <li key={deptId}>
                                  <TreeCard
                                    tier="department"
                                    initials={deptName.substring(0, 2).toUpperCase()}
                                    title={deptName}
                                    subtitle={`${group.teams.length} team${group.teams.length === 1 ? '' : 's'}`}
                                  />

                                  <ul>
                                    {group.teams.map((team) => {
                                      const teamMembers = (team.members ?? [])
                                        .map((tm) => userList.find((u) => String(u.user_id) === String(tm.user_id)))
                                        .filter((u): u is PortalUser => !!u);

                                      return (
                                        <li key={team.id}>
                                          <TreeCard
                                            tier="team"
                                            initials={team.name.substring(0, 2).toUpperCase()}
                                            title={team.name}
                                            subtitle={`${teamMembers.length} member${teamMembers.length === 1 ? '' : 's'}`}
                                          />

                                          {teamMembers.length > 0 && (() => {
                                            // Roots: members who don't report to anyone else on this same team.
                                            const memberIds = new Set(teamMembers.map((m) => String(m.user_id)));
                                            const roots = teamMembers.filter(
                                              (m) => !m.manager_id || !memberIds.has(String(m.manager_id))
                                            );
                                            return (
                                              <ul>
                                                {roots.map((root) => (
                                                  <MemberTreeNode
                                                    key={root.id}
                                                    member={root}
                                                    allMembers={teamMembers}
                                                    visited={new Set()}
                                                  />
                                                ))}
                                              </ul>
                                            );
                                          })()}
                                        </li>
                                      );
                                    })}
                                  </ul>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </li>
                        );
                      })}
                    </ul>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL 1: ADD NEW DEPARTMENT (Matching Image 2)       */}
      {/* ---------------------------------------------------- */}
      <Dialog open={isDepartmentModalOpen} onOpenChange={setIsDepartmentModalOpen}>
        <DialogContent
          title="Add New Department"
          description="Create a new department in your organization"
        >
          <form onSubmit={handleCreateDepartment} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Department Name <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="e.g., Sales, Marketing, Engineering"
                value={deptFormName}
                onChange={(e) => setDeptFormName(e.target.value)}
                className="bg-background border-border"
              />
              <p className="text-[11px] text-muted-foreground">
                Enter a clear, descriptive name for the department
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Description
              </label>
              <textarea
                placeholder="Describe the department's purpose and responsibilities"
                value={deptFormDescription}
                onChange={(e) => setDeptFormDescription(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <p className="text-[11px] text-muted-foreground">
                Provide details about what this department does
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Assign Department Head <span className="text-destructive">*</span>
              </label>

              {deptFormHead ? (
                <div className="rounded-lg border border-primary/15 bg-primary/10 p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-700 text-white text-xs font-bold">
                      {deptFormHead.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{deptFormHead.name}</p>
                      <p className="text-xs text-muted-foreground">{deptFormHead.role}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setDeptFormHead(null)}
                    className="text-xs text-muted-foreground hover:text-foreground font-medium"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <select
                  onChange={(e) => {
                    const val = e.target.value;
                    const foundUser = userList.find((u) => (u.name || u.email) === val);
                    if (foundUser) {
                      setDeptFormHead({
                        id: foundUser.user_id,
                        name: foundUser.name || foundUser.email || 'User',
                        role: foundUser.role?.role_name || 'Department Head',
                      });
                    } else if (val) {
                      setDeptFormHead({ name: val, role: 'Department Head' });
                    }
                  }}
                  className="w-full h-9 px-3 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Select a Department head</option>
                  {userList.map((u) => (
                    <option key={u.id} value={u.name || u.email || String(u.user_id)}>
                      {u.name || u.email} ({u.role?.role_name || 'Member'})
                    </option>
                  ))}
                </select>
              )}

              <p className="text-[11px] text-muted-foreground">
                Choose who will lead this department
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDepartmentModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Create Department
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ---------------------------------------------------- */}
      {/* MODAL 2: ADD / EDIT TEAM (Matching Image 3)          */}
      {/* ---------------------------------------------------- */}
      <CreateTeamModal open={isTeamModalOpen} onOpenChange={setIsTeamModalOpen} />

      {/* ---------------------------------------------------- */}
      {/* MODAL 3: ADD REGION / TERRITORY                      */}
      {/* ---------------------------------------------------- */}
      <Dialog open={isRegionModalOpen} onOpenChange={setIsRegionModalOpen}>
        <DialogContent
          title="Add New Territory / Region"
          description="Create a new geographical territory or region"
        >
          <form onSubmit={handleCreateRegion} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Territory / Region Name <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="e.g., Delhi, Gurgaon, West Gurgaon, MP"
                value={regionFormName}
                onChange={(e) => setRegionFormName(e.target.value)}
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Assign Territory Lead / Manager</label>
              <select
                value={regionFormManagerId}
                onChange={(e) => setRegionFormManagerId(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-border bg-background text-sm text-foreground"
              >
                <option value="">Select Manager</option>
                {managerUsers.map((u) => (
                  <option key={u.id} value={u.user_id}>
                    {u.name || u.email} ({u.role?.role_name || 'Member'})
                  </option>
                ))}
              </select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsRegionModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Create Territory
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ---------------------------------------------------- */}
      {/* MODAL 4: BULK ASSIGN USERS                           */}
      {/* ---------------------------------------------------- */}
      <Dialog open={isBulkAssignOpen} onOpenChange={setIsBulkAssignOpen}>
        <DialogContent
          title="Bulk Assign Users"
          description={`Assign ${selectedRowIds.length} selected users to hierarchy`}
        >
          <div className="space-y-4 py-2">
            <div className="rounded-lg border border-blue-100 bg-blue-50/70 dark:bg-blue-950/40 p-3 text-xs text-blue-800 dark:text-blue-200">
              Select the fields you want to update. Leave fields empty to keep existing values.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Territory / Region</label>
                <select
                  value={bulkRegion}
                  onChange={(e) => {
                    // Team is scoped to its own territory - changing the
                    // territory invalidates whatever team was picked.
                    setBulkRegion(e.target.value);
                    setBulkTeam('');
                  }}
                  className="w-full h-8 px-2.5 rounded-md border border-border bg-background text-xs text-foreground"
                >
                  <option value="">Select Territory</option>
                  {territories.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Team</label>
                <select
                  value={bulkTeam}
                  onChange={(e) => setBulkTeam(e.target.value)}
                  disabled={!bulkRegion}
                  className="w-full h-8 px-2.5 rounded-md border border-border bg-background text-xs text-foreground disabled:opacity-50"
                >
                  <option value="">Select Team</option>
                  {teamsList
                    .filter((t) => t.territory?.name === bulkRegion)
                    .map((t) => (
                      <option key={t.id} value={t.name}>
                        {t.name}
                      </option>
                    ))}
                </select>
                {!bulkRegion && (
                  <p className="text-[11px] text-muted-foreground">Pick a territory first</p>
                )}
              </div>
            </div>

            {/* Selected Users List */}
            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-semibold text-foreground">Selected Users ({selectedRowIds.length}):</label>
              <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-1 max-h-32 overflow-y-auto text-xs text-muted-foreground">
                {selectedRowIds.map((id) => {
                  const u = userList.find((usr) => usr.id === id);
                  return (
                    <p key={id}>
                      {u?.name || u?.email || `User #${id}`} — {u?.role?.role_name || 'Member'}
                    </p>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkAssignOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleApplyBulkChanges} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              Apply Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title={`Delete "${pendingDelete?.name}"?`}
        description="This cannot be undone. A territory assigned to members cannot be deleted."
        confirmLabel="Delete"
        isLoading={isDeleting}
        onConfirm={handleDeleteTerritory}
      />
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useProjectStore } from "@/lib/store/projectStore";
import { projectAPI, teamsAPI } from "@/lib/api";
import { UserAvatar } from "@/components/shared/UserAvatar";
import {
  Users, UserPlus, Search, ArrowRight, FolderKanban,
  Crown, Shield, Eye, Loader2, Mail, ChevronDown, ChevronUp
} from "lucide-react";
import toast from "react-hot-toast";
import { MemberProfileDrawer } from "@/components/team/MemberProfileDrawer";

const ROLE_COLORS: Record<string, string> = {
  admin:  "text-yellow-500 bg-yellow-500/10 border-yellow-500/20",
  member: "text-blue-500 bg-blue-500/10 border-blue-500/20",
  viewer: "text-gray-400 bg-gray-500/10 border-gray-500/20",
};
const ROLE_ICONS: Record<string, React.ElementType> = {
  admin: Crown, member: Shield, viewer: Eye,
};

export default function GlobalTeamPage() {
  const { projects, fetchProjects } = useProjectStore();
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [isInviting, setIsInviting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [selectedMemberForProfile, setSelectedMemberForProfile] = useState<any | null>(null);
  const [profileProjectId, setProfileProjectId] = useState<string | undefined>(undefined);
  const [profileProjectName, setProfileProjectName] = useState<string | undefined>(undefined);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0]._id);
      setExpandedProjects(new Set(projects.map((p) => p._id)));
    }
  }, [projects, selectedProjectId]);

  const toggleProjectExpand = (projectId: string) => {
    setExpandedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) { setSearchResults([]); return; }
    setIsSearching(true);
    try {
      const res = await teamsAPI.search(query);
      setSearchResults(res.data || []);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) { toast.error("Select a project"); return; }
    if (!email) { toast.error("Enter an email"); return; }
    setIsInviting(true);
    try {
      await projectAPI.invite(selectedProjectId, { email, role });
      toast.success("Invitation sent successfully");
      setEmail("");
      setSearchQuery("");
      setSearchResults([]);
      fetchProjects();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to send invite");
    } finally {
      setIsInviting(false);
    }
  };

  if (projects.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-24 border border-dashed border-border rounded-2xl">
          <Users className="w-14 h-14 text-muted-foreground mx-auto mb-4 opacity-30" />
          <h2 className="text-lg font-bold mb-2">No projects yet</h2>
          <p className="text-sm text-muted-foreground mb-6">Create a project before inviting teammates</p>
          <Link
            href="/dashboard/projects/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-all"
          >
            <FolderKanban className="w-4 h-4" /> Create Project
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">Team Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage members and invite collaborators across all projects</p>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
        <h2 className="font-bold text-foreground flex items-center gap-2 text-base">
          <UserPlus className="w-4 h-4 text-primary" /> Invite to Project
        </h2>

        <form onSubmit={handleInvite} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="sm:w-64">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Target Project</label>
              <div className="relative">
                <FolderKanban className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {projects.map((p) => (
                    <option key={p._id} value={p._id}>{p.name} ({p.key})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex-1 relative">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">User Email or Name</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); handleSearch(e.target.value); }}
                  placeholder="name@company.com"
                  required
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {(searchResults.length > 0 || isSearching) && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-xl z-20 overflow-hidden">
                  {isSearching ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    </div>
                  ) : searchResults.map((u) => (
                    <button
                      key={u._id} type="button"
                      onClick={() => { setEmail(u.email); setSearchResults([]); setSearchQuery(""); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted transition-colors text-left"
                    >
                      <UserAvatar src={u.avatar} name={u.name} size="sm" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{u.name}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="w-32">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="admin">Admin</option>
                <option value="member">Member</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={isInviting}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-all disabled:opacity-60 whitespace-nowrap"
              >
                {isInviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><UserPlus className="w-4 h-4" /> Invite</>}
              </button>
            </div>
          </div>
        </form>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        className="space-y-3">
        <h2 className="font-bold text-foreground flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" /> Project Members
        </h2>

        {projects.map((project) => {
          const isExpanded = expandedProjects.has(project._id);
          const members = project.members || [];

          return (
            <div key={project._id} className="rounded-2xl border border-border bg-card overflow-hidden">
              <button
                onClick={() => toggleProjectExpand(project._id)}
                className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-muted/40 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ backgroundColor: project.color }}>
                  {project.key.charAt(0)}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-foreground">{project.name}</p>
                  <p className="text-xs text-muted-foreground">{members.length} member{members.length !== 1 ? "s" : ""}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/dashboard/projects/${project._id}/team`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    Manage <ArrowRight className="w-3 h-3" />
                  </Link>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-border divide-y divide-border">
                  {members.length === 0 ? (
                    <p className="px-5 py-4 text-sm text-muted-foreground">No members yet.</p>
                  ) : members.map((member: any) => {
                    const user = member.user || member;
                    const roleName = (member.role || "member").toLowerCase();
                    const RoleIcon = ROLE_ICONS[roleName] || Shield;
                    return (
                      <div
                        key={user?._id || Math.random()}
                        onClick={() => {
                          setSelectedMemberForProfile(member);
                          setProfileProjectId(project._id);
                          setProfileProjectName(project.name);
                        }}
                        className="flex items-center gap-3 px-5 py-3 hover:bg-muted/40 transition-colors cursor-pointer group"
                      >
                        <UserAvatar
                          src={user?.avatar}
                          name={user?.name || "Member"}
                          size="md"
                          ringClassName="group-hover:ring-2 group-hover:ring-primary/40 transition-all"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                            {user?.name || "Unknown"}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                        </div>
                        <span className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full border capitalize ${ROLE_COLORS[roleName] || ROLE_COLORS.member}`}>
                          <RoleIcon className="w-3 h-3" /> {member.role || "member"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </motion.div>

      {/* ── Member Profile Drawer ── */}
      <MemberProfileDrawer
        isOpen={Boolean(selectedMemberForProfile)}
        onClose={() => setSelectedMemberForProfile(null)}
        userId={
          selectedMemberForProfile?.user?._id ||
          (typeof selectedMemberForProfile?.user === "string"
            ? selectedMemberForProfile.user
            : selectedMemberForProfile?._id || null)
        }
        initialMemberData={selectedMemberForProfile}
        projectId={profileProjectId}
        projectName={profileProjectName}
      />
    </div>
  );
}

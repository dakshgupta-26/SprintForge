"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useProjectStore } from "@/lib/store/projectStore";
import { projectAPI, teamsAPI } from "@/lib/api";
import { generateAvatar } from "@/lib/utils";
import {
  Users, UserPlus, Search, ArrowRight, FolderKanban,
  Crown, Shield, Eye, Loader2, Mail, ChevronDown, ChevronUp
} from "lucide-react";
import toast from "react-hot-toast";

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

  useEffect(() => {
    fetchProjects();
  }, []);

  // Default-select first project
  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0]._id);
      setExpandedProjects(new Set([projects[0]._id]));
    }
  }, [projects]);

  // Live user search debounced
  useEffect(() => {
    if (searchQuery.length < 2) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const { data } = await teamsAPI.search(searchQuery);
        setSearchResults(data);
      } catch {} finally { setIsSearching(false); }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return toast.error("Please enter an email address");
    if (!selectedProjectId) return toast.error("Please select a project first");
    setIsInviting(true);
    try {
      await projectAPI.invite(selectedProjectId, { email, role });
      toast.success(`Invitation sent to ${email}!`);
      setEmail("");
      setSearchQuery("");
      setSearchResults([]);
      fetchProjects();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to send invitation");
    } finally { setIsInviting(false); }
  };

  const toggleProjectExpand = (id: string) => {
    setExpandedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  /* ─── No-project empty state ─── */
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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground">Team</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage members and invite collaborators across your projects
        </p>
      </motion.div>

      {/* ── Invite Section ── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="p-5 rounded-2xl border border-border bg-card">
        <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-primary" /> Invite Team Member
        </h2>

        <form onSubmit={handleInvite} className="space-y-3">
          {/* Project picker */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Invite to project</label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {projects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} ({p.key})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end gap-3">
            {/* Email field with search overlay */}
            <div className="flex-1 relative">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Email address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setSearchQuery(e.target.value); }}
                  placeholder="colleague@company.com"
                  required
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {/* Search autocomplete dropdown */}
              {(searchResults.length > 0 || isSearching) && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-xl z-20 overflow-hidden">
                  {isSearching ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    </div>
                  ) : searchResults.map((user) => (
                    <button
                      key={user._id} type="button"
                      onClick={() => { setEmail(user.email); setSearchResults([]); setSearchQuery(""); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted transition-colors text-left"
                    >
                      <img src={user.avatar || generateAvatar(user.name)} alt={user.name} className="w-7 h-7 rounded-full object-cover" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Role */}
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

            {/* Submit */}
            <button
              type="submit"
              disabled={isInviting}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-all disabled:opacity-60 active:scale-95 whitespace-nowrap"
            >
              {isInviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><UserPlus className="w-4 h-4" /> Send Invite</>}
            </button>
          </div>
        </form>
      </motion.div>

      {/* ── Members per project ── */}
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
              {/* Project header */}
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

              {/* Members list */}
              {isExpanded && (
                <div className="border-t border-border divide-y divide-border">
                  {members.length === 0 ? (
                    <p className="px-5 py-4 text-sm text-muted-foreground">No members yet.</p>
                  ) : members.map((member: any) => {
                    const user = member.user || member;
                    const roleName = (member.role || "member").toLowerCase();
                    const RoleIcon = ROLE_ICONS[roleName] || Shield;
                    return (
                      <div key={user?._id || Math.random()} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors">
                        <img
                          src={user?.avatar || generateAvatar(user?.name || "?")}
                          alt={user?.name}
                          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{user?.name || "Unknown"}</p>
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
    </div>
  );
}

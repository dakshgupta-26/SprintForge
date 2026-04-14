"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useProjectStore } from "@/lib/store/projectStore";
import { projectAPI, teamsAPI } from "@/lib/api";
import { motion } from "framer-motion";
import {
  UserPlus, Trash2, Crown, Shield, Eye, Users, Loader2,
  Search, Mail, Copy, RefreshCw, Link2, CheckCircle2, LogIn,
} from "lucide-react";
import { generateAvatar, formatDate } from "@/lib/utils";
import toast from "react-hot-toast";

const ROLE_ICONS = { admin: Crown, member: Shield, viewer: Eye } as const;
const ROLE_COLORS = {
  admin: "text-yellow-500 bg-yellow-500/10",
  member: "text-blue-500 bg-blue-500/10",
  viewer: "text-gray-500 bg-gray-500/10",
} as const;

export default function TeamPage() {
  const { id } = useParams<{ id: string }>();
  // Layout already loaded currentProject — we just refresh after mutations
  const { currentProject, fetchProject } = useProjectStore();

  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [isInviting, setIsInviting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);
  const [codeCopied, setCodeCopied] = useState(false);

  // Role editor
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [editedRole, setEditedRole] = useState("");
  const [editedPermissions, setEditedPermissions] = useState<string[]>([]);

  // Join-code states
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [joinInput, setJoinInput] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  // Only fetch invites (not project — layout already did that)
  const refreshInvites = useCallback(async () => {
    try {
      const res = await projectAPI.getPendingInvites(id);
      setPendingInvites(res.data);
    } catch {}
  }, [id]);

  useEffect(() => {
    refreshInvites();
  }, [refreshInvites]);

  // User search debounce
  useEffect(() => {
    if (searchQuery.trim().length < 2) { 
      setSearchResults([]); 
      setIsSearching(false);
      return; 
    }
    const timeout = setTimeout(async () => {
      setIsSearching(true);
      try {
        const { data } = await teamsAPI.search(searchQuery.trim());
        setSearchResults(data || []);
      } catch {
        setSearchResults([]);
      } finally { 
        setIsSearching(false); 
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  /* ── Actions ── */

  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsInviting(true);
    try {
      await projectAPI.invite(id, { email, role });
      toast.success(`Invitation sent to ${email}!`);
      setEmail("");
      fetchProject(id);
      refreshInvites();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to invite member");
    } finally { setIsInviting(false); }
  };

  const removeMember = async (userId: string, name: string) => {
    if (!confirm(`Remove ${name} from the project?`)) return;
    try {
      await projectAPI.removeMember(id, userId);
      toast.success("Member removed");
      fetchProject(id);
    } catch { toast.error("Failed to remove member"); }
  };

  const handleGenerateCode = async () => {
    setIsGeneratingCode(true);
    try {
      await projectAPI.generateJoinCode(id);
      toast.success("Join code generated!");
      fetchProject(id);           // Refresh so joinCode appears in UI
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to generate code");
    } finally { setIsGeneratingCode(false); }
  };

  const handleDisableCode = async () => {
    if (!confirm("Disable the join code? Existing users who haven't joined yet won't be able to use it.")) return;
    try {
      await projectAPI.disableJoinCode(id);
      toast.success("Join code disabled");
      fetchProject(id);
    } catch { toast.error("Failed to disable code"); }
  };

  const copyCode = () => {
    if (!currentProject?.joinCode) return;
    navigator.clipboard.writeText(currentProject.joinCode);
    setCodeCopied(true);
    toast.success("Code copied to clipboard!");
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleJoinWithCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinInput.trim()) return;
    setIsJoining(true);
    try {
      await projectAPI.joinWithCode(joinInput.trim().toUpperCase());
      toast.success("Successfully joined the project!");
      setJoinInput("");
      fetchProject(id);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Invalid or expired code");
    } finally { setIsJoining(false); }
  };

  const saveRoleUpdate = async (userId: string) => {
    try {
      await projectAPI.updateMemberRole(id, userId, { role: editedRole, permissions: editedPermissions });
      toast.success("Member role updated");
      setEditingMember(null);
      fetchProject(id);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update role");
    }
  };

  const members = currentProject?.members || [];
  const filteredResults = searchResults.filter(
    (u) => !members.some((m: any) => m.user._id === u._id)
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold">Team</h1>
        <p className="text-sm text-muted-foreground">
          {currentProject?.name} • {members.length} members
        </p>
      </motion.div>

      {/* ── Invite Form ── */}
      <div className="p-5 rounded-2xl border border-border bg-card">
        <h2 className="font-bold mb-4 flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-primary" /> Invite Team Member
        </h2>
        <form onSubmit={invite} className="flex items-end gap-3">
          <div className="flex-1 relative">
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Email address</label>
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@company.com" required
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="w-36">
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="admin">Admin</option>
              <option value="member">Member</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          <button type="submit" disabled={isInviting}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-all disabled:opacity-60">
            {isInviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><UserPlus className="w-4 h-4" /> Invite</>}
          </button>
        </form>

        {/* User search */}
        <div className="mt-4 relative">
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Or search existing users</label>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by name or email…"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          
          {(searchQuery.trim().length >= 2 || isSearching) && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-xl z-20 overflow-hidden max-h-60 overflow-y-auto">
              {isSearching ? (
                <div className="flex items-center justify-center gap-2 p-4 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" /> Searching...
                </div>
              ) : filteredResults.length > 0 ? (
                filteredResults.map((user) => (
                  <button key={user._id} type="button" onClick={() => { setEmail(user.email); setSearchResults([]); setSearchQuery(""); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted transition-colors text-left border-b border-border last:border-0">
                    <img src={user.avatar || generateAvatar(user.name)} alt={user.name} className="w-7 h-7 rounded-full" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No users found
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Project Join Code Panel ── */}
      <div className="p-5 rounded-2xl border border-primary/20 bg-primary/5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold flex items-center gap-2 text-primary">
              <Link2 className="w-4 h-4" /> Project Join Code
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {currentProject?.joinCodeEnabled
                ? "Anyone with this code can instantly join the project."
                : "Generate a code to let users join instantly without an email invite."}
            </p>
          </div>

          {/* Code display or Generate button */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {currentProject?.joinCodeEnabled && currentProject?.joinCode ? (
              <>
                <div className="px-4 py-2 bg-background border-2 border-primary/30 rounded-xl font-mono font-bold tracking-widest text-xl text-primary select-all">
                  {currentProject.joinCode}
                </div>
                <button
                  id="copy-join-code-btn"
                  onClick={copyCode}
                  title="Copy code"
                  className="p-2 rounded-xl border border-border bg-background hover:bg-muted transition-colors"
                >
                  {codeCopied
                    ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                    : <Copy className="w-4 h-4 text-muted-foreground" />}
                </button>
                <button
                  id="regenerate-join-code-btn"
                  onClick={handleGenerateCode}
                  disabled={isGeneratingCode}
                  title="Regenerate code"
                  className="p-2 rounded-xl border border-border bg-background hover:bg-muted transition-colors disabled:opacity-60"
                >
                  <RefreshCw className={`w-4 h-4 text-muted-foreground ${isGeneratingCode ? "animate-spin" : ""}`} />
                </button>
                <button
                  id="disable-join-code-btn"
                  onClick={handleDisableCode}
                  className="text-xs text-red-500 hover:underline px-1"
                >
                  Disable
                </button>
              </>
            ) : (
              <button
                id="generate-join-code-btn"
                onClick={handleGenerateCode}
                disabled={isGeneratingCode}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-all disabled:opacity-60"
              >
                {isGeneratingCode
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <><RefreshCw className="w-4 h-4" /> Generate Code</>}
              </button>
            )}
          </div>
        </div>

        {/* ── Join with Code input ── */}
        <div className="border-t border-primary/20 pt-4">
          <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
            <LogIn className="w-3.5 h-3.5" /> Have a code? Join another project instantly:
          </p>
          <form onSubmit={handleJoinWithCode} className="flex gap-2">
            <input
              id="join-with-code-input"
              value={joinInput}
              onChange={(e) => setJoinInput(e.target.value.toUpperCase())}
              placeholder="Enter 6-character code…"
              maxLength={8}
              className="flex-1 px-3.5 py-2 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground text-sm font-mono tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button
              id="submit-join-code-btn"
              type="submit"
              disabled={isJoining || joinInput.length < 4}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-all disabled:opacity-60"
            >
              {isJoining ? <Loader2 className="w-4 h-4 animate-spin" /> : <><LogIn className="w-4 h-4" /> Join</>}
            </button>
          </form>
        </div>
      </div>

      {/* ── Members List ── */}
      <div className="p-5 rounded-2xl border border-border bg-card">
        <h2 className="font-bold mb-4 flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" /> Project Members
        </h2>
        <div className="space-y-3">
          {members.map((member: any) => {
            const user = member.user;
            const isEditing = editingMember === user._id;
            const RoleIcon = ROLE_ICONS[member.role.toLowerCase() as keyof typeof ROLE_ICONS] || Shield;

            return (
              <div key={user?._id || Math.random()} className="flex flex-col gap-3 p-4 rounded-xl border border-border bg-background">
                <div className="flex items-center gap-3">
                  <img src={user?.avatar || generateAvatar(user?.name || "U")} alt={user?.name} className="w-9 h-9 rounded-full object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{user?.name}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>

                  {!isEditing ? (
                    <>
                      <span className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full capitalize ${ROLE_COLORS[member.role.toLowerCase() as keyof typeof ROLE_COLORS] || "bg-muted text-muted-foreground"}`}>
                        <RoleIcon className="w-3 h-3" /> {member.role}
                      </span>
                      {member.role !== "admin" && (
                        <button onClick={() => {
                          setEditingMember(user._id);
                          setEditedRole(member.role);
                          setEditedPermissions(member.permissions || []);
                        }} className="text-xs text-primary hover:underline mx-2">
                          Manage Roles
                        </button>
                      )}
                      {member.role !== "admin" && (
                        <button onClick={() => removeMember(user._id, user.name)}
                          className="p-1.5 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 rounded-lg transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type="text" value={editedRole}
                        onChange={(e) => setEditedRole(e.target.value)}
                        placeholder="Role name…"
                        className="px-2 py-1 border border-border rounded text-sm w-32"
                      />
                      <button onClick={() => saveRoleUpdate(user._id)} className="text-xs bg-primary text-white px-3 py-1 rounded">Save</button>
                      <button onClick={() => setEditingMember(null)} className="text-xs text-muted-foreground hover:underline">Cancel</button>
                    </div>
                  )}
                </div>

                {/* Permissions */}
                {(isEditing || member.permissions?.length > 0) && (
                  <div className="ml-12 flex gap-2 flex-wrap">
                    {(["view", "create", "edit", "delete", "manage"] as const).map((p) => {
                      const hasP = isEditing ? editedPermissions.includes(p) : member.permissions?.includes(p);
                      return (
                        <div
                          key={p}
                          onClick={() => {
                            if (!isEditing) return;
                            setEditedPermissions((prev) =>
                              prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
                            );
                          }}
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border transition-all ${hasP
                            ? "bg-green-500/10 border-green-500/20 text-green-600"
                            : "bg-muted border-border text-muted-foreground opacity-50"
                            } ${isEditing ? "cursor-pointer hover:opacity-100" : ""}`}
                        >
                          {p}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Pending Invites ── */}
      {pendingInvites.length > 0 && (
        <div className="p-5 rounded-2xl border border-dashed border-border bg-card/50">
          <h2 className="font-bold mb-4 flex items-center gap-2 text-muted-foreground">
            <Mail className="w-4 h-4" /> Pending Invites
          </h2>
          <div className="space-y-2">
            {pendingInvites.map((invite) => (
              <div key={invite._id} className="flex items-center gap-3 p-3 rounded-xl bg-background border border-border">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {invite.email.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{invite.email}</p>
                  <p className="text-xs text-muted-foreground">Expires {formatDate(invite.expiresAt, "short")}</p>
                </div>
                <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-muted text-muted-foreground uppercase">Pending</span>
                <span className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full capitalize ${ROLE_COLORS[invite.role as keyof typeof ROLE_COLORS] || ""}`}>
                  {invite.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

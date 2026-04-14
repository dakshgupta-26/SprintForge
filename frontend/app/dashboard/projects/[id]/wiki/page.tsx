"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { wikiAPI } from "@/lib/api";
import { useProjectStore } from "@/lib/store/projectStore";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { Plus, BookOpen, Edit3, Trash2, Save, X, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import toast from "react-hot-toast";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });
const MDPreview = dynamic(() => import("@uiw/react-md-editor").then((m) => m.default.Markdown), { ssr: false });

export default function WikiPage() {
  const { id } = useParams<{ id: string }>();
  const { fetchProject, currentProject } = useProjectStore();
  const [pages, setPages] = useState<any[]>([]);
  const [selectedPage, setSelectedPage] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [newTitle, setNewTitle] = useState("");

  useEffect(() => { fetchProject(id); loadPages(); }, [id]);

  const loadPages = async () => {
    try {
      const { data } = await wikiAPI.getAll(id);
      setPages(data);
      if (data.length > 0 && !selectedPage) setSelectedPage(data[0]);
    } catch { } finally { setIsLoading(false); }
  };

  const createPage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await wikiAPI.create({ title: newTitle, content: `# ${newTitle}\n\nStart writing here...`, project: id });
      setPages((prev) => [data, ...prev]);
      setSelectedPage(data);
      setNewTitle("");
      setShowCreate(false);
      toast.success("Wiki page created!");
    } catch { toast.error("Failed to create page"); }
  };

  const startEdit = () => {
    setEditTitle(selectedPage.title);
    setEditContent(selectedPage.content);
    setIsEditing(true);
  };

  const savePage = async () => {
    setIsSaving(true);
    try {
      const { data } = await wikiAPI.update(selectedPage._id, { title: editTitle, content: editContent });
      setSelectedPage(data);
      setPages((prev) => prev.map((p) => (p._id === data._id ? data : p)));
      setIsEditing(false);
      toast.success("Page saved!");
    } catch { toast.error("Failed to save"); } finally { setIsSaving(false); }
  };

  const deletePage = async (pageId: string) => {
    if (!confirm("Delete this wiki page?")) return;
    try {
      await wikiAPI.delete(pageId);
      setPages((prev) => prev.filter((p) => p._id !== pageId));
      setSelectedPage(pages.find((p) => p._id !== pageId) || null);
      toast.success("Page deleted");
    } catch { toast.error("Failed to delete"); }
  };

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-120px)] flex gap-4">
      {/* Sidebar */}
      <div className="w-56 flex-shrink-0 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold">Wiki</h2>
          <button onClick={() => setShowCreate(!showCreate)}
            className="p-1.5 hover:bg-muted rounded-lg transition-colors">
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <AnimatePresence>
          {showCreate && (
            <motion.form initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              onSubmit={createPage} className="space-y-2">
              <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Page title" required
                className="w-full px-3 py-2 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <div className="flex gap-1.5">
                <button type="button" onClick={() => setShowCreate(false)}
                  className="flex-1 py-1.5 border border-border rounded-lg text-xs hover:bg-muted">Cancel</button>
                <button type="submit" className="flex-1 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium">Create</button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {isLoading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => <div key={i} className="h-8 skeleton rounded-lg" />)}
          </div>
        ) : pages.length === 0 ? (
          <p className="text-xs text-muted-foreground">No pages yet</p>
        ) : (
          <nav className="space-y-0.5 overflow-y-auto flex-1">
            {pages.map((page) => (
              <button key={page._id} onClick={() => { setSelectedPage(page); setIsEditing(false); }}
                className={`w-full text-left flex items-center gap-2 px-2.5 py-2 rounded-xl text-sm transition-colors ${selectedPage?._id === page._id ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}>
                <BookOpen className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{page.title}</span>
              </button>
            ))}
          </nav>
        )}
      </div>

      {/* Editor / Preview */}
      <div className="flex-1 rounded-2xl border border-border bg-card overflow-hidden flex flex-col">
        {!selectedPage ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <BookOpen className="w-12 h-12 opacity-20" />
            <p>Select a page or create a new one</p>
            <button onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary/10 text-primary rounded-xl text-sm hover:bg-primary/20 transition-colors">
              <Plus className="w-4 h-4" /> Create first page
            </button>
          </div>
        ) : (
          <>
            {/* Page header */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-border flex-shrink-0">
              <div className="flex-1 min-w-0">
                {isEditing ? (
                  <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                    className="font-bold text-lg bg-transparent border-none focus:outline-none text-foreground w-full" />
                ) : (
                  <h2 className="font-bold text-lg text-foreground truncate">{selectedPage.title}</h2>
                )}
                <p className="text-xs text-muted-foreground">
                  {selectedPage.author?.name} • v{selectedPage.version} • {formatDate(selectedPage.updatedAt, "relative")}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {isEditing ? (
                  <>
                    <button onClick={() => setIsEditing(false)}
                      className="p-2 hover:bg-muted rounded-lg transition-colors"><X className="w-4 h-4" /></button>
                    <button onClick={savePage} disabled={isSaving}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-all">
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Save</>}
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={startEdit}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-xl text-sm hover:bg-muted transition-colors">
                      <Edit3 className="w-4 h-4" /> Edit
                    </button>
                    <button onClick={() => deletePage(selectedPage._id)}
                      className="p-2 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto" data-color-mode="auto">
              {isEditing ? (
                <MDEditor
                  value={editContent}
                  onChange={(val) => setEditContent(val || "")}
                  height="100%"
                  style={{ height: "100%", border: "none" }}
                  preview="live"
                />
              ) : (
                <div className="p-8 prose prose-sm max-w-none dark:prose-invert">
                  <MDPreview source={selectedPage.content} />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

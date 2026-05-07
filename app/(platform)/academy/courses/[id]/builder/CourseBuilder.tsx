"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Plus, Video, FileText, HelpCircle, ChevronDown,
  GripVertical, X, Save, ArrowLeft, Eye,
} from "lucide-react";
import Link from "next/link";

interface Question {
  id?: string; question: string; options: string[]; answer: string; explanation?: string | null; sortOrder: number;
}
interface Module {
  id: string; title: string; description: string | null; content: string | null;
  videoUrl: string | null; moduleType: string; sortOrder: number; isPublished: boolean;
  durationMin: number | null; questions: Question[];
}
interface Course {
  id: string; title: string; slug: string; isPublished: boolean;
  courseModules: Module[];
}

const TYPE_CONFIG = {
  text:     { label: "Text / Article", icon: FileText, color: "text-blue-500",   bg: "bg-blue-500/10" },
  video:    { label: "Video",          icon: Video,    color: "text-purple-500",  bg: "bg-purple-500/10" },
  quiz:     { label: "Quiz",           icon: HelpCircle, color: "text-amber-500", bg: "bg-amber-500/10" },
  document: { label: "Document",       icon: FileText, color: "text-green-500",   bg: "bg-green-500/10" },
};

export default function CourseBuilder({ course }: { course: Course }) {
  const [modules, setModules]      = useState<Module[]>(course.courseModules);
  const [expanded, setExpanded]    = useState<string | null>(null);
  const [showAdd,  setShowAdd]     = useState(false);
  const [saving,   setSaving]      = useState(false);
  const [feedback, setFeedback]    = useState<string | null>(null);

  // New module form
  const [newTitle, setNewTitle]   = useState("");
  const [newType,  setNewType]    = useState<"text" | "video" | "quiz" | "document">("text");
  const [newDesc,  setNewDesc]    = useState("");
  const [newContent, setNewContent] = useState("");
  const [newVideo,   setNewVideo]  = useState("");
  const [newDur,     setNewDur]    = useState("");
  const [newQuestions, setNewQuestions] = useState<Array<{ question: string; options: string[]; answer: string; explanation: string }>>([]);

  const flash = (msg: string) => { setFeedback(msg); setTimeout(() => setFeedback(null), 2500); };

  const addQuestion = () => {
    setNewQuestions((prev) => [...prev, { question: "", options: ["", "", "", ""], answer: "", explanation: "" }]);
  };

  const updateQ = (i: number, field: string, val: string) => {
    setNewQuestions((prev) => prev.map((q, idx) => idx === i ? { ...q, [field]: val } : q));
  };

  const updateQOption = (qi: number, oi: number, val: string) => {
    setNewQuestions((prev) => prev.map((q, idx) =>
      idx === qi ? { ...q, options: q.options.map((o, oIdx) => oIdx === oi ? val : o) } : q
    ));
  };

  const handleAddModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setSaving(true);
    const res = await fetch(`/api/courses/${course.id}/modules`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        title:       newTitle.trim(),
        description: newDesc.trim() || undefined,
        content:     newContent.trim() || undefined,
        videoUrl:    newVideo.trim() || undefined,
        moduleType:  newType,
        durationMin: newDur ? parseInt(newDur) : undefined,
        questions:   newType === "quiz"
          ? newQuestions.filter((q) => q.question && q.answer).map((q) => ({
              ...q,
              options: q.options.filter(Boolean),
              explanation: q.explanation || undefined,
            }))
          : undefined,
      }),
    });
    if (res.ok) {
      const { data } = await res.json();
      setModules((prev) => [...prev, data]);
      setNewTitle(""); setNewDesc(""); setNewContent(""); setNewVideo(""); setNewDur(""); setNewType("text"); setNewQuestions([]);
      setShowAdd(false);
      flash("Module added");
    }
    setSaving(false);
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <Link href={`/academy/courses/${course.id}`} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={14} /> Back to Course
        </Link>
        <div className="flex items-center gap-3">
          {feedback && <span className="text-xs text-green-600 flex items-center gap-1"><Save size={11} /> {feedback}</span>}
          <span className="text-xs text-muted-foreground">{modules.length} module{modules.length !== 1 ? "s" : ""}</span>
          <Link href={`/academy/courses/${course.id}`} className="btn-ghost text-xs flex items-center gap-1">
            <Eye size={13} /> Preview
          </Link>
          <button
            type="button"
            onClick={() => setShowAdd(!showAdd)}
            className="btn-primary flex items-center gap-1.5 text-sm"
          >
            <Plus size={14} /> Add Module
          </button>
        </div>
      </div>

      {/* Existing modules */}
      {modules.length === 0 && !showAdd && (
        <div className="empty-state">
          <div className="empty-state-icon"><FileText size={28} className="text-muted-foreground/40" /></div>
          <p className="text-sm font-medium">No modules yet</p>
          <p className="text-xs text-muted-foreground mt-1">Add your first module — text lesson, video, quiz, or document</p>
          <button type="button" onClick={() => setShowAdd(true)} className="btn-primary mt-4 text-xs">Add First Module</button>
        </div>
      )}

      <div className="space-y-3">
        {modules.map((mod, idx) => {
          const cfg = TYPE_CONFIG[mod.moduleType as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.text;
          const isOpen = expanded === mod.id;
          return (
            <div key={mod.id} className="section-card overflow-hidden">
              <div
                className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => setExpanded(isOpen ? null : mod.id)}
              >
                <GripVertical size={14} className="text-muted-foreground/40 flex-shrink-0" />
                <span className="text-xs font-medium text-muted-foreground w-5">{idx + 1}</span>
                <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0", cfg.bg)}>
                  <cfg.icon size={14} className={cfg.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{mod.title}</p>
                  {mod.description && <p className="text-xs text-muted-foreground truncate">{mod.description}</p>}
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 text-xs text-muted-foreground">
                  <span className="capitalize">{mod.moduleType}</span>
                  {mod.durationMin && <span>{mod.durationMin} min</span>}
                  {mod.moduleType === "quiz" && <span>{mod.questions.length} questions</span>}
                  <ChevronDown size={14} className={cn("transition-transform", isOpen && "rotate-180")} />
                </div>
              </div>

              {isOpen && (
                <div className="border-t border-border p-5 space-y-4">
                  {mod.content && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2">Content</p>
                      <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap bg-muted/30 rounded-lg p-4 border border-border">
                        {mod.content}
                      </div>
                    </div>
                  )}
                  {mod.videoUrl && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2">Video</p>
                      <a href={mod.videoUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-gold hover:underline break-all">{mod.videoUrl}</a>
                    </div>
                  )}
                  {mod.questions.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2">Quiz Questions ({mod.questions.length})</p>
                      <div className="space-y-3">
                        {mod.questions.map((q, qi) => (
                          <div key={qi} className="p-3 bg-muted/30 rounded-lg border border-border">
                            <p className="text-sm font-medium mb-2">{qi + 1}. {q.question}</p>
                            <div className="space-y-1">
                              {q.options.map((opt, oi) => (
                                <div key={oi} className={cn("text-xs px-2 py-1 rounded flex items-center gap-2", opt === q.answer ? "bg-green-500/10 text-green-700 font-medium" : "text-muted-foreground")}>
                                  {opt === q.answer && <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />}
                                  {opt}
                                </div>
                              ))}
                            </div>
                            {q.explanation && <p className="text-xs text-muted-foreground mt-2 italic">{q.explanation}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add module form */}
      {showAdd && (
        <form onSubmit={handleAddModule} className="section-card p-6 space-y-5 border-gold/30">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">New Module</h3>
            <button type="button" aria-label="Close" onClick={() => setShowAdd(false)}><X size={16} className="text-muted-foreground" /></button>
          </div>

          {/* Type selector */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Module Type</p>
            <div className="grid grid-cols-4 gap-2">
              {(Object.entries(TYPE_CONFIG) as [string, typeof TYPE_CONFIG.text][]).map(([key, cfg]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setNewType(key as typeof newType)}
                  className={cn(
                    "p-3 rounded-lg border text-center transition-colors",
                    newType === key ? "bg-gold/10 border-gold/40" : "border-border hover:border-border/60"
                  )}
                >
                  <cfg.icon size={16} className={cn("mx-auto mb-1", newType === key ? "text-gold" : cfg.color)} />
                  <p className="text-[10px] font-medium">{cfg.label}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label htmlFor="mod-title" className="text-sm font-medium block mb-1">Module Title *</label>
              <input
                id="mod-title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
                placeholder="e.g. Introduction to Psychological Safety"
                className="w-full h-9 px-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-gold"
              />
            </div>
            <div className="col-span-2">
              <label htmlFor="mod-desc" className="text-sm font-medium block mb-1">Description</label>
              <input
                id="mod-desc"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Brief description of this module"
                className="w-full h-9 px-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-gold"
              />
            </div>
            <div>
              <label htmlFor="mod-dur" className="text-sm font-medium block mb-1">Estimated Duration (min)</label>
              <input
                id="mod-dur"
                type="number"
                value={newDur}
                onChange={(e) => setNewDur(e.target.value)}
                min="1"
                placeholder="15"
                className="w-full h-9 px-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-gold"
              />
            </div>
          </div>

          {(newType === "text" || newType === "document") && (
            <div>
              <label htmlFor="mod-content" className="text-sm font-medium block mb-1">Content</label>
              <textarea
                id="mod-content"
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                rows={6}
                placeholder="Write your lesson content here (Markdown supported)…"
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-gold resize-none font-mono"
              />
            </div>
          )}

          {newType === "video" && (
            <div>
              <label htmlFor="mod-video" className="text-sm font-medium block mb-1">Video URL</label>
              <input
                id="mod-video"
                type="url"
                value={newVideo}
                onChange={(e) => setNewVideo(e.target.value)}
                placeholder="https://youtube.com/watch?v=… or https://loom.com/share/…"
                className="w-full h-9 px-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-gold"
              />
              <p className="text-xs text-muted-foreground mt-1">YouTube, Loom, Vimeo, or any direct video URL</p>
            </div>
          )}

          {newType === "quiz" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Quiz Questions</p>
                <button type="button" onClick={addQuestion} className="btn-ghost text-xs flex items-center gap-1">
                  <Plus size={12} /> Add Question
                </button>
              </div>
              {newQuestions.map((q, qi) => (
                <div key={qi} className="p-4 bg-muted/30 rounded-lg border border-border space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-muted-foreground">Q{qi + 1}</span>
                    <input
                      aria-label={`Question ${qi + 1}`}
                      value={q.question}
                      onChange={(e) => updateQ(qi, "question", e.target.value)}
                      placeholder="Question text…"
                      className="flex-1 h-8 px-3 text-sm bg-background border border-border rounded-lg focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    {q.options.map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`answer-${qi}`}
                          checked={q.answer === opt && opt !== ""}
                          onChange={() => updateQ(qi, "answer", opt)}
                          aria-label={`Mark option ${oi + 1} as correct`}
                          className="flex-shrink-0"
                        />
                        <input
                          aria-label={`Option ${oi + 1}`}
                          value={opt}
                          onChange={(e) => updateQOption(qi, oi, e.target.value)}
                          placeholder={`Option ${oi + 1}`}
                          className="flex-1 h-7 px-2 text-xs bg-background border border-border rounded focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                  <input
                    aria-label={`Explanation for Q${qi + 1}`}
                    value={q.explanation}
                    onChange={(e) => updateQ(qi, "explanation", e.target.value)}
                    placeholder="Explanation (shown after answer)…"
                    className="w-full h-7 px-2 text-xs bg-background border border-border rounded focus:outline-none text-muted-foreground"
                  />
                </div>
              ))}
              {newQuestions.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">Click "Add Question" to build your quiz</p>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowAdd(false)} className="btn-ghost text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary text-sm">
              {saving ? "Saving…" : "Add Module"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

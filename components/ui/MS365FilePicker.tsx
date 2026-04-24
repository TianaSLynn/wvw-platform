"use client";

import { useState, useCallback } from "react";
import { FolderOpen, FileText, ChevronRight, ChevronLeft, Loader2, Cloud, ExternalLink, X } from "lucide-react";
import { cn } from "@/lib/utils";

type DriveItem = {
  id: string;
  name: string;
  size: number | null;
  webUrl: string;
  mimeType: string | null;
  isFolder: boolean;
  lastModified: string;
};

type Site = { id: string; name: string; webUrl: string };

interface Props {
  /** Called when user selects a file — passes the file's webUrl and name */
  onSelect: (file: { name: string; url: string; mimeType: string | null }) => void;
  onClose: () => void;
  mode?: "onedrive" | "sharepoint";
}

function formatSize(bytes: number | null): string {
  if (bytes === null) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MS365FilePicker({ onSelect, onClose, mode = "onedrive" }: Props) {
  const [items, setItems] = useState<DriveItem[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [folderStack, setFolderStack] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const currentFolderId = folderStack.at(-1)?.id;

  const loadItems = useCallback(async (folderId?: string, siteId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (mode === "sharepoint" && siteId) {
        params.set("type", "sharepoint");
        params.set("siteId", siteId);
      } else {
        params.set("type", "onedrive");
      }
      if (folderId) params.set("folderId", folderId);

      const res = await fetch(`/api/integrations/ms365/files?${params}`);
      const json = await res.json() as { data?: { items: DriveItem[] }; error?: string };

      if (!res.ok) {
        setError(json.error ?? "Failed to load files");
        return;
      }
      setItems(json.data?.items ?? []);
      setLoaded(true);
    } catch {
      setError("Network error — could not load files");
    } finally {
      setLoading(false);
    }
  }, [mode]);

  const loadSites = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/integrations/ms365/files?type=sites");
      const json = await res.json() as { data?: { items: Site[] }; error?: string };
      if (!res.ok) { setError(json.error ?? "Failed to load sites"); return; }
      setSites(json.data?.items ?? []);
      setLoaded(true);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleOpen = () => {
    if (mode === "sharepoint" && sites.length === 0) {
      loadSites();
    } else if (mode === "onedrive" && !loaded) {
      loadItems();
    }
  };

  const enterFolder = (item: DriveItem) => {
    setFolderStack((prev) => [...prev, { id: item.id, name: item.name }]);
    if (mode === "sharepoint" && selectedSite) {
      loadItems(item.id, selectedSite.id);
    } else {
      loadItems(item.id);
    }
  };

  const goBack = () => {
    const newStack = folderStack.slice(0, -1);
    setFolderStack(newStack);
    const parentId = newStack.at(-1)?.id;
    if (mode === "sharepoint" && selectedSite) {
      loadItems(parentId, selectedSite.id);
    } else {
      loadItems(parentId);
    }
  };

  const selectSite = (site: Site) => {
    setSelectedSite(site);
    setFolderStack([]);
    loadItems(undefined, site.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[75vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Cloud size={16} className="text-blue-500" />
            <h3 className="text-sm font-semibold">
              {mode === "sharepoint" ? "SharePoint" : "OneDrive"} — Pick a file
            </h3>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Breadcrumb */}
        {(folderStack.length > 0 || selectedSite) && (
          <div className="flex items-center gap-1 px-4 py-2 border-b border-border text-xs text-muted-foreground overflow-x-auto">
            <button type="button" onClick={() => { setFolderStack([]); if (mode === "sharepoint") { setSites([]); setSelectedSite(null); loadSites(); } else { loadItems(); } }} className="hover:text-foreground">
              Root
            </button>
            {selectedSite && (
              <>
                <ChevronRight size={10} />
                <span className="text-foreground font-medium">{selectedSite.name}</span>
              </>
            )}
            {folderStack.map((f, i) => (
              <span key={f.id} className="flex items-center gap-1">
                <ChevronRight size={10} />
                <span className={i === folderStack.length - 1 ? "text-foreground font-medium" : ""}>{f.name}</span>
              </span>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {!loaded && !loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Cloud size={32} className="text-blue-500/40" />
              <p className="text-sm text-muted-foreground">Browse your {mode === "sharepoint" ? "SharePoint" : "OneDrive"} files</p>
              <button
                type="button"
                onClick={handleOpen}
                className="btn-primary text-sm flex items-center gap-2"
              >
                <FolderOpen size={14} /> Browse Files
              </button>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={20} className="animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <p className="text-sm text-red-500">{error}</p>
              <button type="button" onClick={() => { setError(null); setLoaded(false); }} className="btn-ghost text-xs mt-2">Try again</button>
            </div>
          ) : mode === "sharepoint" && !selectedSite ? (
            <div className="divide-y divide-border">
              {sites.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">No SharePoint sites found</p>
              ) : (
                sites.map((site) => (
                  <button
                    key={site.id}
                    type="button"
                    onClick={() => selectSite(site)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left"
                  >
                    <Cloud size={15} className="text-blue-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{site.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{site.webUrl}</p>
                    </div>
                    <ChevronRight size={13} className="text-muted-foreground flex-shrink-0" />
                  </button>
                ))
              )}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {folderStack.length > 0 && (
                <button
                  type="button"
                  onClick={goBack}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left text-xs text-muted-foreground"
                >
                  <ChevronLeft size={13} /> Back
                </button>
              )}
              {items.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">This folder is empty</p>
              ) : (
                items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (item.isFolder) { enterFolder(item); }
                      else { onSelect({ name: item.name, url: item.webUrl, mimeType: item.mimeType }); }
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left",
                      !item.isFolder && "hover:bg-blue-500/5"
                    )}
                  >
                    {item.isFolder
                      ? <FolderOpen size={15} className="text-amber-500 flex-shrink-0" />
                      : <FileText size={15} className="text-blue-500 flex-shrink-0" />
                    }
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{item.name}</p>
                      {!item.isFolder && item.size !== null && (
                        <p className="text-[10px] text-muted-foreground">{formatSize(item.size)}</p>
                      )}
                    </div>
                    {item.isFolder
                      ? <ChevronRight size={13} className="text-muted-foreground flex-shrink-0" />
                      : <ExternalLink size={11} className="text-muted-foreground flex-shrink-0" />
                    }
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div className="p-3 border-t border-border">
          <button type="button" onClick={onClose} className="btn-ghost w-full text-sm">Cancel</button>
        </div>
      </div>
    </div>
  );
}

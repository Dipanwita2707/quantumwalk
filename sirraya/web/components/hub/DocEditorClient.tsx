"use client";

import { useMemo } from "react";
import { isDocument, useHubDraft } from "@/lib/hubWorkspace";
import { documentPreview } from "@/lib/documentPreview";
import { HubIncomingDocument, HubSendActions } from "@/components/HubDocumentTransfer";

const STORAGE_KEY = "qw-hub-doc-editor";

export function DocEditorClient() {
  const draft = useHubDraft(STORAGE_KEY, "# Draft\n\nWrite in **Markdown**. Saved locally in this browser.", isDocument, "text");
  const { value: body, update: setBody, ready, storageError } = draft;
  const html = useMemo(() => documentPreview(body), [body]);

  function exportHtml() {
    const doc = `<!doctype html><html><head><meta charset="utf-8"><title>Export</title></head><body>${html}</body></html>`;
    const blob = new Blob([doc], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "document.html";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="qw-doc-editor">
      <HubIncomingDocument ready={ready} onImport={incoming => draft.importValue(incoming.body)} />
      <p className="hub-draft-status" role="status">{ready ? storageError ? "Local saving unavailable" : "Local draft · autosave on" : "Loading your draft…"}</p>
      <div className="qw-doc-toolbar">
        <button type="button" className="hub-button hub-button-primary" onClick={exportHtml} disabled={!ready}>
          Export HTML
        </button>
        <button type="button" className="hub-button" disabled={!ready} onClick={() => window.print()}>
          Print / PDF
        </button>
        {draft.hasPrevious && <button type="button" className="hub-button" onClick={draft.restorePrevious}>Restore previous draft</button>}
      </div>
      <HubSendActions source="doc-editor" body={body} ready={ready} />
      {storageError && <p role="alert">This browser is not saving drafts. Export HTML to keep a copy.</p>}
      <div className="qw-doc-split">
        <label className="qw-doc-pane">
          <span className="panel-kicker">MARKDOWN</span>
          <textarea
            value={body}
            disabled={!ready}
            maxLength={250000}
            onChange={(e) => setBody(e.target.value)}
            aria-label="Markdown source"
            spellCheck
          />
        </label>
        <div className="qw-doc-pane qw-doc-preview" aria-label="Live preview">
          <span className="panel-kicker">PREVIEW</span>
          <div className="prose-like" dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      </div>
    </div>
  );
}

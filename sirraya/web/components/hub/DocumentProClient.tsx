"use client";

import { useMemo } from "react";
import { isDocument, isRecord, useHubDraft } from "@/lib/hubWorkspace";
import { HubIncomingDocument, HubSendActions } from "@/components/HubDocumentTransfer";
import { documentPreview } from "@/lib/documentPreview";

type Template = {
  id: string;
  title: string;
  body: string;
};

const TEMPLATES: Template[] = [
  {
    id: "memo",
    title: "Internal memo",
    body: `# {{title}}

Date: {{date}}

## Summary
{{summary}}

## Action items
- {{action1}}
- {{action2}}

---
Confidential — for internal use only.`,
  },
  {
    id: "letter",
    title: "Business letter",
    body: `{{date}}

{{recipient}}

Dear {{recipient}},

{{body}}

Sincerely,
{{signatory}}`,
  },
  {
    id: "nda",
    title: "Mutual NDA (outline)",
    body: `# Mutual non-disclosure outline

Parties: {{party_a}} and {{party_b}}

Purpose: {{purpose}}

Term: {{term}}

This is a teaching template, not legal advice.`,
  },
];

const DEFAULT_FIELDS: Record<string, string> = {
  title: "Project update",
  date: new Date().toISOString().slice(0, 10),
  summary: "Describe the decision in plain language.",
  action1: "Owner — task",
  action2: "Owner — follow-up",
  recipient: "Recipient name",
  body: "Main letter body.",
  signatory: "Your name",
  party_a: "Party A",
  party_b: "Party B",
  purpose: "Evaluate a collaboration",
  term: "12 months",
};

function fillTemplate(source: string, fields: Record<string, string>): string {
  return source.replace(/\{\{(\w+)\}\}/g, (_, key: string) => fields[key] ?? `{{${key}}}`);
}

type ProDraft = { templateId: string; fields: Record<string, string>; importedBody: string | null };
const INITIAL_DRAFT: ProDraft = { templateId: "memo", fields: DEFAULT_FIELDS, importedBody: null };
function validDraft(value: unknown): value is ProDraft {
  return isRecord(value) && typeof value.templateId === "string" && [...TEMPLATES.map(template => template.id), "imported"].includes(value.templateId)
    && isRecord(value.fields) && Object.entries(value.fields).every(([key, field]) => Object.hasOwn(DEFAULT_FIELDS, key) && typeof field === "string" && field.length <= 20000)
    && (value.importedBody === null || isDocument(value.importedBody));
}

export function DocumentProClient() {
  const draft = useHubDraft("qw-hub-document-pro", INITIAL_DRAFT, validDraft);
  const { templateId, fields, importedBody } = draft.value;

  const template = TEMPLATES.find((t) => t.id === templateId) ?? TEMPLATES[0];
  const rendered = useMemo(() => templateId === "imported" ? importedBody ?? "" : fillTemplate(template.body, fields), [templateId, importedBody, template, fields]);

  const fieldKeys = useMemo(() => {
    const keys = new Set<string>();
    if (templateId !== "imported") for (const m of template.body.matchAll(/\{\{(\w+)\}\}/g)) keys.add(m[1]);
    return [...keys];
  }, [template.body, templateId]);

  function exportMarkdown() {
    const url = URL.createObjectURL(new Blob([rendered], { type: "text/markdown" }));
    const link = document.createElement("a"); link.href = url; link.download = "document.md"; link.click(); URL.revokeObjectURL(url);
  }

  return (
    <div className="qw-doc-pro">
      <HubIncomingDocument ready={draft.ready} onImport={incoming => draft.importValue({ ...draft.value, templateId: "imported", importedBody: incoming.body, fields: { ...fields, title: incoming.title } })} />
      <p className="hub-draft-status" role="status">{draft.ready ? draft.storageError ? "Local saving unavailable" : "Local draft · autosave on" : "Loading your draft…"}</p>
      {draft.storageError && <p role="alert">This browser is not saving document fields. Export Markdown to keep a copy.</p>}
      <div className="qw-doc-toolbar"><button type="button" className="hub-button" disabled={!draft.ready} onClick={exportMarkdown}>Export Markdown</button>{draft.hasPrevious && <button type="button" className="hub-button" onClick={draft.restorePrevious}>Restore previous draft</button>}</div>
      <HubSendActions source="document-pro" body={rendered} ready={draft.ready} />
      <label className="qw-doc-pro-field">
        <span>Template</span>
        <select disabled={!draft.ready} value={templateId} onChange={(e) => draft.update(previous => ({ ...previous, templateId: e.target.value }))}>
          {importedBody !== null && <option value="imported">Imported document</option>}
          {TEMPLATES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>
      </label>
      <div className="qw-doc-pro-grid">
        <div className="qw-doc-pro-fields">
          <span className="panel-kicker">FIELDS</span>
          {templateId === "imported" && <label className="qw-doc-pro-field"><span>Document content</span><textarea aria-label="Document content" disabled={!draft.ready} maxLength={250000} value={importedBody ?? ""} onChange={event => draft.update(previous => ({ ...previous, importedBody: event.target.value }))} /></label>}
          {fieldKeys.map((key) => (
            <label key={key} className="qw-doc-pro-field">
              <span>{key.replace(/_/g, " ")}</span>
              <input
                disabled={!draft.ready}
                maxLength={20000}
                value={fields[key] ?? ""}
                onChange={(e) => draft.update(previous => ({ ...previous, fields: { ...previous.fields, [key]: e.target.value } }))}
              />
            </label>
          ))}
        </div>
        <div className="qw-doc-pro-preview content-card">
          <span className="panel-kicker">PREVIEW</span>
          <div className="qw-doc-pro-render prose-like" dangerouslySetInnerHTML={{ __html: documentPreview(rendered) }} />
          <button type="button" className="hub-button hub-button-primary" disabled={!draft.ready} onClick={() => window.print()}>
            Print / save as PDF
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useMemo } from "react";
import { isRecord, useHubDraft } from "@/lib/hubWorkspace";
import { HubSendActions } from "@/components/HubDocumentTransfer";

type LayerKind = "dense" | "relu" | "dropout" | "softmax";

type Layer = { id: string; kind: LayerKind; units: number };

const KIND_LABEL: Record<LayerKind, string> = {
  dense: "Dense",
  relu: "ReLU",
  dropout: "Dropout",
  softmax: "Softmax",
};

type NetworkDraft = { inputDim: number; layers: Layer[] };
const INITIAL_NETWORK: NetworkDraft = { inputDim: 8, layers: [
  { id: "1", kind: "dense", units: 16 }, { id: "2", kind: "relu", units: 16 },
  { id: "3", kind: "dense", units: 4 }, { id: "4", kind: "softmax", units: 4 },
] };
function validNetwork(value: unknown): value is NetworkDraft {
  return isRecord(value) && Number.isInteger(value.inputDim) && Number(value.inputDim) >= 2 && Number(value.inputDim) <= 128
    && Array.isArray(value.layers) && value.layers.length <= 32 && value.layers.every(layer => isRecord(layer) && typeof layer.id === "string" && layer.id.length <= 80 && typeof layer.kind === "string" && Object.hasOwn(KIND_LABEL, layer.kind) && Number.isInteger(layer.units) && Number(layer.units) >= 1 && Number(layer.units) <= 256)
    && new Set(value.layers.map(layer => layer.id)).size === value.layers.length;
}
function bounded(value: string, min: number, max: number) { const number = Number(value); return Number.isFinite(number) ? Math.max(min, Math.min(max, Math.trunc(number))) : min; }

export function MLStudioClient() {
  const draft = useHubDraft("qw-hub-ml-studio", INITIAL_NETWORK, validNetwork);
  const { inputDim, layers } = draft.value;

  const shapes = useMemo(() => {
    const rows: string[] = [`Input (${inputDim})`];
    let prev = inputDim;
    for (const layer of layers) {
      if (layer.kind !== "dense") {
        rows.push(`${layer.kind === "dropout" ? "Dropout p=0.2" : KIND_LABEL[layer.kind]} → (${prev})`);
        continue;
      }
      rows.push(`${KIND_LABEL[layer.kind]} (${layer.units})`);
      prev = layer.units;
    }
    return rows;
  }, [inputDim, layers]);

  function addLayer() {
    if (layers.length >= 32) return;
    draft.update(previous => ({ ...previous, layers: [...previous.layers, { id: crypto.randomUUID(), kind: "dense", units: 8 }] }));
  }
  const report = `# Network design\n\nInput features: ${inputDim}\n\n## Layer flow\n${shapes.map((shape, index) => `${index + 1}. ${shape}`).join("\n")}\n\nThis is an architecture/shape exercise. No model was trained and no accuracy or inference result is claimed.`;
  function exportDesign() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(draft.value, null, 2)], { type: "application/json" }));
    const link = document.createElement("a"); link.href = url; link.download = "network-design.json"; link.click(); URL.revokeObjectURL(url);
  }

  return (
    <div className="qw-ml-studio">
      <p className="hub-draft-status" role="status">{draft.ready ? draft.storageError ? "Local saving unavailable" : "Local design · autosave on" : "Loading your design…"}</p>
      {draft.storageError && <p role="alert">This browser is not saving the network design. Export design to keep a copy.</p>}
      <div className="qw-doc-toolbar"><button type="button" className="hub-button" disabled={!draft.ready} onClick={exportDesign}>Export design</button></div>
      <HubSendActions source="ml-studio" body={report} ready={draft.ready} />
      <p className="hub-tool-note">Design layer shapes and carry the design report into either document tool. This workspace does not train models.</p>
      <label className="qw-doc-pro-field">
        <span>Input features</span>
        <input
          type="number"
          min={2}
          max={128}
          disabled={!draft.ready}
          value={inputDim}
          onChange={(e) => draft.update(previous => ({ ...previous, inputDim: bounded(e.target.value, 2, 128) }))}
        />
      </label>
      <div className="hub-ml-workbench">
      <div className="qw-ml-canvas" aria-label="Network diagram">
        {shapes.map((label, i) => (
          <div key={i} className="qw-ml-block">
            <span>{label}</span>
            {i < shapes.length - 1 && <span className="qw-ml-arrow" aria-hidden="true">↓</span>}
          </div>
        ))}
      </div>
      <div className="qw-ml-layers">
        <span className="panel-kicker">LAYERS</span>
        <ul>
          {layers.map((layer, index) => (
            <li key={layer.id}>
              <select
                disabled={!draft.ready}
                aria-label={`Layer ${index + 1} type`}
                value={layer.kind}
                onChange={(e) =>
                  draft.update(previous => ({ ...previous, layers: previous.layers.map((x, i) => i === index ? { ...x, kind: e.target.value as LayerKind } : x) }))
                }
              >
                {(Object.keys(KIND_LABEL) as LayerKind[]).map((k) => (
                  <option key={k} value={k}>
                    {KIND_LABEL[k]}
                  </option>
                ))}
              </select>
              {layer.kind === "dense" && (
                <input
                  type="number"
                  min={1}
                  max={256}
                  disabled={!draft.ready}
                  value={layer.units}
                  onChange={(e) =>
                    draft.update(previous => ({ ...previous, layers: previous.layers.map((x, i) => i === index ? { ...x, units: bounded(e.target.value, 1, 256) } : x) }))
                  }
                  aria-label="Units"
                />
              )}
              <button type="button" className="hub-button" disabled={!draft.ready} aria-label={`Remove layer ${index + 1}`} onClick={() => draft.update(previous => ({ ...previous, layers: previous.layers.filter((_, i) => i !== index) }))}>Remove</button>
            </li>
          ))}
        </ul>
        <button type="button" className="hub-button hub-button-primary" disabled={!draft.ready || layers.length >= 32} onClick={addLayer}>
          Add layer
        </button>
      </div>
      </div>
    </div>
  );
}

"""Private, reproducible reports with dependency-free CSV/JSON/vector PDF exports."""
import csv
import io
import json
import textwrap
import unicodedata

from science_models import LABS, definition
from database import utc_value


def report_content(run) -> dict:
    lab = run.result.get("model_card") or definition(LABS[run.lab_slug])
    return {"title": lab["title"], "objective": lab["objective"], "model": lab["model"], "model_version": run.model_version, "method": "Bounded classical educational model", "prediction": run.prediction, "created_at": utc_value(run.created_at).isoformat(), "result": run.result, "assumptions": lab["assumptions"], "limitations": lab["limitations"], "reference": lab["reference"]}


def export_report(run, format: str) -> tuple[bytes, str]:
    data = report_content(run)
    if format == "json":
        return json.dumps(data, ensure_ascii=False, indent=2, allow_nan=False).encode(), "application/json"
    if format == "csv":
        output = io.StringIO(newline="")
        writer = csv.writer(output)
        # All column labels are server-controlled. Values are finite numeric outputs.
        result = run.result
        writer.writerow([result["x_label"], *(series["label"] for series in result["series"])])
        for index, x in enumerate(result["x"]):
            writer.writerow([x, *(series["values"][index] for series in result["series"])])
        return output.getvalue().encode(), "text/csv"
    return pdf_report(data), "application/pdf"


def pdf_report(data: dict) -> bytes:
    def escape(value):
        substitutions = {"α": "alpha", "λ": "lambda", "κ": "kappa", "π": "pi", "ψ": "psi", "ξ": "xi", "δ": "delta", "μ": "mu", "ℏ": "hbar", "ω": "omega", "₀": "_0", "ₙ": "_n", "ₛ": "_s", "ₚ": "_p", "−": "-", "∝": "proportional to", "⁻¹": "^(-1)", "²": "^2", "₁": "_1", "√": "sqrt", "Σ": "sum", "ε": "epsilon", "′": "'", "½": "1/2"}
        value = str(value)
        for symbol, plain in substitutions.items(): value = value.replace(symbol, plain)
        return unicodedata.normalize("NFKD", value).encode("latin-1", "replace").decode("latin-1").replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)").replace("\r", " ").replace("\n", " ")
    lines = ["QUANTUMWALK LAB REPORT", data["title"], ""]
    data = {**data, "interpretation": data["result"].get("interpretation", "No interpretation recorded in this earlier run.")}
    for label in ["objective", "model", "model_version", "method", "prediction", "interpretation", "created_at", "assumptions", "limitations", "reference"]:
        lines.extend(textwrap.wrap(f"{label.replace('_', ' ').title()}: {data[label]}", 88))
        lines.append("")
    result = data["result"]
    lines += [f"Seed: {result['seed']}", f"Parameters: {json.dumps(result['parameters'])}", "", "Numerical results"]
    for label, value in result["metrics"].items():
        lines.extend(textwrap.wrap(f"{label}: {value:.6g}", 88))
    pages = []
    for start in range(0, len(lines), 46):
        commands = ["BT /F1 10 Tf 46 794 Td 15 TL"]
        for line in lines[start:start + 46]:
            commands.append(f"({escape(line)}) Tj T*")
        commands.append("ET")
        pages.append("\n".join(commands).encode("latin-1"))
    # A separate vector plot page avoids clipping report prose.
    values = [v for series in result["series"] for v in series["values"]]
    ymin, ymax = min(0, *values), max(1e-12, *values)
    xmin, xmax = min(result["x"]), max(result["x"])
    graph = [f"BT /F1 12 Tf 46 790 Td ({escape(result['y_label'])}) Tj ET", "0.6 G 46 200 m 550 200 l 550 700 l S"]
    for index, series in enumerate(result["series"]):
        graph.append("0.45 0.25 0.85 RG" if index == 0 else "0 0.55 0.65 RG")
        for i, y in enumerate(series["values"]):
            xcoord = 46 + (result["x"][i] - xmin) / (xmax - xmin or 1) * 504
            ycoord = 200 + (y - ymin) / (ymax - ymin or 1) * 500
            graph.append(f"{xcoord:.3f} {ycoord:.3f} {'m' if i == 0 else 'l'}")
        graph.append("S")
        graph.append(f"BT /F1 10 Tf 46 {740 - index * 16} Td ({escape(series['label'])}) Tj ET")
    graph += [f"BT /F1 10 Tf 46 180 Td ({escape(result['x_label'])}: {xmin:.4g} to {xmax:.4g}) Tj ET", f"BT /F1 10 Tf 46 160 Td (Y range: {ymin:.4g} to {ymax:.4g}) Tj ET"]
    pages.append("\n".join(graph).encode("latin-1"))
    objects = [b"<< /Type /Catalog /Pages 2 0 R >>", b"", b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"]
    kids = []
    for page in pages:
        number = len(objects) + 1
        kids.append(f"{number} 0 R")
        objects += [f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents {number + 1} 0 R >>".encode(), f"<< /Length {len(page)} >>\nstream\n".encode() + page + b"\nendstream"]
    objects[1] = f"<< /Type /Pages /Count {len(pages)} /Kids [{' '.join(kids)}] >>".encode()
    output = bytearray(b"%PDF-1.4\n")
    offsets = [0]
    for index, obj in enumerate(objects, 1):
        offsets.append(len(output)); output.extend(f"{index} 0 obj\n".encode() + obj + b"\nendobj\n")
    position = len(output)
    output.extend(f"xref\n0 {len(offsets)}\n0000000000 65535 f \n".encode())
    for offset in offsets[1:]:
        output.extend(f"{offset:010d} 00000 n \n".encode())
    output.extend(f"trailer\n<< /Size {len(offsets)} /Root 1 0 R >>\nstartxref\n{position}\n%%EOF".encode())
    return bytes(output)

"""Bounded educational models. Units and approximations are part of each contract."""
from __future__ import annotations

import math
import random
from dataclasses import asdict, dataclass

from pydantic import BaseModel, ConfigDict, Field


@dataclass(frozen=True)
class Parameter:
    key: str
    label: str
    unit: str
    minimum: float
    maximum: float
    default: float
    step: float


@dataclass(frozen=True)
class Lab:
    slug: str
    title: str
    domain: str
    level: str
    minutes: int
    question: str
    objective: str
    prediction: str
    parameters: tuple[Parameter, ...]
    model: str
    assumptions: str
    limitations: str
    reference: str
    related: str
    version: str = "1.0.0"
    review_status: str = "educational-preview"


P = Parameter
OPENSTAX = "https://openstax.org/books/university-physics-volume-3/pages/7-introduction"
LABS = {lab.slug: lab for lab in [
    Lab("double-slit", "Double-Slit Mystery", "Quantum physics", "Beginner", 10,
        "How does which-path information change an interference pattern?", "Distinguish interference from a single-slit diffraction envelope.",
        "Will recording the path preserve the interference fringes?",
        (P("wavelength", "Wavelength", "nm", 380, 750, 550, 5), P("separation", "Slit separation", "μm", 40, 160, 80, 5), P("width", "Slit width", "μm", 5, 30, 15, 1), P("which_path", "Which-path information (0 off, 1 on)", "", 0, 1, 0, 1), P("particles", "Detected particles", "counts", 100, 4000, 1000, 100)),
        "I(x) ∝ sinc²(πax/λL) · [1 + V cos(2πdx/λL)]", "Fraunhofer approximation; equal coherent slits; screen distance L = 1 m. V = 0 with ideal which-path information.", "Ideal one-dimensional screen; no detector imperfections. Measurement interaction removes coherence; consciousness is not involved.",
        "https://openstax.org/books/university-physics-volume-3/pages/3-1-youngs-double-slit-experiment", "/learn/first-qubit"),
    Lab("tunnelling", "Through the Barrier", "Quantum physics", "Intermediate", 12,
        "Can an electron cross a barrier higher than its energy?", "Compare exact rectangular-barrier transmission at different widths.", "What happens to transmission when the barrier gets wider?",
        (P("energy", "Electron energy", "eV", .1, 9, 1, .1), P("barrier", "Barrier height", "eV", 1, 10, 3, .1), P("width", "Barrier width", "nm", .02, 2, .3, .02)),
        "T = [1 + V₀² sinh²(κa)/(4E(V₀−E))]⁻¹ for E < V₀", "One-dimensional stationary electron; rectangular potential; analytic matching at both interfaces.", "No time-dependent wavepacket or many-body effects. Above-barrier reflection is included.",
        "https://openstax.org/books/university-physics-volume-3/pages/7-6-the-quantum-tunneling-of-particles-through-potential-barriers", "/learn/math-amplitudes"),
    Lab("hydrogen", "Inside the Hydrogen Atom", "Atomic science", "Beginner", 10,
        "Where is the electron most likely to be found?", "Inspect the radial probability density of hydrogen's 1s state.", "Is the most likely radius zero or one Bohr radius?",
        (P("radius", "Inspection radius", "a₀", 0, 8, 1, .1), P("upper", "Emission initial level", "n", 3, 8, 3, 1)),
        "P(r) = 4r² exp(−2r), r in a₀; Eₙ = −13.6057/n² eV", "Nonrelativistic hydrogen 1s radial distribution; emission ends at n = 2.", "A radial distribution is not a planetary orbit. Ignores fine structure, spin and reduced-mass corrections; the emission transition does not change the plotted 1s state.",
        "https://openstax.org/books/university-physics-volume-3/pages/8-2-the-hydrogen-atom", "/academy/foundations"),
    Lab("oscillator", "Quantum Harmonic Oscillator", "Quantum physics", "Intermediate", 12,
        "How does a quantum oscillator differ from a classical one?", "Compare stationary probability densities and discrete energy levels.", "Can the oscillator's lowest energy be zero?",
        (P("state", "Energy eigenstate", "n", 0, 6, 0, 1),),
        "|ψₙ(ξ)|² = Hₙ²(ξ) exp(−ξ²) / (√π 2ⁿ n!); Eₙ/ℏω = n + ½", "Ideal one-dimensional harmonic potential; dimensionless ξ = x√(mω/ℏ).", "Stationary states only; no damping, anharmonicity or time-dependent superposition.",
        "https://openstax.org/books/university-physics-volume-3/pages/7-5-the-quantum-harmonic-oscillator", "/learn/math-amplitudes"),
    Lab("bell", "Entanglement & Bell Correlations", "Quantum computing", "Intermediate", 15,
        "Can a shared quantum state exceed the CHSH classical bound?", "Compare ideal singlet correlations with finite-shot estimates.", "Will finite-shot estimates always equal the ideal CHSH value?",
        (P("angle", "Bob's first measurement angle", "degrees", 0, 90, 45, 1), P("visibility", "Singlet visibility", "", 0, 1, 1, .05), P("shots", "Shots per setting pair", "shots", 100, 4000, 1000, 100)),
        "E(a,b) = −v cos(a−b); S = |E(a,b)+E(a,b′)+E(a′,b)−E(a′,b′)|", "Spin measurement axes in a plane; a = 0°, a′ = 90°, b′ = −b. White-noise singlet visibility v.", "Classical simulation of ideal correlations, not a loophole-free Bell experiment or a hardware result. Finite-sample standard errors are estimates.",
        "https://qiskit.qotlabs.org/learning/courses/basics-of-quantum-information/entanglement-in-action/chsh-game", "/learn/entanglement"),
    Lab("lensing", "Black-Hole Lensing", "Cosmology", "Intermediate", 12,
        "How does gravity bend a passing light ray?", "Inspect weak-field deflection as impact distance changes.", "Does doubling the impact distance increase or decrease deflection?",
        (P("mass", "Lens mass", "solar masses", 1, 100, 10, 1), P("impact", "Impact distance", "Schwarzschild radii", 20, 200, 50, 5)),
        "α = 4GM/(bc²) = 2rₛ/b; rₛ = 2GM/c²", "Weak-field asymptotic deflection by an isolated point mass; b ≥ 20rₛ.", "Classical general relativity approximation. No horizon ray tracing, spin, accretion, strong lensing or quantum gravity.",
        "https://www.einstein-online.info/en/explandict/gravitational-lens/", "/learn/hardware"),
    Lab("cosmic-structure", "Seeds of Cosmic Structure", "Cosmology", "Beginner", 10,
        "How can a small fluctuation become a larger pattern?", "Compare a seeded initial field with a linear growth toy model.", "Does linear growth change the locations of the initial peaks?",
        (P("amplitude", "Initial fluctuation amplitude", "arbitrary units", .01, .2, .05, .01), P("growth", "Linear growth factor", "", 1, 5, 2, .1)),
        "δ(x,D) = D δ₀(x); δ₀ is a seeded sum of sinusoidal modes", "One-dimensional synthetic periodic field; bounded linear growth; dimensionless contrast.", "Not a gravitational N-body solver, cosmological parameter fit or full universe simulation. No quantum-computing equivalence is claimed.",
        "https://background.uchicago.edu/~whu/intermediate/gravity.html", "/academy/foundations"),
    Lab("fusion", "Tunnelling & Stellar Fusion", "Atomic science", "Intermediate", 12,
        "Why is tunnelling relevant to fusion in stars?", "Explore the energy dependence of the proton-proton Gamow factor.", "Does raising the collision energy increase barrier penetration?",
        (P("energy", "Centre-of-mass energy", "keV", 1, 100, 10, 1),),
        "P_G ≈ exp[−2π α √(μc²/(2E))]", "Proton pair, charge numbers 1; reduced mass μ = mₚ/2; nonrelativistic Coulomb penetration factor.", "Only the exponential barrier factor. Not a reaction rate, cross section, stellar evolution model or complete description of the weak-interaction proton-proton reaction.",
        "https://openstax.org/books/university-physics-volume-3/pages/7-6-the-quantum-tunneling-of-particles-through-potential-barriers", "/lab/tunnelling"),
    Lab("spectrum", "Signal & Spectrum Lab", "Signals", "Beginner", 10,
        "Can you identify a periodic signal hidden in noise?", "Compare a synthetic signal and its discrete Fourier magnitude.", "What changes when noise increases: the signal frequency or its visibility?",
        (P("frequency", "Signal frequency", "Hz", 2, 40, 8, 1), P("noise", "Noise standard deviation", "amplitude", 0, 1, .2, .05)),
        "s(t) = sin(2πft) + ε; X[k] = Σ s[j] exp(−2πijk/N)", "128 samples at 128 Hz; seeded independent Gaussian noise; single-sided amplitude spectrum.", "Synthetic data with no observational provenance. No windowing; off-bin frequencies leak into neighbouring bins.",
        "https://numpy.org/doc/stable/reference/routines.fft.html", "/academy/labs/qft"),
]}


class ScienceRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True, allow_inf_nan=False)
    parameters: dict[str, float] = Field(default_factory=dict, max_length=10)
    seed: int = Field(default=42, ge=0, le=2**32 - 1)


def definition(lab: Lab) -> dict:
    prerequisites = {"tunnelling": ["double-slit"], "bell": ["double-slit"], "oscillator": ["double-slit"], "fusion": ["tunnelling"], "cosmic-structure": ["lensing"]}
    return {**asdict(lab), "tier": "explorer", "prerequisites": prerequisites.get(lab.slug, [])}


def validated_parameters(lab: Lab, request: ScienceRequest) -> dict[str, float]:
    specs = {p.key: p for p in lab.parameters}
    if request.parameters.keys() - specs.keys():
        raise ValueError("Unknown model parameter")
    values = {key: request.parameters.get(key, p.default) for key, p in specs.items()}
    for key, value in values.items():
        p = specs[key]
        if not math.isfinite(value) or not p.minimum <= value <= p.maximum:
            raise ValueError(f"{p.label} must be between {p.minimum} and {p.maximum} {p.unit}")
        if (p.step == 1 or key in {"particles", "shots"}) and value != int(value):
            raise ValueError(f"{p.label} must be an integer")
    return values


def transmission(energy: float, barrier: float, width: float) -> float:
    # ħ²/(2m_e) = 0.03809982 eV nm².
    difference = barrier - energy
    if abs(difference) < 1e-10:
        return 1 / (1 + barrier * width * width / (4 * .03809982))
    phase = width * math.sqrt(abs(difference) / .03809982)
    term = math.sinh(phase) ** 2 if difference > 0 else math.sin(phase) ** 2
    return 1 / (1 + barrier * barrier * term / (4 * energy * abs(difference)))


def run_model(slug: str, request: ScienceRequest) -> dict:
    lab = LABS[slug]
    p = validated_parameters(lab, request)
    rng = random.Random(request.seed)
    x = [i / 127 for i in range(128)]
    series: list[dict] = []
    metrics: dict[str, float] = {}
    x_label, y_label = "Position", "Value"

    def curve(label: str, values: list[float]):
        series.append({"label": label, "values": values})

    if slug == "double-slit":
        x = [(i / 127 - .5) * 40 for i in range(128)]
        weights = []
        for pos in x:
            beta = math.pi * p["width"] * 1e-6 * pos * 1e-3 / (p["wavelength"] * 1e-9)
            envelope = (math.sin(beta) / beta) ** 2 if beta else 1
            phase = 2 * math.pi * p["separation"] * 1e-6 * pos * 1e-3 / (p["wavelength"] * 1e-9)
            weights.append(envelope * (1 + (1 - p["which_path"]) * math.cos(phase)))
        total = sum(weights)
        probability = [v / total for v in weights]
        counts = [0.] * 128
        for index in rng.choices(range(128), weights=weights, k=int(p["particles"])):
            counts[index] += 1
        curve("Expected counts", [v * p["particles"] for v in probability])
        curve("Detected counts", counts)
        metrics = {"Detected particles": sum(counts), "Fringe spacing (mm)": p["wavelength"] / p["separation"]}
        x_label, y_label = "Screen position (mm)", "Counts per bin"
    elif slug == "tunnelling":
        x = [.02 + i / 127 * 1.98 for i in range(128)]
        curve("Transmission", [transmission(p["energy"], p["barrier"], w) for w in x])
        metrics = {"Transmission probability": transmission(p["energy"], p["barrier"], p["width"])}
        x_label, y_label = "Barrier width (nm)", "Transmission probability"
    elif slug == "hydrogen":
        x = [i / 127 * 12 for i in range(128)]
        curve("1s radial probability density", [4 * r * r * math.exp(-2 * r) for r in x])
        delta = 13.6057 * (1 / 4 - 1 / p["upper"] ** 2)
        metrics = {"Density at inspection radius (1/a₀)": 4 * p["radius"] ** 2 * math.exp(-2 * p["radius"]), "Emission wavelength to n=2 (nm)": 1239.841984 / delta}
        x_label, y_label = "Radius (Bohr radii a₀)", "Radial probability density (1/a₀)"
    elif slug == "oscillator":
        x = [-7 + i / 127 * 14 for i in range(128)]
        n = int(p["state"])
        def density(pos):
            before, current = 1., 2 * pos
            for k in range(1, n):
                before, current = current, 2 * pos * current - 2 * k * before
            hermite = before if n == 0 else current
            return hermite ** 2 * math.exp(-pos * pos) / (math.sqrt(math.pi) * 2 ** n * math.factorial(n))
        curve("Probability density", [density(pos) for pos in x])
        metrics = {"Energy (ℏω)": n + .5}
        x_label, y_label = "Dimensionless position ξ", "Probability density"
    elif slug == "bell":
        theta = math.radians(p["angle"])
        exact = [-p["visibility"] * math.cos(a - b) for a, b in [(0, theta), (0, -theta), (math.pi / 2, theta), (math.pi / 2, -theta)]]
        shots = int(p["shots"])
        measured = [sum(1 if rng.random() < (1 + corr) / 2 else -1 for _ in range(shots)) / shots for corr in exact]
        x = [0., 1., 2., 3.]
        curve("Ideal E (AB, AB′, A′B, A′B′)", exact)
        curve("Sampled E", measured)
        metrics = {"Ideal CHSH S": abs(exact[0] + exact[1] + exact[2] - exact[3]), "Sampled CHSH S": abs(measured[0] + measured[1] + measured[2] - measured[3]), "Estimated S standard error": math.sqrt(sum(1 - v * v for v in measured) / shots), "Classical bound": 2}
        x_label, y_label = "Setting pair index", "Correlation (−1 to 1)"
    elif slug == "lensing":
        x = [20 + i / 127 * 180 for i in range(128)]
        curve("Deflection", [2 / b for b in x])
        metrics = {"Schwarzschild radius (km)": 2.95334 * p["mass"], "Deflection at selected impact (radians)": 2 / p["impact"]}
        x_label, y_label = "Impact distance (rₛ)", "Deflection (radians)"
    elif slug == "cosmic-structure":
        phases = [rng.uniform(0, 2 * math.pi) for _ in range(6)]
        initial = [p["amplitude"] * sum(math.sin(2 * math.pi * (k + 1) * pos + phase) / (k + 1) for k, phase in enumerate(phases)) / 2.45 for pos in x]
        curve("Initial contrast", initial)
        curve("Grown contrast", [v * p["growth"] for v in initial])
        metrics = {"Growth factor": p["growth"], "Final RMS contrast": math.sqrt(sum((v * p["growth"]) ** 2 for v in initial) / len(initial))}
        x_label, y_label = "Position (periodic domain)", "Density contrast δ"
    elif slug == "fusion":
        def gamow(energy):
            return math.exp(-2 * math.pi / 137.035999 * math.sqrt(469136.044 / (2 * energy)))
        x = [1 + i / 127 * 99 for i in range(128)]
        curve("Gamow penetration factor", [gamow(energy) for energy in x])
        metrics = {"Penetration factor at selected energy": gamow(p["energy"])}
        x_label, y_label = "Collision energy (keV)", "Dimensionless penetration factor"
    else:
        signal = [math.sin(2 * math.pi * p["frequency"] * i / 128) + rng.gauss(0, p["noise"]) for i in range(128)]
        x = [float(k) for k in range(65)]
        magnitude = [abs(sum(value * complex(math.cos(-2 * math.pi * k * j / 128), math.sin(-2 * math.pi * k * j / 128)) for j, value in enumerate(signal))) / 128 * (1 if k in (0, 64) else 2) for k in range(65)]
        curve("Single-sided amplitude", magnitude)
        metrics = {"Peak frequency (Hz)": float(max(range(1, 65), key=lambda k: magnitude[k])), "Sample rate (Hz)": 128, "Signal samples": 128}
        x_label, y_label = "Frequency (Hz)", "Amplitude"
    explanations = {
        "double-slit": f"Which-path information is {'on: the interference term vanishes, leaving the diffraction envelope' if p.get('which_path') else 'off: the coherent interference term modulates the diffraction envelope'}. Counts are finite seeded samples; the expected curve is the model distribution, not another measurement.",
        "tunnelling": "Transmission is calculated by matching a stationary wave across a rectangular barrier. Below-barrier transmission decreases with width. Above-barrier reflection and resonances can also occur; this is not a particle trajectory.",
        "hydrogen": "The 1s radial density includes the spherical-shell volume factor: it vanishes at radius zero and peaks at one Bohr radius. The emission line is a separate energy-level calculation; it does not represent a changing electron orbit.",
        "oscillator": f"The selected stationary state has energy {p.get('state', 0) + .5:g} hbar omega. Nodes in probability density depend on the state index; the nonzero ground-state energy is the zero-point energy of this ideal model.",
        "bell": "The ideal value comes from singlet correlations at the selected angles and visibility. The sampled value uses independent finite shots for four setting pairs. Compare it with the classical bound of 2 and the reported sampling standard error; this software does not close experimental Bell-test loopholes.",
        "lensing": "At a fixed distance measured in Schwarzschild radii, deflection is independent of mass. Changing mass changes the physical radius in kilometres. At a fixed physical impact distance instead, deflection would grow with mass.",
        "cosmic-structure": "Growth rescales the initial synthetic field without moving its peaks or solving gravitational dynamics. Using the same seed preserves the initial phases, making parameter comparisons reproducible.",
        "fusion": "The penetration factor increases with collision energy. This factor alone excludes thermal averaging, nuclear matrix elements and the weak-interaction bottleneck, so it must not be read as a stellar reaction rate.",
        "spectrum": "The spectral peak estimates the dominant frequency in a synthetic 128-sample record. Noise can change the observed amplitudes and dominant bin. The sampling rate limits the available frequency range to 0–64 Hz.",
    }
    return {"lab": slug, "model_version": lab.version, "status": "completed", "execution": "classical-model", "seed": request.seed, "parameters": p, "x": x, "x_label": x_label, "y_label": y_label, "series": series, "metrics": metrics, "model_card": definition(lab), "interpretation": explanations[slug]}

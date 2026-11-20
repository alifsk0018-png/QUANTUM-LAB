"""AI-powered quantum computing tutor service (Q-ASSIST).

Supports configurable LLM providers (Gemini, OpenAI / OpenAI-compatible, Anthropic)
via backend environment variables and falls back to verified data-driven
educational explanations when no API key is configured or when an API request fails.
"""

import json
import logging
import os
from typing import Optional

import httpx
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

_DEFAULT_MODELS = {
    "gemini": "gemini-2.0-flash",
    "openai": "gpt-4o-mini",
    "anthropic": "claude-3-5-sonnet-latest",
}

_DEFAULT_URLS = {
    "openai": "https://api.openai.com/v1/chat/completions",
    "anthropic": "https://api.anthropic.com/v1/messages",
}


class AITutorService:
    """Generate quantum-computing explanations via a configurable LLM API or fallback."""

    def _get_config(self) -> tuple[str, str, str, str]:
        """Read current provider settings from environment variables."""
        provider = (os.getenv("AI_PROVIDER", "gemini") or "gemini").strip().lower()
        api_key = (os.getenv("AI_API_KEY", "") or "").strip()
        model = (os.getenv("AI_MODEL", "") or "").strip() or _DEFAULT_MODELS.get(
            provider, "gemini-2.0-flash"
        )
        env_url = (os.getenv("AI_API_URL", "") or "").strip()

        if provider == "gemini":
            api_url = (
                env_url
                or f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
            )
        elif provider == "openai":
            if env_url and "generativelanguage.googleapis.com" not in env_url:
                api_url = env_url
            else:
                api_url = _DEFAULT_URLS["openai"]
        elif provider == "anthropic":
            if env_url and "generativelanguage.googleapis.com" not in env_url:
                api_url = env_url
            else:
                api_url = _DEFAULT_URLS["anthropic"]
        else:
            api_url = env_url

        return provider, api_key, model, api_url

    @property
    def api_key(self) -> str:
        return self._get_config()[1]

    @property
    def provider(self) -> str:
        return self._get_config()[0]

    # ------------------------------------------------------------------ #
    #  System prompts                                                      #
    # ------------------------------------------------------------------ #

    @staticmethod
    def _build_system_prompt(context_type: str, level: str) -> str:
        base = (
            "You are Q-ASSIST, an expert quantum computing tutor embedded in QUANTUM LAB, "
            "an interactive scientific laboratory platform. Your explanations must be "
            "clear, accurate, and educational.\n"
            "STRICT SCIENTIFIC RULES:\n"
            "1. Clearly distinguish verified mathematical facts from pedagogical analogies or assumptions.\n"
            "2. NEVER invent simulation results; cite ONLY the provided verified simulator outputs.\n"
            "3. NEVER claim an experiment ran on real quantum hardware — all executions in QUANTUM LAB "
            "run on Qiskit software simulators (ideal statevector or noisy Aer simulator).\n"
            "4. Remember Qiskit uses little-endian bitstring ordering where the rightmost bit is q0.\n\n"
        )

        level_guidance = {
            "beginner": (
                "The student is a beginner. Use simple analogies, avoid jargon, "
                "and explain concepts step by step. Use everyday language."
            ),
            "intermediate": (
                "The student has some quantum computing background. You can use "
                "standard terminology (superposition, entanglement, Bloch sphere) "
                "but still explain non-obvious steps."
            ),
            "advanced": (
                "The student is advanced. You may use mathematical notation, "
                "discuss unitary matrices, reduced density matrices, and error channels "
                "in full rigour."
            ),
        }

        context_guidance = {
            "concept": "Explain the quantum computing concept the student asks about.",
            "circuit": (
                "Analyse the quantum circuit provided. Describe what each gate "
                "does and explain the expected mathematical state evolution."
            ),
            "results": (
                "Interpret the simulation results. Explain the probabilities, "
                "shot counts, statevector amplitudes, and what they reveal about the circuit."
            ),
            "chat": "Have a helpful conversational exchange about quantum computing.",
        }

        return (
            base
            + level_guidance.get(level, level_guidance["beginner"])
            + "\n\n"
            + context_guidance.get(context_type, context_guidance["chat"])
        )

    # ------------------------------------------------------------------ #
    #  Provider-specific HTTP calls                                        #
    # ------------------------------------------------------------------ #

    @staticmethod
    def _format_user_content(
        message: str,
        circuit_config: Optional[dict],
        simulation_results: Optional[dict],
    ) -> str:
        user_parts: list[str] = [message]
        if circuit_config:
            user_parts.append(
                f"\n\nVerified Circuit Configuration:\n```json\n{json.dumps(circuit_config, indent=2)}\n```"
            )
        if simulation_results:
            # Summarize large statevectors cleanly if > 32 entries to fit token budgets
            trimmed_results = dict(simulation_results)
            sv = trimmed_results.get("statevector")
            if isinstance(sv, list) and len(sv) > 32:
                trimmed_results["statevector"] = (
                    f"[{len(sv)} amplitudes omitted for brevity; use probabilities]"
                )
            user_parts.append(
                f"\n\nVerified Qiskit Software Simulator Output:\n```json\n{json.dumps(trimmed_results, indent=2)}\n```"
            )
        return "".join(user_parts)

    async def _call_gemini(
        self,
        api_url: str,
        api_key: str,
        system_prompt: str,
        user_content: str,
        conversation_history: Optional[list[dict]],
    ) -> str:
        contents: list[dict] = []
        if conversation_history:
            for entry in conversation_history[-10:]:
                role = entry.get("role", "user")
                parts_text = entry.get("content", entry.get("text", ""))
                if parts_text:
                    contents.append(
                        {
                            "role": "user" if role == "user" else "model",
                            "parts": [{"text": parts_text}],
                        }
                    )
        contents.append({"role": "user", "parts": [{"text": user_content}]})

        payload = {
            "system_instruction": {"parts": [{"text": system_prompt}]},
            "contents": contents,
            "generationConfig": {
                "temperature": 0.6,
                "maxOutputTokens": 2048,
            },
        }
        url = f"{api_url}?key={api_key}"
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
            data = resp.json()

        candidates = data.get("candidates", [])
        if candidates:
            parts = candidates[0].get("content", {}).get("parts", [])
            text = " ".join(p.get("text", "") for p in parts).strip()
            if text:
                return text
        raise ValueError("Empty response from Gemini API.")

    async def _call_openai(
        self,
        api_url: str,
        api_key: str,
        model: str,
        system_prompt: str,
        user_content: str,
        conversation_history: Optional[list[dict]],
    ) -> str:
        messages: list[dict] = [{"role": "system", "content": system_prompt}]
        if conversation_history:
            for entry in conversation_history[-10:]:
                role = entry.get("role", "user")
                text = entry.get("content", entry.get("text", ""))
                if text:
                    messages.append(
                        {
                            "role": "user" if role == "user" else "assistant",
                            "content": text,
                        }
                    )
        messages.append({"role": "user", "content": user_content})

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": model,
            "messages": messages,
            "temperature": 0.6,
            "max_tokens": 2048,
        }
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(api_url, headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()

        choices = data.get("choices", [])
        if choices:
            text = choices[0].get("message", {}).get("content", "").strip()
            if text:
                return text
        raise ValueError("Empty response from OpenAI-compatible API.")

    async def _call_anthropic(
        self,
        api_url: str,
        api_key: str,
        model: str,
        system_prompt: str,
        user_content: str,
        conversation_history: Optional[list[dict]],
    ) -> str:
        messages: list[dict] = []
        if conversation_history:
            for entry in conversation_history[-10:]:
                role = entry.get("role", "user")
                text = entry.get("content", entry.get("text", ""))
                if text:
                    messages.append(
                        {
                            "role": "user" if role == "user" else "assistant",
                            "content": text,
                        }
                    )
        messages.append({"role": "user", "content": user_content})

        headers = {
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
        }
        payload = {
            "model": model,
            "system": system_prompt,
            "messages": messages,
            "max_tokens": 2048,
        }
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(api_url, headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()

        content_blocks = data.get("content", [])
        text = " ".join(
            b.get("text", "") for b in content_blocks if b.get("type") == "text"
        ).strip()
        if text:
            return text
        raise ValueError("Empty response from Anthropic API.")

    # ------------------------------------------------------------------ #
    #  Public generation entry point                                       #
    # ------------------------------------------------------------------ #

    async def generate_explanation(
        self,
        message: str,
        context_type: str = "chat",
        circuit_config: Optional[dict] = None,
        simulation_results: Optional[dict] = None,
        level: str = "beginner",
        conversation_history: Optional[list[dict]] = None,
    ) -> dict:
        """Return {"explanation": ..., "is_ai_generated": bool, "suggestions": [...]}."""
        provider, api_key, model, api_url = self._get_config()

        if not api_key:
            return self._fallback_explanation(
                message,
                context_type,
                level,
                circuit_config,
                simulation_results,
                fallback_reason="not_configured",
            )

        system_prompt = self._build_system_prompt(context_type, level)
        user_content = self._format_user_content(
            message, circuit_config, simulation_results
        )

        try:
            if provider == "gemini":
                explanation = await self._call_gemini(
                    api_url, api_key, system_prompt, user_content, conversation_history
                )
            elif provider == "openai":
                explanation = await self._call_openai(
                    api_url,
                    api_key,
                    model,
                    system_prompt,
                    user_content,
                    conversation_history,
                )
            elif provider == "anthropic":
                explanation = await self._call_anthropic(
                    api_url,
                    api_key,
                    model,
                    system_prompt,
                    user_content,
                    conversation_history,
                )
            else:
                raise ValueError(f"Unsupported AI_PROVIDER '{provider}'.")

            return {
                "explanation": explanation,
                "is_ai_generated": True,
                "suggestions": self._generate_suggestions(context_type, level),
            }

        except Exception as exc:
            logger.error("AI API call (%s) failed: %s", provider, exc)
            return self._fallback_explanation(
                message,
                context_type,
                level,
                circuit_config,
                simulation_results,
                fallback_reason="api_unavailable",
            )

    # ------------------------------------------------------------------ #
    #  Circuit-specific helper                                             #
    # ------------------------------------------------------------------ #

    async def explain_circuit(
        self,
        circuit_config: dict,
        simulation_results: Optional[dict] = None,
        level: str = "beginner",
    ) -> dict:
        """High-level helper that formats a circuit explanation prompt."""
        gate_names = [g.get("gate_name", "?") for g in circuit_config.get("gates", [])]
        num_qubits = circuit_config.get("num_qubits", 1)
        message = (
            f"Explain this {num_qubits}-qubit quantum circuit that uses the "
            f"gates: {', '.join(gate_names)}. What does it do and what output "
            f"should we expect?"
        )
        return await self.generate_explanation(
            message=message,
            context_type="circuit",
            circuit_config=circuit_config,
            simulation_results=simulation_results,
            level=level,
        )

    # ------------------------------------------------------------------ #
    #  Circuit diagnostics & non-AI educational fallback                   #
    # ------------------------------------------------------------------ #

    @staticmethod
    def _diagnose_circuit(circuit_config: dict) -> list[str]:
        """Inspect a circuit structure per qubit for common mistakes."""
        nq = circuit_config.get("num_qubits", 1)
        initial_state = circuit_config.get("initial_state") or ("0" * nq)
        gates = circuit_config.get("gates", [])
        issues: list[str] = []

        if not gates:
            issues.append(
                "Your circuit has no gates yet — all qubits remain in their initial computational basis state."
            )
            return issues

        # Track whether a qubit is known to remain deterministically in |0>
        definitely_zero = [
            (initial_state[q] == "0") if q < len(initial_state) else True
            for q in range(nq)
        ]
        # Track last single-qubit gate and last 2-qubit gate signature for consecutive cancellations
        last_1q: dict[int, str] = {}
        last_multi_sig: Optional[tuple] = None

        for idx, g in enumerate(gates):
            name = (g.get("gate_name") or "").upper()
            if name == "CNOT":
                name = "CX"
            elif name == "TOFFOLI":
                name = "CCX"
            targets = g.get("target_qubits") or []
            controls = g.get("control_qubits") or []

            if len(controls) == 0 and len(targets) == 1:
                q = targets[0]
                if name in ("H", "X", "Y", "Z") and last_1q.get(q) == name:
                    issues.append(
                        f"Steps around gate #{idx + 1}: consecutive `{name}` gates on `q{q}` cancel out (`{name}² = I`)."
                    )
                    last_1q.pop(q, None)
                elif name == "S" and last_1q.get(q) == "S":
                    issues.append(
                        f"Gate #{idx + 1}: two consecutive `S` gates on `q{q}` simplify to a single `Z` gate (`S² = Z`)."
                    )
                    last_1q[q] = name
                else:
                    last_1q[q] = name
                last_multi_sig = None

                if name != "I" and name != "Z" and name != "S" and name != "T" and name != "RZ":
                    if 0 <= q < nq:
                        definitely_zero[q] = False
            else:
                # Multi-qubit gate
                sig = (name, tuple(controls), tuple(targets))
                if name in ("CX", "CZ", "SWAP", "CCX") and sig == last_multi_sig:
                    issues.append(
                        f"Gate #{idx + 1}: consecutive identical `{name}` gates on the same qubits cancel out (`{name}² = I`)."
                    )
                    last_multi_sig = None
                else:
                    last_multi_sig = sig

                # Check if a controlled gate is triggered when a control qubit is still |0>
                if name in ("CX", "CZ", "CCX"):
                    inactive = [
                        f"q{c}" for c in controls if 0 <= c < nq and definitely_zero[c]
                    ]
                    if inactive:
                        issues.append(
                            f"Gate #{idx + 1} (`{name}`): control qubit(s) {', '.join(inactive)} are still deterministically `|0⟩`, so the controlled operation will not trigger. Apply `X` or `H` to excite the control first."
                        )

                for q in controls + targets:
                    last_1q.pop(q, None)
                if name == "CX" and controls and targets:
                    c0, t0 = controls[0], targets[0]
                    if 0 <= c0 < nq and 0 <= t0 < nq and not definitely_zero[c0]:
                        definitely_zero[t0] = False
                elif name == "SWAP" and len(targets) == 2:
                    a, b = targets
                    if 0 <= a < nq and 0 <= b < nq:
                        definitely_zero[a], definitely_zero[b] = (
                            definitely_zero[b],
                            definitely_zero[a],
                        )
                elif name == "CCX" and len(controls) == 2 and targets:
                    c0, c1, t0 = controls[0], controls[1], targets[0]
                    if (
                        0 <= c0 < nq
                        and 0 <= c1 < nq
                        and 0 <= t0 < nq
                        and not definitely_zero[c0]
                        and not definitely_zero[c1]
                    ):
                        definitely_zero[t0] = False

        if not issues:
            issues.append(
                "No structural redundancies or inactive-control issues detected. Note: Qiskit labels bitstrings in little-endian order (rightmost bit is q0)."
            )
        return issues

    def _fallback_explanation(
        self,
        message: str,
        context_type: str,
        level: str,
        circuit_config: Optional[dict] = None,
        simulation_results: Optional[dict] = None,
        fallback_reason: str = "not_configured",
    ) -> dict:
        """Return verified data-driven educational reference when AI API is unconfigured or unavailable."""
        msg_lower = message.lower()
        if fallback_reason == "api_unavailable":
            header = (
                f"⚠️ **AI API Unavailable — Verified Educational Reference ({level.capitalize()} Mode)**\n"
                "Notice: The configured LLM API request failed or could not be reached. "
                "Displaying verified Qiskit simulator analysis and curated educational references instead.\n\n"
            )
        else:
            header = (
                f"📚 **Educational Reference Mode — AI API Not Configured ({level.capitalize()} Mode)**\n"
                "Note: Live LLM responses require setting `AI_API_KEY` in `backend/.env`. "
                "All circuit analysis below uses verified simulator data and deterministic physics rules.\n\n"
            )

        wants_circuit_or_results = context_type in ("circuit", "results") or any(
            k in msg_lower
            for k in ("my circuit", "my result", "debug", "analyze", "analyse", "explain this")
        )

        if wants_circuit_or_results and (circuit_config or simulation_results):
            lines: list[str] = [header]
            if circuit_config:
                nq = circuit_config.get("num_qubits", 1)
                init_state = circuit_config.get("initial_state") or ("0" * nq)
                gates = circuit_config.get("gates", [])
                gate_summary = (
                    ", ".join(
                        f"{g.get('gate_name')}({','.join(map(str, (g.get('control_qubits') or []) + (g.get('target_qubits') or [])))})"
                        for g in gates
                    )
                    or "None (identity circuit)"
                )
                lines.append(
                    f"### Verified Circuit Summary\n"
                    f"- **Qubits:** {nq} (Hilbert space dimension $2^{{{nq}}} = {1 << nq}$)\n"
                    f"- **Initial Basis State:** `|{init_state}⟩` (qubit order `q0..q{nq - 1}`)\n"
                    f"- **Gate Count:** {len(gates)}\n"
                    f"- **Gate Sequence:** `{gate_summary}`\n"
                )
                gate_names = [g.get("gate_name", "").upper() for g in gates]
                if "H" in gate_names and ("CX" in gate_names or "CNOT" in gate_names):
                    lines.append(
                        "- **Mathematical Fact:** Combining Hadamard (`H`) superposition with `CX` creates entanglement when control qubits are in superposition, meaning single-qubit reduced states become mixed and a single-qubit Bloch sphere cannot capture cross-qubit correlations.\n"
                    )
                elif "H" in gate_names:
                    lines.append(
                        "- **Mathematical Fact:** The Hadamard (`H`) gate maps computational basis states into equal-magnitude superpositions (`(|0⟩ ± |1⟩)/√2`).\n"
                    )

                if "debug" in msg_lower or context_type == "circuit":
                    issues = self._diagnose_circuit(circuit_config)
                    lines.append(
                        "### Circuit Diagnostics\n" + "\n".join(f"- {i}" for i in issues) + "\n"
                    )

            if simulation_results:
                mode = simulation_results.get("simulation_mode", "ideal")
                probs = simulation_results.get("probabilities", {})
                meas = simulation_results.get("measurements", {})
                meta = simulation_results.get("metadata", {}) or {}
                total_shots = sum(meas.values()) if meas else 0
                backend_name = meta.get("backend", "Qiskit software simulator")
                lines.append(
                    f"### Verified Simulator Output (`{backend_name}` — `{mode.upper()}` mode)\n"
                )
                if probs:
                    top_states = sorted(probs.items(), key=lambda kv: kv[1], reverse=True)[:8]
                    for state, prob in top_states:
                        cnt = meas.get(state, 0)
                        lines.append(
                            f"- **|{state}⟩**: probability = `{prob * 100:.2f}%` (sampled counts: `{cnt}/{total_shots}`)"
                        )
                if mode == "noisy" and meta.get("ideal_probabilities"):
                    lines.append(
                        "\n- **Noisy vs. Ideal Comparison:** Noise parameters "
                        f"(`gate_error={meta.get('gate_error', 0.01)}`, "
                        f"`measurement_error={meta.get('measurement_error', 0.01)}`) "
                        "introduce probability leakage relative to the ideal distribution."
                    )
                lines.append(
                    "\n*Scientific Integrity Note: All figures above were computed on a Qiskit software simulator, not physical quantum hardware.*"
                )

            return {
                "explanation": "\n".join(lines),
                "is_ai_generated": False,
                "suggestions": self._generate_suggestions(context_type, level),
            }

        if "suggest" in msg_lower and "experiment" in msg_lower:
            return {
                "explanation": (
                    header
                    + "### Suggested Experiments to Try in QUANTUM LAB\n"
                    "1. **Superposition (`H` on q0):** Observe 50%/50% probabilities and finite-shot sampling variance.\n"
                    "2. **Bell State Entanglement (`H` on q0, `CX` q0→q1):** Verify perfect correlation between `|00⟩` and `|11⟩`, then switch to **Noisy Mode** to see `|01⟩` and `|10⟩` error leakage.\n"
                    "3. **Quantum Interference (`H → Z → H` on q0):** Watch destructive interference completely eliminate `|0⟩` and yield 100% `|1⟩`.\n"
                    "4. **2-Qubit Grover's Search:** Run the preset in Quantum Experiments to amplify `|11⟩` to 100% in a single oracle query.\n"
                    "5. **Quantum Teleportation (3 Qubits):** Prepare an arbitrary state on `q0` with `RY(π/3)` and verify `q2` reproduces its `75% |0⟩ / 25% |1⟩` statistics."
                ),
                "is_ai_generated": False,
                "suggestions": self._generate_suggestions("chat", level),
            }

        explanations: dict[str, str] = {
            "superposition": (
                header
                + "**Superposition** is a core principle of quantum mechanics. "
                "A classical bit is always either 0 or 1, whereas a qubit exists in a "
                "coherent linear combination of both basis states.\n\n"
                "Mathematically, a pure single-qubit state is written as `|ψ⟩ = α|0⟩ + β|1⟩`, where "
                "`α` and `β` are complex amplitudes satisfying `|α|² + |β|² = 1`.\n\n"
                "Upon measurement in the computational basis, the state collapses to `|0⟩` with "
                "probability `|α|²` or to `|1⟩` with probability `|β|²`.\n\n"
                "**Example:** Applying Hadamard (`H`) to `|0⟩` creates `(|0⟩ + |1⟩)/√2` — an equal "
                "superposition with 50% probability for `|0⟩` and 50% for `|1⟩`."
            ),
            "entanglement": (
                header
                + "**Quantum Entanglement** occurs when two or more qubits share a joint quantum state "
                "that cannot be factored into independent single-qubit states `|ψ_A⟩ ⊗ |ψ_B⟩`.\n\n"
                "The canonical Bell state is `|Φ⁺⟩ = (|00⟩ + |11⟩)/√2`. Measuring either qubit gives 0 or 1 "
                "with 50% probability, yet both qubits always agree on the outcome.\n\n"
                "**How to build it:** Apply `H` to `q0`, then `CX` with control `q0` and target `q1`. "
                "Because the individual qubits are maximally mixed (`purity = 0.5`), use the **Q-Sphere** or "
                "**Statevector** viewer rather than a single-qubit Bloch sphere to inspect the full state."
            ),
            "gate": (
                header
                + "**Quantum Gates** are reversible unitary transformations (`U†U = I`) acting on qubits.\n\n"
                "- **Pauli-X (NOT):** Flips `|0⟩ ↔ |1⟩` (π rotation around X).\n"
                "- **Hadamard (H):** Maps `|0⟩ → (|0⟩+|1⟩)/√2` and `|1⟩ → (|0⟩−|1⟩)/√2`.\n"
                "- **Pauli-Z / S / T:** Add relative phases (`π`, `π/2`, `π/4`) to `|1⟩`.\n"
                "- **Rotations (RX, RY, RZ):** Continuous rotations by angle `θ` around Bloch axes.\n"
                "- **Multi-qubit (CX, CZ, SWAP, CCX):** Create conditional logic and entanglement."
            ),
            "measurement": (
                header
                + "**Measurement** extracts classical outcomes from a quantum register according to the **Born rule**: "
                "outcome `|x⟩` occurs with probability `P(x) = |⟨x|ψ⟩|²`.\n\n"
                "Projective measurement collapses the superposition irreversibly, so quantum circuits are executed "
                "over many **shots** (e.g., 1024 shots) to estimate the underlying probability distribution."
            ),
            "algorithm": (
                header
                + "**Quantum Algorithms** use superposition, entanglement, and interference so valid computational "
                "paths reinforce constructively while invalid paths cancel out.\n\n"
                "- **Grover's Search:** Amplifies marked items in `O(√N)` oracle queries vs `O(N)` classically.\n"
                "- **Quantum Teleportation:** Transfers an unknown quantum state using a shared Bell pair and 2 classical bits.\n"
                "- **Shor's & QFT:** Period finding and phase estimation via quantum Fourier transforms."
            ),
        }

        for keyword, text in explanations.items():
            if keyword in msg_lower:
                return {
                    "explanation": text,
                    "is_ai_generated": False,
                    "suggestions": self._generate_suggestions(context_type, level),
                }

        return {
            "explanation": (
                header
                + "Quantum computing leverages **superposition**, **entanglement**, and **quantum interference** "
                "to manipulate probability amplitudes across a `2^N`-dimensional state space.\n\n"
                "You can ask Q-ASSIST to:\n"
                "- **Explain My Circuit** — analyse gates in your active circuit\n"
                "- **Explain My Results** — interpret verified probabilities and shot counts\n"
                "- **Debug My Circuit** — check for gate cancellations or inactive controls\n"
                "- **Explain concepts** like superposition, entanglement, interference, Grover's search, or quantum noise."
            ),
            "is_ai_generated": False,
            "suggestions": self._generate_suggestions(context_type, level),
        }

    # ------------------------------------------------------------------ #
    #  Suggestions                                                         #
    # ------------------------------------------------------------------ #

    @staticmethod
    def _generate_suggestions(context_type: str, level: str) -> list[str]:
        suggestions_map = {
            "concept": [
                "What is superposition?",
                "How does entanglement work?",
                "Why can't a Bloch sphere show an entangled Bell state?",
                "How does Grover's search beat classical search?",
            ],
            "circuit": [
                "Debug my circuit for mistakes or cancellations",
                "What output probabilities should I expect?",
                "How would noise affect this circuit?",
            ],
            "results": [
                "Why do shot counts differ slightly from theoretical probabilities?",
                "What do the statevector phases tell us?",
                "Compare ideal vs. noisy execution for this circuit",
            ],
            "chat": [
                "Explain my circuit",
                "Explain my results",
                "Suggest an experiment",
                "How does quantum teleportation work?",
            ],
        }
        return suggestions_map.get(context_type, suggestions_map["chat"])

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  checkHealth,
  extractApiError,
  runSimulation,
  validateCircuit,
} from '../services/api';

const QuantumContext = createContext(null);

let _uidCounter = 1;
function attachUid(gate) {
  return {
    _uid: gate._uid || `g_${Date.now()}_${_uidCounter++}`,
    gate_name: (gate.gate_name || gate.gate || 'I').toUpperCase(),
    target_qubits: Array.isArray(gate.target_qubits) ? [...gate.target_qubits] : [0],
    control_qubits: Array.isArray(gate.control_qubits) ? [...gate.control_qubits] : [],
    parameters: gate.parameters ? { ...gate.parameters } : {},
  };
}

export function serializeCircuitConfig(circuit) {
  const numQubits = Math.min(8, Math.max(1, Number(circuit?.num_qubits || 2)));
  const rawInit = circuit?.initial_state || '0'.repeat(numQubits);
  const normalizedInit = rawInit
    .padEnd(numQubits, '0')
    .slice(0, numQubits)
    .replace(/[^01]/g, '0');

  return {
    num_qubits: numQubits,
    initial_state: normalizedInit,
    gates: (circuit?.gates || []).map((g) => ({
      gate_name: g.gate_name,
      target_qubits: [...(g.target_qubits || [])],
      control_qubits: [...(g.control_qubits || [])],
      parameters: g.parameters ? { ...g.parameters } : {},
    })),
  };
}

const INITIAL_CIRCUIT = {
  num_qubits: 2,
  initial_state: '00',
  gates: [
    attachUid({ gate_name: 'H', target_qubits: [0], control_qubits: [], parameters: {} }),
    attachUid({ gate_name: 'CX', target_qubits: [1], control_qubits: [0], parameters: {} }),
  ],
};

const DEFAULT_SIM_CONFIG = {
  simulation_mode: 'ideal',
  num_shots: 1024,
  noise_params: {
    gate_error: 0.01,
    measurement_error: 0.01,
  },
  seed: '',
};

export function QuantumProvider({ children }) {
  const [circuit, setCircuit] = useState(INITIAL_CIRCUIT);
  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);

  const [simConfig, setSimConfigState] = useState(DEFAULT_SIM_CONFIG);
  const [simulationResult, setSimulationResult] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [validationResult, setValidationResult] = useState({ valid: true, errors: [] });
  const [backendHealth, setBackendHealth] = useState(null);
  const [notifications, setNotifications] = useState([
    {
      id: 'welcome',
      title: 'QUANTUM LAB Ready',
      message: 'Qiskit circuit builder and simulator workspace initialized.',
      time: new Date().toISOString(),
      read: false,
    },
  ]);

  const pushNotification = useCallback((title, message) => {
    setNotifications((prev) => [
      {
        id: `n_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        title,
        message,
        time: new Date().toISOString(),
        read: false,
      },
      ...prev.slice(0, 19),
    ]);
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const refreshHealth = useCallback(async () => {
    try {
      const data = await checkHealth();
      setBackendHealth({ ...data, online: true });
      return data;
    } catch {
      setBackendHealth({ online: false, status: 'offline' });
      return null;
    }
  }, []);

  useEffect(() => {
    refreshHealth();
  }, [refreshHealth]);

  // Helper to mutate circuit with undo/redo support
  const commitCircuitChange = useCallback((updater) => {
    setCircuit((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      setPast((p) => [...p.slice(-49), prev]);
      setFuture([]);
      return next;
    });
  }, []);

  // Validate active circuit against backend whenever it changes
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const res = await validateCircuit(serializeCircuitConfig(circuit));
        if (!cancelled) setValidationResult(res);
      } catch {
        // Keep current status if backend is temporarily unreachable
      }
    }, 150);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [circuit]);

  const setNumQubits = useCallback(
    (newCount) => {
      const n = Math.min(8, Math.max(1, Number(newCount)));
      commitCircuitChange((prev) => {
        const prevInit = prev.initial_state || '0'.repeat(prev.num_qubits);
        const nextInit = prevInit.padEnd(n, '0').slice(0, n);
        // Drop gates that reference out-of-range qubits
        const filteredGates = prev.gates.filter((g) => {
          const used = [...(g.target_qubits || []), ...(g.control_qubits || [])];
          return used.every((q) => q >= 0 && q < n);
        });
        return {
          num_qubits: n,
          initial_state: nextInit,
          gates: filteredGates,
        };
      });
      setSimulationResult(null);
    },
    [commitCircuitChange]
  );

  const toggleInitialBit = useCallback(
    (qubitIdx) => {
      commitCircuitChange((prev) => {
        const chars = (prev.initial_state || '0'.repeat(prev.num_qubits))
          .padEnd(prev.num_qubits, '0')
          .split('');
        if (qubitIdx >= 0 && qubitIdx < prev.num_qubits) {
          chars[qubitIdx] = chars[qubitIdx] === '1' ? '0' : '1';
        }
        return { ...prev, initial_state: chars.join('') };
      });
    },
    [commitCircuitChange]
  );

  const setInitialState = useCallback(
    (stateString) => {
      commitCircuitChange((prev) => ({
        ...prev,
        initial_state: stateString.padEnd(prev.num_qubits, '0').slice(0, prev.num_qubits),
      }));
    },
    [commitCircuitChange]
  );

  const addGate = useCallback(
    (gate, insertIndex = null) => {
      const prepared = attachUid(gate);
      commitCircuitChange((prev) => {
        const gates = [...prev.gates];
        if (insertIndex === null || insertIndex < 0 || insertIndex > gates.length) {
          gates.push(prepared);
        } else {
          gates.splice(insertIndex, 0, prepared);
        }
        return { ...prev, gates };
      });
    },
    [commitCircuitChange]
  );

  const updateGate = useCallback(
    (index, updates) => {
      commitCircuitChange((prev) => {
        const gates = prev.gates.map((g, idx) =>
          idx === index ? { ...g, ...updates } : g
        );
        return { ...prev, gates };
      });
    },
    [commitCircuitChange]
  );

  const removeGate = useCallback(
    (index) => {
      commitCircuitChange((prev) => ({
        ...prev,
        gates: prev.gates.filter((_, idx) => idx !== index),
      }));
    },
    [commitCircuitChange]
  );

  const moveGate = useCallback(
    (fromIndex, toIndex) => {
      if (fromIndex === toIndex) return;
      commitCircuitChange((prev) => {
        const gates = [...prev.gates];
        if (
          fromIndex < 0 ||
          fromIndex >= gates.length ||
          toIndex < 0 ||
          toIndex >= gates.length
        ) {
          return prev;
        }
        const [item] = gates.splice(fromIndex, 1);
        gates.splice(toIndex, 0, item);
        return { ...prev, gates };
      });
    },
    [commitCircuitChange]
  );

  const loadCircuit = useCallback(
    (nextConfig, clearResults = true) => {
      const numQubits = Math.min(8, Math.max(1, Number(nextConfig.num_qubits || 1)));
      const init = (nextConfig.initial_state || '0'.repeat(numQubits))
        .padEnd(numQubits, '0')
        .slice(0, numQubits);
      const gates = (nextConfig.gates || []).map(attachUid);

      commitCircuitChange({
        num_qubits: numQubits,
        initial_state: init,
        gates,
      });
      if (clearResults) {
        setSimulationResult(null);
      }
    },
    [commitCircuitChange]
  );

  const resetCircuit = useCallback(
    (keepQubits = true) => {
      commitCircuitChange((prev) => {
        const n = keepQubits ? prev.num_qubits : 2;
        return {
          num_qubits: n,
          initial_state: '0'.repeat(n),
          gates: [],
        };
      });
      setSimulationResult(null);
    },
    [commitCircuitChange]
  );

  const undo = useCallback(() => {
    setPast((prevPast) => {
      if (prevPast.length === 0) return prevPast;
      const previous = prevPast[prevPast.length - 1];
      setCircuit((curr) => {
        setFuture((f) => [curr, ...f.slice(0, 49)]);
        return previous;
      });
      return prevPast.slice(0, -1);
    });
  }, []);

  const redo = useCallback(() => {
    setFuture((prevFuture) => {
      if (prevFuture.length === 0) return prevFuture;
      const next = prevFuture[0];
      setCircuit((curr) => {
        setPast((p) => [...p.slice(-49), curr]);
        return next;
      });
      return prevFuture.slice(1);
    });
  }, []);

  const setSimConfig = useCallback((updates) => {
    setSimConfigState((prev) => ({
      ...prev,
      ...updates,
      noise_params: updates.noise_params
        ? { ...prev.noise_params, ...updates.noise_params }
        : prev.noise_params,
    }));
  }, []);

  const executeSimulation = useCallback(
    async (overrideCircuit = null, overrideSimConfig = null) => {
      const targetCircuit = serializeCircuitConfig(overrideCircuit || circuit);
      const cfg = overrideSimConfig ? { ...simConfig, ...overrideSimConfig } : simConfig;

      const parsedSeed =
        cfg.seed !== '' && cfg.seed !== null && cfg.seed !== undefined
          ? Number.parseInt(cfg.seed, 10)
          : null;

      const payload = {
        circuit: targetCircuit,
        simulation_mode: cfg.simulation_mode || 'ideal',
        num_shots: Math.min(10000, Math.max(1, Number(cfg.num_shots || 1024))),
        noise_params:
          cfg.simulation_mode === 'noisy'
            ? {
                gate_error: Number(cfg.noise_params?.gate_error ?? 0.01),
                measurement_error: Number(cfg.noise_params?.measurement_error ?? 0.01),
              }
            : null,
        seed: Number.isInteger(parsedSeed) ? parsedSeed : null,
      };

      setIsSimulating(true);
      try {
        const res = await runSimulation(payload);
        if (!overrideCircuit) {
          setSimulationResult(res);
        }
        pushNotification(
          'Simulation Complete',
          `${res.num_qubits}Q (${res.simulation_mode} mode, ${payload.num_shots} shots) completed in ${(res.execution_time * 1000).toFixed(1)} ms.`
        );
        return res;
      } catch (err) {
        const msg = extractApiError(err, 'Quantum simulation failed.');
        toast.error(msg);
        pushNotification('Simulation Error', msg);
        throw err;
      } finally {
        setIsSimulating(false);
      }
    },
    [circuit, simConfig, pushNotification]
  );

  return (
    <QuantumContext.Provider
      value={{
        circuit,
        serializedCircuit: serializeCircuitConfig(circuit),
        setNumQubits,
        toggleInitialBit,
        setInitialState,
        addGate,
        updateGate,
        removeGate,
        moveGate,
        loadCircuit,
        resetCircuit,
        undo,
        redo,
        canUndo: past.length > 0,
        canRedo: future.length > 0,
        simConfig,
        setSimConfig,
        simulationResult,
        setSimulationResult,
        isSimulating,
        executeSimulation,
        validationResult,
        backendHealth,
        refreshHealth,
        notifications,
        pushNotification,
        markAllNotificationsRead,
      }}
    >
      {children}
    </QuantumContext.Provider>
  );
}

export function useQuantum() {
  const ctx = useContext(QuantumContext);
  if (!ctx) {
    throw new Error('useQuantum must be used inside QuantumProvider');
  }
  return ctx;
}

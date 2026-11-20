import { useQuantum } from '../context/QuantumContext';

/**
 * Custom hook exposing active quantum circuit state and editing operations.
 */
export default function useCircuit() {
  const {
    circuit,
    serializedCircuit,
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
    canUndo,
    canRedo,
    validationResult,
  } = useQuantum();

  return {
    circuit,
    serializedCircuit,
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
    canUndo,
    canRedo,
    validationResult,
  };
}

import { useQuantum } from '../context/QuantumContext';

/**
 * Custom hook exposing Qiskit simulation controls and execution results.
 */
export default function useSimulation() {
  const {
    simConfig,
    setSimConfig,
    simulationResult,
    setSimulationResult,
    isSimulating,
    executeSimulation,
  } = useQuantum();

  return {
    simConfig,
    setSimConfig,
    simulationResult,
    setSimulationResult,
    isSimulating,
    executeSimulation,
  };
}

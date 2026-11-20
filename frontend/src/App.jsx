import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './context/ThemeContext';
import { QuantumProvider } from './context/QuantumContext';
import ErrorBoundary from './components/ui/ErrorBoundary';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard';
import QuantumLab from './pages/QuantumLab';
import CircuitBuilder from './pages/CircuitBuilder';
import QuantumExperiments from './pages/QuantumExperiments';
import QuantumVisualizer from './pages/QuantumVisualizer';
import AITutor from './pages/AITutor';
import LearningAcademy from './pages/LearningAcademy';
import ResearchWorkspace from './pages/ResearchWorkspace';
import SavedExperiments from './pages/SavedExperiments';
import Settings from './pages/Settings';

export default function App() {
  return (
    <ErrorBoundary fallbackTitle="QUANTUM LAB Application Error">
      <ThemeProvider>
        <QuantumProvider>
          <BrowserRouter>
            <MainLayout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/laboratory" element={<QuantumLab />} />
                <Route path="/circuit-builder" element={<CircuitBuilder />} />
                <Route path="/experiments" element={<QuantumExperiments />} />
                <Route path="/visualizer" element={<QuantumVisualizer />} />
                <Route path="/tutor" element={<AITutor />} />
                <Route path="/academy" element={<LearningAcademy />} />
                <Route path="/research" element={<ResearchWorkspace />} />
                <Route path="/saved" element={<SavedExperiments />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </MainLayout>
          </BrowserRouter>

          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#0f172a',
                color: '#e2e8f0',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                fontSize: '13px',
              },
            }}
          />
        </QuantumProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

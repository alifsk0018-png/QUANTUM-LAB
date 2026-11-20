import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Award,
  BookOpen,
  CheckCircle2,
  FlaskConical,
  GraduationCap,
  HelpCircle,
  Trophy,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  extractApiError,
  getLearningModules,
  getLearningProgress,
  submitQuiz,
  visitLesson,
} from '../services/api';
import { useQuantum } from '../context/QuantumContext';
import CircuitDiagram from '../components/visualizations/CircuitDiagram';

export default function LearningAcademy() {
  const navigate = useNavigate();
  const { loadCircuit } = useQuantum();

  const [modules, setModules] = useState([]);
  const [progress, setProgress] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedModuleId, setSelectedModuleId] = useState('beginner');
  const [selectedLessonId, setSelectedLessonId] = useState(null);
  const [answers, setAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [modRes, progRes] = await Promise.all([
        getLearningModules(),
        getLearningProgress(),
      ]);
      const mods = modRes.modules || [];
      setModules(mods);
      setProgress(progRes.progress || []);
      setAchievements(progRes.achievements || []);
      setStats(progRes.stats || null);

      if (mods.length > 0 && !selectedLessonId) {
        const firstMod = mods.find((m) => m.id === selectedModuleId) || mods[0];
        setSelectedModuleId(firstMod.id);
        if (firstMod.lessons?.length > 0) {
          setSelectedLessonId(firstMod.lessons[0].id);
        }
      }
    } catch (err) {
      toast.error(extractApiError(err, 'Failed to load Learning Academy curriculum.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const currentModule = useMemo(
    () => modules.find((m) => m.id === selectedModuleId) || modules[0] || null,
    [modules, selectedModuleId]
  );

  const currentLesson = useMemo(() => {
    if (!currentModule) return null;
    return (
      currentModule.lessons.find((l) => l.id === selectedLessonId) ||
      currentModule.lessons[0] ||
      null
    );
  }, [currentModule, selectedLessonId]);

  const progressMap = useMemo(() => {
    const map = {};
    for (const p of progress) {
      map[`${p.module_id}:${p.lesson_id}`] = p;
    }
    return map;
  }, [progress]);

  const handleSelectLesson = async (modId, lessonId) => {
    setSelectedModuleId(modId);
    setSelectedLessonId(lessonId);
    setAnswers({});
    setQuizResult(null);
    try {
      await visitLesson(modId, lessonId);
    } catch {
      // Non-fatal visit tracking
    }
  };

  const handleQuizSubmit = async (e) => {
    e.preventDefault();
    if (!currentModule || !currentLesson?.quiz) return;
    const quiz = currentLesson.quiz;
    const unanswered = quiz.questions.some((q) => answers[q.id] === undefined);
    if (unanswered) {
      toast.error('Please answer all quiz questions before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitQuiz({
        module_id: currentModule.id,
        quiz_id: quiz.id,
        answers,
      });
      setQuizResult(res);
      if (res.passed) {
        toast.success(`Quiz passed! Score: ${res.percentage}%`);
      } else {
        toast.error(`Score ${res.percentage}% — ${quiz.passing_score}% required to master this lesson.`);
      }
      const progRes = await getLearningProgress();
      setProgress(progRes.progress || []);
      setAchievements(progRes.achievements || []);
      setStats(progRes.stats || null);
    } catch (err) {
      toast.error(extractApiError(err, 'Failed to submit quiz.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleTryCircuit = (circuitJson) => {
    try {
      const cfg = JSON.parse(circuitJson);
      loadCircuit(
        {
          num_qubits: cfg.num_qubits || 1,
          initial_state: '0'.repeat(cfg.num_qubits || 1),
          gates: cfg.gates || [],
        },
        true
      );
      navigate('/laboratory');
    } catch {
      toast.error('Could not load example circuit.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header + Stats */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--lab-text)]">
            AI-Guided Quantum Learning Academy
          </h1>
          <p className="text-xs sm:text-sm text-[var(--lab-muted)]">
            Structured Beginner, Intermediate &amp; Advanced tracks with interactive circuits, knowledge checks, and database-verified mastery.
          </p>
        </div>

        {stats && (
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
            <div className="sci-card px-3 py-2 flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-cyan-400" />
              <span>
                Mastered: <strong>{stats.completed_lessons}/{stats.total_lessons}</strong>
              </span>
            </div>
            <div className="sci-card px-3 py-2 flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-400" />
              <span>
                Badges: <strong>{stats.achievements_count}</strong>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Earned Badges Strip */}
      {achievements.length > 0 && (
        <div className="sci-card p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400 mb-2.5">
            <Award className="h-4 w-4" />
            Earned Achievement Badges
          </div>
          <div className="flex flex-wrap gap-2.5">
            {achievements.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs"
              >
                <Trophy className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                <div>
                  <div className="font-bold text-[var(--lab-text)]">{a.name}</div>
                  <div className="text-[11px] text-[var(--lab-muted)]">{a.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Level Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {modules.map((mod) => {
          const isActive = mod.id === currentModule?.id;
          const total = mod.lessons?.length || 0;
          const completed = (mod.lessons || []).filter(
            (l) => progressMap[`${mod.id}:${l.id}`]?.completed
          ).length;
          return (
            <button
              key={mod.id}
              type="button"
              onClick={() => handleSelectLesson(mod.id, mod.lessons?.[0]?.id)}
              className={`text-left rounded-xl border p-4 transition ${
                isActive
                  ? 'border-cyan-400 bg-cyan-500/10'
                  : 'border-[var(--lab-border)] bg-[var(--lab-surface)] hover:border-cyan-400/50'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="uppercase font-mono font-bold text-cyan-400">{mod.level}</span>
                <span className="font-mono text-[var(--lab-muted)]">
                  {completed}/{total} completed
                </span>
              </div>
              <div className="text-sm font-bold text-[var(--lab-text)]">{mod.title}</div>
              <p className="text-xs text-[var(--lab-muted)] mt-1 line-clamp-2">{mod.description}</p>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="sci-card p-8 text-center text-sm text-[var(--lab-muted)]">
          Loading Quantum Academy curriculum...
        </div>
      ) : (
        currentModule && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Lesson Sidebar */}
            <div className="lg:col-span-4 sci-card p-3 space-y-1.5">
              <div className="px-2 py-1 text-xs font-semibold uppercase tracking-wider text-[var(--lab-muted)]">
                Lessons in {currentModule.level} Track
              </div>
              {currentModule.lessons.map((lesson, idx) => {
                const prog = progressMap[`${currentModule.id}:${lesson.id}`];
                const isSelected = lesson.id === currentLesson?.id;
                return (
                  <button
                    key={lesson.id}
                    type="button"
                    onClick={() => handleSelectLesson(currentModule.id, lesson.id)}
                    className={`w-full text-left rounded-lg px-3 py-2.5 text-xs transition flex items-start justify-between gap-2 ${
                      isSelected
                        ? 'bg-cyan-500/15 border border-cyan-400/50 text-[var(--lab-text)]'
                        : 'hover:bg-white/5 text-[var(--lab-muted)] border border-transparent'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-[var(--lab-text)]">
                        {idx + 1}. {lesson.title}
                      </div>
                      <div className="text-[11px] text-[var(--lab-muted)] line-clamp-1 mt-0.5">
                        {lesson.description}
                      </div>
                    </div>
                    {prog?.completed ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <BookOpen className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Active Lesson Content + Quiz */}
            {currentLesson && (
              <div className="lg:col-span-8 sci-card p-5 sm:p-6 space-y-6">
                <div className="border-b border-[var(--lab-border)] pb-4 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-mono uppercase text-cyan-400">
                      {currentModule.title}
                    </div>
                    <h2 className="text-xl font-extrabold text-[var(--lab-text)] mt-1">
                      {currentLesson.title}
                    </h2>
                    <p className="text-sm text-[var(--lab-muted)] mt-1">
                      {currentLesson.description}
                    </p>
                  </div>

                  {progressMap[`${currentModule.id}:${currentLesson.id}`]?.completed ? (
                    <span className="sci-badge bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Mastered ({progressMap[`${currentModule.id}:${currentLesson.id}`].score}%)
                    </span>
                  ) : (
                    <span className="sci-badge bg-slate-500/15 text-[var(--lab-muted)] border border-[var(--lab-border)]">
                      Pass Quiz to Complete
                    </span>
                  )}
                </div>

                {/* Lesson Blocks */}
                <div className="space-y-4">
                  {currentLesson.content.map((block, idx) => {
                    if (block.type === 'formula') {
                      return (
                        <div
                          key={idx}
                          className="rounded-xl border border-cyan-500/30 bg-cyan-500/5 px-4 py-3 font-mono text-xs sm:text-sm text-cyan-300 overflow-x-auto"
                        >
                          {block.content}
                        </div>
                      );
                    }
                    if (block.type === 'circuit') {
                      let parsed = null;
                      try {
                        parsed = JSON.parse(block.content);
                      } catch {
                        parsed = null;
                      }
                      if (!parsed) return null;
                      return (
                        <div
                          key={idx}
                          className="rounded-xl border border-[var(--lab-border)] bg-[var(--lab-elevated)] p-4 space-y-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-xs font-bold text-cyan-400">
                              {parsed.label || 'Interactive Circuit Example'}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleTryCircuit(block.content)}
                              className="sci-btn-primary px-3 py-1.5 text-xs"
                            >
                              <FlaskConical className="h-3.5 w-3.5" />
                              Try in Quantum Lab
                            </button>
                          </div>
                          <CircuitDiagram
                            gates={parsed.gates || []}
                            num_qubits={parsed.num_qubits || 1}
                          />
                        </div>
                      );
                    }
                    return (
                      <p key={idx} className="text-sm leading-relaxed text-[var(--lab-text)]">
                        {block.content}
                      </p>
                    );
                  })}
                </div>

                {/* Knowledge Check Quiz */}
                {currentLesson.quiz && (
                  <form
                    onSubmit={handleQuizSubmit}
                    className="rounded-xl border border-purple-500/30 bg-[var(--lab-elevated)] p-5 space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-[var(--lab-border)] pb-3">
                      <div className="flex items-center gap-2">
                        <HelpCircle className="h-4 w-4 text-purple-400" />
                        <h3 className="text-sm font-bold text-[var(--lab-text)]">
                          Knowledge Check: {currentLesson.quiz.title}
                        </h3>
                      </div>
                      <span className="text-xs font-mono text-[var(--lab-muted)]">
                        Pass threshold: {currentLesson.quiz.passing_score}%
                      </span>
                    </div>

                    <div className="space-y-4">
                      {currentLesson.quiz.questions.map((q, qIdx) => {
                        const graded = quizResult?.details?.find((d) => d.question_id === q.id);
                        return (
                          <div key={q.id} className="space-y-2">
                            <div className="text-xs sm:text-sm font-semibold text-[var(--lab-text)]">
                              {qIdx + 1}. {q.question}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {q.options.map((opt, optIdx) => {
                                const selected = answers[q.id] === optIdx;
                                return (
                                  <label
                                    key={optIdx}
                                    className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 text-xs cursor-pointer transition ${
                                      selected
                                        ? 'border-cyan-400 bg-cyan-500/15 text-[var(--lab-text)]'
                                        : 'border-[var(--lab-border)] bg-[var(--lab-surface)] text-[var(--lab-muted)] hover:text-[var(--lab-text)]'
                                    }`}
                                  >
                                    <input
                                      type="radio"
                                      name={`quiz-${q.id}`}
                                      checked={selected}
                                      onChange={() =>
                                        setAnswers((prev) => ({ ...prev, [q.id]: optIdx }))
                                      }
                                      className="accent-cyan-400"
                                    />
                                    <span>{opt}</span>
                                  </label>
                                );
                              })}
                            </div>

                            {graded && (
                              <div
                                className={`rounded-lg px-3 py-2 text-xs flex items-start gap-2 ${
                                  graded.is_correct
                                    ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                                    : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                                }`}
                              >
                                {graded.is_correct ? (
                                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                                ) : (
                                  <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                )}
                                <span>{graded.explanation}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      {quizResult && (
                        <div className="text-xs font-mono">
                          Result:{' '}
                          <strong
                            className={quizResult.passed ? 'text-emerald-400' : 'text-rose-400'}
                          >
                            {quizResult.score}/{quizResult.total} ({quizResult.percentage}%) —{' '}
                            {quizResult.passed ? 'PASSED' : 'TRY AGAIN'}
                          </strong>
                        </div>
                      )}
                      <button
                        type="submit"
                        disabled={submitting}
                        className="sci-btn-primary text-xs ml-auto"
                      >
                        {submitting ? 'Grading...' : 'Submit Quiz Answers'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
}

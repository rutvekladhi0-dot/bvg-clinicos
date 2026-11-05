import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Badge } from '../components/common/Badge';
import {
  Sparkles, Bot, Send, BrainCircuit, ShieldAlert,
  TrendingUp, AlertTriangle, CheckCircle2, ArrowRight,
  Info, Cpu
} from 'lucide-react';

export const AIInsightsPage: React.FC = () => {
  const { branchId, t, showToast } = useAuth();
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Natural Language Chat Query State
  const [query, setQuery] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; data?: any }>>([
    {
      sender: 'ai',
      text: 'Hello, I am the BVG ClinicOS Intelligent Assistant. You can ask me natural language queries regarding hospital revenue, bed occupancy, doctor rosters, patient registrations, or medicine stock alerts.',
    },
  ]);
  const [isQuerying, setIsQuerying] = useState(false);

  const fetchAnalysis = async () => {
    setLoading(true);
    try {
      const data = await api.getAIAnalysis();
      setAnalysis(data);
    } catch (err) {
      console.error('Error fetching AI insights', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, [branchId]);

  const handleSendQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userText = query;
    setChatMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setQuery('');
    setIsQuerying(true);

    try {
      const res = await api.queryAINaturalLanguage(userText);
      setChatMessages((prev) => [
        ...prev,
        { sender: 'ai', text: res.answer, data: res.data },
      ]);
    } catch (err: any) {
      setChatMessages((prev) => [
        ...prev,
        { sender: 'ai', text: 'Apologies, I encountered an error processing your query. Please check system logs.' },
      ]);
    } finally {
      setIsQuerying(false);
    }
  };

  const handleSuggestedQuery = (suggested: string) => {
    setQuery(suggested);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {t('aiInsights')}
            </h1>
            <Badge variant="teal">Intelligent BI Engine</Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Predictive demand forecasting, pharmacy stock runout detection, operational bottleneck analysis & NLP queries
          </p>
        </div>
      </div>

      {/* Provider & Ethical Safety Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center shrink-0 border border-teal-400/30">
            <Cpu className="w-6 h-6 text-teal-300" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm text-white">Active AI Engine:</span>
              <span className="text-xs text-teal-300 font-semibold">{analysis?.provider || 'Heuristic & Decision Support'}</span>
            </div>
            <p className="text-[11px] text-teal-100/80 mt-0.5">
              {analysis?.status_label || 'Heuristic Intelligence Engine Active'}
            </p>
          </div>
        </div>

        <div className="text-[11px] text-teal-200/90 max-w-md bg-teal-950/60 p-2.5 rounded-xl border border-teal-700/50">
          <ShieldAlert className="w-4 h-4 inline mr-1 text-teal-400" />
          <strong>Clinical Safety Guardrail:</strong> AI engine provides operational forecasting and decision support only. AI does not independently diagnose patients or prescribe medications.
        </div>
      </div>

      {/* Natural Language Query Chat Assistant */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center space-x-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <Bot className="w-5 h-5 text-teal-600" />
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            Natural Language Hospital Intelligence Query
          </h2>
        </div>

        {/* Chat Stream Box */}
        <div className="h-64 overflow-y-auto space-y-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
          {chatMessages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-lg p-3 rounded-2xl ${
                  msg.sender === 'user'
                    ? 'bg-[#0F766E] text-white rounded-br-none'
                    : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-bl-none shadow-xs'
                }`}
              >
                <p className="leading-relaxed">{msg.text}</p>
                {msg.data && (
                  <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 font-mono text-[10px] text-teal-600 dark:text-teal-400">
                    Live Record Data: {JSON.stringify(msg.data)}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isQuerying && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-400 text-xs flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping" />
                <span>ClinicOS assistant is calculating live database metrics...</span>
              </div>
            </div>
          )}
        </div>

        {/* Suggested Quick Queries */}
        <div className="flex flex-wrap gap-2 text-[11px]">
          <span className="text-slate-400 font-semibold self-center">Try asking:</span>
          {[
            'What is the current bed occupancy rate?',
            "What is this month's revenue and collections?",
            'Which medicines in the pharmacy have low stock?',
            'How many doctors are on duty today?',
          ].map((sq, idx) => (
            <button
              key={idx}
              onClick={() => handleSuggestedQuery(sq)}
              className="px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-slate-800 hover:bg-teal-100 dark:hover:bg-slate-700 text-teal-800 dark:text-teal-300 font-medium transition-colors"
            >
              "{sq}"
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendQuery} className="flex items-center space-x-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask a hospital data question in plain English (e.g., 'What is today's revenue?')..."
            className="flex-1 px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
          />
          <button
            type="submit"
            disabled={isQuerying || !query.trim()}
            className="flex items-center px-4 py-2.5 bg-[#0F766E] hover:bg-[#0D6861] disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm transition-colors"
          >
            <Send className="w-3.5 h-3.5 mr-1.5" />
            Query
          </button>
        </form>
      </div>

      {/* Predictive Insights Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {analysis?.insights?.map((ins: any) => (
          <div
            key={ins.id}
            className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-xs font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wider">
                  {ins.type}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 font-mono">
                  {ins.confidence}% Confidence
                </span>
              </div>

              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {ins.title}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                {ins.summary}
              </p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1.5 text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-200 block text-[11px] uppercase tracking-wider">
                Actionable Heuristic Recommendations:
              </span>
              <ul className="space-y-1 text-slate-600 dark:text-slate-400">
                {ins.actionable_recommendations?.map((rec: string, rIdx: number) => (
                  <li key={rIdx} className="flex items-start space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

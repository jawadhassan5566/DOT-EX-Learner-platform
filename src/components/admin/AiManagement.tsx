import React, { useState, useEffect } from 'react';
import {
  Bot,
  Sparkles,
  Save,
  Sliders,
  ShieldCheck,
  Cpu,
  Layers,
  CheckCircle2
} from 'lucide-react';
import { useApp } from '../../context/AppContext.js';
import { api } from '../../services/api.js';

export const AiManagement: React.FC = () => {
  const { addToast } = useApp();

  const [provider, setProvider] = useState('gemini');
  const [model, setModel] = useState('gemini-2.5-flash');
  const [temperature, setTemperature] = useState(0.4);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [dailyQuota, setDailyQuota] = useState(100);
  const [systemInstructions, setSystemInstructions] = useState(
    "You are the Dot X Library Academic AI Assistant. Your goal is to guide university students through complex academic concepts, calculus proofs, software engineering, and literature analysis with rigorous, citation-backed pedagogy. Maintain an encouraging and academically rigorous tone."
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await api.getAiConfig();
        if (res.success && res.config) {
          setProvider(res.config.provider || 'gemini');
          setModel(res.config.model || 'gemini-2.5-flash');
          setSystemInstructions(res.config.systemInstructions || systemInstructions);
          setDailyQuota(res.config.dailyQuotaPerUser || 100);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.updateAiConfig({
        provider,
        model,
        systemInstructions,
        dailyQuotaPerUser: Number(dailyQuota)
      });
      if (res.success) {
        addToast({
          type: 'success',
          title: 'AI Hyperparameters Saved',
          message: 'Gemini cognitive engine calibrated with updated academic system prompt.'
        });
      }
    } catch (err: any) {
      addToast({ type: 'error', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 text-xs max-w-4xl">
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between shadow-xl">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center space-x-2">
            <Bot className="w-5 h-5 text-cyan-400" />
            <span>Academic AI Architecture & Hyperparameter Calibration</span>
          </h2>
          <p className="text-slate-400 mt-0.5">
            Decoupled AI engine: swap models, customize pedagogical system prompts, and throttle inference quotas.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center space-x-1.5 shadow"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Synchronizing...' : 'Save Settings'}</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Model Provider */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
          <h3 className="font-bold text-sm text-white flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-blue-400" />
            <span>Cognitive Model Selector</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 font-medium mb-1">AI Engine Provider</label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
              >
                <option value="gemini">Google Gemini API (@google/genai)</option>
                <option value="openai_compatible">OpenAI Compatible Endpoint</option>
                <option value="anthropic_compatible">Anthropic Compatible Endpoint</option>
                <option value="local_llm">Local University Cluster (vLLM / Ollama)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Model Alias / Tag</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
              >
                <option value="gemini-2.5-flash">gemini-2.5-flash (Ultra-fast pedagogical reasoning)</option>
                <option value="gemini-2.5-pro">gemini-2.5-pro (Deep research & mathematical proofs)</option>
                <option value="gemini-1.5-flash">gemini-1.5-flash (Standard legacy)</option>
              </select>
            </div>
          </div>
        </div>

        {/* System Prompt Tuning */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 shadow-xl">
          <h3 className="font-bold text-sm text-white flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Pedagogical System Prompt</span>
          </h3>
          <p className="text-slate-400">
            Defines the persona, academic safety boundaries, and citation expectations for all student interactions.
          </p>
          <textarea
            rows={5}
            value={systemInstructions}
            onChange={(e) => setSystemInstructions(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white font-mono leading-relaxed"
          ></textarea>
        </div>

        {/* Inference Limits & Quotas */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
          <h3 className="font-bold text-sm text-white flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <span>Rate Limiting & Cost Management</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Daily Query Allowance Per Student</label>
              <input
                type="number"
                value={dailyQuota}
                onChange={(e) => setDailyQuota(parseInt(e.target.value, 10))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Protects against abusive token consumption</span>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Temperature (Creativity vs Determinism)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">0.4 recommended for mathematical accuracy</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

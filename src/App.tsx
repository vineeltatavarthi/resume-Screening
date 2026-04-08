import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  FileText, 
  Terminal, 
  Globe, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Play, 
  RotateCcw, 
  ChevronRight,
  Cpu,
  Layout,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { geminiService } from './services/geminiService';
import { ActionType, BrowserAction, ScreeningResult, AgentState, LeaderboardEntry } from './types';

// Mock Data
const INITIAL_JD = `Senior Full Stack Engineer
- 5+ years experience with React and Node.js
- Strong understanding of Distributed Systems
- Experience with Cloud Infrastructure (AWS/GCP)
- Passion for AI/ML integration`;

const INITIAL_RESUME = `Alex Rivera
Full Stack Developer with 6 years of experience.
Expert in React, TypeScript, and Node.js. 
Built scalable microservices on AWS. 
Implemented LLM-powered features for a fintech startup.
Strong focus on performance and clean code.`;

export default function App() {
  const [jd, setJd] = useState(INITIAL_JD);
  const [jdUrl, setJdUrl] = useState("");
  const [isFetchingJd, setIsFetchingJd] = useState(false);
  const [resume, setResume] = useState(INITIAL_RESUME);
  const [isProcessing, setIsProcessing] = useState(false);
  const [screeningResult, setScreeningResult] = useState<ScreeningResult | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [rightTab, setRightTab] = useState<'logs' | 'leaderboard'>('logs');
  const [agentState, setAgentState] = useState<AgentState>({
    currentStep: 0,
    logs: [],
    browserState: {
      url: "https://hiring-portal.internal/dashboard",
      elements: ["Search Candidates", "Job: Senior Full Stack Engineer", "Status Filter"],
    }
  });

  const logEndRef = useRef<HTMLDivElement>(null);

  const addLog = (message: string) => {
    setAgentState(prev => ({
      ...prev,
      logs: [...prev.logs, `[${new Date().toLocaleTimeString()}] ${message}`]
    }));
  };

  const handleFetchJd = async () => {
    if (!jdUrl) return;
    setIsFetchingJd(true);
    addLog(`Attempting to extract JD from: ${jdUrl}`);
    try {
      const extractedJd = await geminiService.extractJDFromUrl(jdUrl);
      setJd(extractedJd);
      addLog("Job description extracted successfully.");
    } catch (error) {
      addLog(`Extraction Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsFetchingJd(false);
    }
  };

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [agentState.logs]);

  const runWorkflow = async () => {
    setIsProcessing(true);
    setScreeningResult(null);
    setAgentState(prev => ({ ...prev, currentStep: 1, logs: [] }));

    try {
      // Step 1: Semantic Screening
      addLog("Initializing Semantic Matcher...");
      const result = await geminiService.screenResume(jd, resume);
      setScreeningResult(result);
      addLog(`Screening Complete. Candidate: ${result.candidateName} | Score: ${result.score.toFixed(2)} | Recommendation: ${result.recommendation.toUpperCase()}`);
      
      // Update Leaderboard
      setLeaderboard(prev => {
        const newEntry: LeaderboardEntry = {
          id: Math.random().toString(36).substr(2, 9),
          name: result.candidateName,
          score: result.score,
          recommendation: result.recommendation,
          timestamp: Date.now()
        };
        const updated = [...prev, newEntry].sort((a, b) => b.score - a.score);
        return updated;
      });

      // Step 2: Browser Automation Loop
      let step = 0;
      let currentBrowserState = {
        url: "https://hiring-portal.internal/candidates",
        elements: [`Candidate: ${result.candidateName}`, "Action Menu", "Profile View"],
      };

      while (step < 5) {
        step++;
        addLog(`Agent Step ${step}: Observing environment...`);
        
        const action = await geminiService.decideNextAction(jd, resume, result, currentBrowserState);
        
        setAgentState(prev => ({
          ...prev,
          currentStep: step + 1,
          browserState: {
            ...currentBrowserState,
            lastAction: action
          }
        }));

        addLog(`Action: ${action.type.toUpperCase()} ${action.target || ''} - ${action.reasoning}`);

        if (action.type === ActionType.DONE) {
          addLog("Workflow completed successfully.");
          break;
        }

        // Simulate browser state change
        await new Promise(r => setTimeout(r, 1500));
        
        if (action.type === ActionType.CLICK) {
          currentBrowserState = {
            ...currentBrowserState,
            elements: ["Confirm Action", "Cancel", "Notes Field"]
          };
        }
      }

    } catch (error) {
      addLog(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-gray-100 font-sans selection:bg-blue-500/30">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)]">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-semibold tracking-tight">OpenEnv <span className="text-blue-500">Agent</span></h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10 text-xs text-gray-400">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              System Online
            </div>
            <button 
              onClick={runWorkflow}
              disabled={isProcessing}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-lg shadow-blue-600/20"
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              {isProcessing ? 'Processing...' : 'Run Workflow'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-12 gap-6">
        {/* Left Column: Inputs */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <section className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-400">
                <Search className="w-4 h-4" />
                Job Description
              </div>
              <div className="text-[10px] text-blue-400 font-bold uppercase tracking-tighter">Auto-Extract Enabled</div>
            </div>
            
            <div className="flex gap-2">
              <input 
                type="text"
                value={jdUrl}
                onChange={(e) => setJdUrl(e.target.value)}
                placeholder="LinkedIn/Naukri URL..."
                className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500/50 transition-colors"
              />
              <button 
                onClick={handleFetchJd}
                disabled={isFetchingJd || !jdUrl}
                className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] font-bold uppercase transition-all disabled:opacity-50"
              >
                {isFetchingJd ? <Loader2 className="w-3 h-3 animate-spin" /> : "Fetch"}
              </button>
            </div>

            <textarea 
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              className="w-full h-40 bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500/50 transition-colors resize-none font-mono"
              placeholder="Or paste JD here..."
            />
          </section>

          <section className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-400">
              <FileText className="w-4 h-4" />
              Candidate Resume
            </div>
            <textarea 
              value={resume}
              onChange={(e) => setResume(e.target.value)}
              className="w-full h-40 bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500/50 transition-colors resize-none font-mono"
              placeholder="Paste Resume here..."
            />
          </section>

          {/* Explainability Card */}
          <AnimatePresence>
            {screeningResult && (
              <motion.section 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-blue-600/10 border border-blue-500/20 rounded-2xl p-5 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-blue-400 uppercase tracking-wider">AI Analysis</div>
                  <div className="text-2xl font-mono font-bold text-white">{(screeningResult.score * 100).toFixed(0)}%</div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <div className="text-[10px] uppercase text-gray-500 font-bold mb-1">Matched Skills</div>
                    <div className="flex flex-wrap gap-1.5">
                      {screeningResult.skillsMatched.map(s => (
                        <span key={s} className="px-2 py-0.5 bg-green-500/20 text-green-400 text-[10px] rounded border border-green-500/30">{s}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-gray-500 font-bold mb-1">Missing / Gaps</div>
                    <div className="flex flex-wrap gap-1.5">
                      {screeningResult.missingSkills.map(s => (
                        <span key={s} className="px-2 py-0.5 bg-red-500/20 text-red-400 text-[10px] rounded border border-red-500/30">{s}</span>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed italic">
                    "{screeningResult.reasoning}"
                  </p>
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </div>

        {/* Middle Column: Browser Simulation */}
        <div className="col-span-12 lg:col-span-5 space-y-6">
          <section className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex flex-col h-[600px]">
            <div className="bg-white/5 border-b border-white/10 p-3 flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
              </div>
              <div className="flex-1 bg-black/40 rounded-md px-3 py-1 text-[10px] text-gray-500 flex items-center gap-2 border border-white/5">
                <Globe className="w-3 h-3" />
                {agentState.browserState.url}
              </div>
            </div>
            
            <div className="flex-1 p-6 relative overflow-hidden bg-[#0c0c0e]">
              {/* Simulated Browser Content */}
              <div className="space-y-6">
                <div className="h-8 w-48 bg-white/5 rounded-lg border border-white/10" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-24 bg-white/5 rounded-xl border border-white/10 p-4 space-y-2">
                    <div className="h-2 w-20 bg-white/10 rounded" />
                    <div className="h-4 w-32 bg-white/20 rounded" />
                  </div>
                  <div className="h-24 bg-white/5 rounded-xl border border-white/10 p-4 space-y-2">
                    <div className="h-2 w-20 bg-white/10 rounded" />
                    <div className="h-4 w-32 bg-white/20 rounded" />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="text-[10px] uppercase text-gray-600 font-bold tracking-widest">Active Elements</div>
                  <div className="space-y-2">
                    {agentState.browserState.elements.map((el, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10 hover:border-blue-500/30 transition-colors group">
                        <span className="text-xs text-gray-400">{el}</span>
                        <ChevronRight className="w-3 h-3 text-gray-600 group-hover:text-blue-500" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Agent Overlay */}
              <AnimatePresence>
                {agentState.browserState.lastAction && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-8"
                  >
                    <div className="bg-[#16161a] border border-blue-500/30 rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center border border-blue-500/30">
                          <Layout className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <div className="text-[10px] uppercase text-blue-400 font-bold">Executing Action</div>
                          <div className="text-sm font-bold text-white capitalize">{agentState.browserState.lastAction.type} {agentState.browserState.lastAction.target}</div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        {agentState.browserState.lastAction.reasoning}
                      </p>
                      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: "100%" }}
                          transition={{ duration: 1.5 }}
                          className="h-full bg-blue-500"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>
        </div>

        {/* Right Column: Terminal Logs & Leaderboard */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          <section className="bg-black border border-white/10 rounded-2xl flex flex-col h-[600px] shadow-2xl overflow-hidden">
            <div className="flex border-b border-white/10">
              <button 
                onClick={() => setRightTab('logs')}
                className={`flex-1 p-4 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors ${rightTab === 'logs' ? 'bg-white/5 text-blue-400' : 'text-gray-500 hover:text-gray-300'}`}
              >
                <Terminal className="w-3 h-3" />
                Logs
              </button>
              <button 
                onClick={() => setRightTab('leaderboard')}
                className={`flex-1 p-4 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors ${rightTab === 'leaderboard' ? 'bg-white/5 text-blue-400' : 'text-gray-500 hover:text-gray-300'}`}
              >
                <CheckCircle2 className="w-3 h-3" />
                Leaderboard
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
              {rightTab === 'logs' ? (
                <div className="font-mono text-[11px] space-y-2">
                  {agentState.logs.length === 0 && (
                    <div className="text-gray-700 italic">System idle. Waiting for workflow...</div>
                  )}
                  {agentState.logs.map((log, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="text-blue-500/50 shrink-0">→</span>
                      <span className={log.includes('Error') ? 'text-red-400' : log.includes('Complete') ? 'text-green-400' : 'text-gray-400'}>
                        {log}
                      </span>
                    </div>
                  ))}
                  <div ref={logEndRef} />
                </div>
              ) : (
                <div className="space-y-4">
                  {leaderboard.length === 0 && (
                    <div className="text-center py-12 space-y-3">
                      <AlertCircle className="w-8 h-8 text-gray-700 mx-auto" />
                      <div className="text-xs text-gray-600 font-medium uppercase tracking-widest">No candidates yet</div>
                    </div>
                  )}
                  {leaderboard.map((entry, i) => (
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      key={entry.id} 
                      className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-2 relative group"
                    >
                      <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-lg shadow-blue-600/40 opacity-0 group-hover:opacity-100 transition-opacity">
                        {i + 1}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-white truncate max-w-[120px]">{entry.name}</div>
                        <div className="text-sm font-mono font-bold text-blue-400">{(entry.score * 100).toFixed(0)}</div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${
                          entry.recommendation === 'accept' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                          entry.recommendation === 'reject' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                          'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                        }`}>
                          {entry.recommendation}
                        </div>
                        <div className="text-[8px] text-gray-600">
                          {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Footer Stats */}
      <footer className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-black/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-10 flex items-center justify-between text-[10px] text-gray-500 font-medium uppercase tracking-widest">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
              Model: Gemini 3 Flash
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
              Latency: ~1.2s
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-white transition-colors flex items-center gap-1">
              Documentation <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

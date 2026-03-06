import React from 'react';

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-indigo-500/30">
      {/* Navbar */}
      <header className="fixed top-0 w-full z-50 bg-black/50 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-xl">
              A
            </div>
            <span className="font-semibold text-lg tracking-tight">Agent-as-a-Service</span>
          </div>
          <nav className="hidden md:flex space-x-8 text-sm font-medium text-gray-400">
            <a href="#" className="text-white">Dashboard</a>
            <a href="#" className="hover:text-white transition-colors">Global Skills</a>
            <a href="#" className="hover:text-white transition-colors">Enora.ai</a>
            <a href="#" className="hover:text-white transition-colors">Settings</a>
          </nav>
          <div className="flex items-center space-x-4">
            <button className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Sign out</button>
            <div className="w-8 h-8 rounded-full border border-white/20 overflow-hidden bg-gray-800">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Founder" alt="User" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-32 pb-16 px-6 max-w-7xl mx-auto">
        <div className="space-y-2 mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
            Welcome to the AI Tier.
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl">
            Manage your autonomous workforce, trace collective intelligence, and monitor your token burn rate.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Token Burn Rate Widget */}
          <div className="lg:col-span-2 rounded-2xl bg-white/5 border border-white/10 p-8 backdrop-blur-sm relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            <div className="flex items-center justify-between mb-8 relative z-10">
              <div>
                <h2 className="text-2xl font-semibold">Token Burn Engine</h2>
                <p className="text-gray-400 text-sm mt-1">Manage your Open Router AI payroll limit</p>
              </div>
              <div className="px-4 py-2 rounded-full bg-indigo-500/20 text-indigo-300 text-sm font-medium border border-indigo-500/30">
                Active Routing
              </div>
            </div>

            <div className="space-y-8 relative z-10">
              <div>
                <div className="flex justify-between text-sm mb-4">
                  <span className="text-gray-400">Monthly Allocation</span>
                  <span className="font-mono text-white">4.2M / 10M Tokens</span>
                </div>
                {/* Advanced Slider Look-Alike */}
                <div className="relative h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                  <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 to-purple-500 w-[42%]"></div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-black/40 rounded-xl p-4 border border-white/5">
                  <div className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Est. Monthly Cost</div>
                  <div className="text-2xl font-light">$240.00</div>
                </div>
                <div className="bg-black/40 rounded-xl p-4 border border-white/5">
                  <div className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Active Agents</div>
                  <div className="text-2xl font-light">12 <span className="text-sm text-green-500">↑ 3</span></div>
                </div>
                <div className="bg-black/40 rounded-xl p-4 border border-white/5">
                  <div className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Global Skills Synthesized</div>
                  <div className="text-2xl font-light">4</div>
                </div>
              </div>
            </div>
          </div>

          {/* Enora.ai Lighthouse Module */}
          <div className="rounded-2xl bg-gradient-to-b from-blue-900/20 to-black border border-blue-500/20 p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-20">
              <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="cyan" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>

            <div className="relative z-10 h-full flex flex-col">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center border border-blue-400/30">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="cyan" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-blue-100">Enora.ai</h3>
              </div>

              <p className="text-blue-200/60 text-sm mb-6 flex-grow">
                Lighthouse manufacturing module active. Ingesting unstructured factory telemetry & executing ISO 9001 compliance loops.
              </p>

              <button className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-500 transition-colors text-white text-sm font-medium shadow-[0_0_20px_rgba(37,99,235,0.3)]">
                Launch Workspace
              </button>
            </div>
          </div>
        </div>

        {/* Global Skill Repository Preview */}
        <div className="mt-8 rounded-2xl bg-white/5 border border-white/10 p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-semibold">Global Skill Repository</h2>
            <button className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">View All Skills →</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: "LinkedIn Viral Loop", usage: "142.1k calls", author: "AaaS Native" },
              { title: "Cold Outreach Structuring", usage: "89.4k calls", author: "User #492" },
              { title: "Financial Model Audit", usage: "34.2k calls", author: "User #118" },
            ].map((skill, i) => (
              <div key={i} className="p-5 rounded-xl bg-black/40 border border-white/5 hover:border-indigo-500/30 transition-colors cursor-pointer group">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="font-medium text-gray-200 group-hover:text-white transition-colors">{skill.title}</h4>
                  <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
                </div>
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>Author: {skill.author}</span>
                  <span className="font-mono">{skill.usage}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

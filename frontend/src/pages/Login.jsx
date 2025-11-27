import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BlurFade } from '../components/ui/blur-fade';
import { AnimatedGridPattern } from '../components/ui/animated-grid-pattern';
import { Shield, Zap, Globe, ArrowRight, Lock, Database, Users } from 'lucide-react';

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [orgId, setOrgId] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (orgId.trim()) {
      login({
        id: orgId.trim(),
        name: orgId.trim(),
        email: `${orgId.trim()}@example.com`
      });
      navigate('/dashboard');
    }
  };

  if (showLogin) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-black">
        <AnimatedGridPattern />
        
        <BlurFade>
          <div className="relative z-10 w-full max-w-md px-6">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-4">
                <Shield className="w-10 h-10 text-cyan-400" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
              <p className="text-gray-400">Sign in to access your healthcare data</p>
            </div>

            <div className="bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
              <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                  <div>
                    <label htmlFor="orgId" className="block text-sm font-medium text-gray-300 mb-2">
                      Organization ID
                    </label>
                    <input
                      type="text"
                      id="orgId"
                      value={orgId}
                      onChange={(e) => setOrgId(e.target.value)}
                      className="block w-full px-4 py-3 bg-black/50 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                      placeholder="e.g., org1, hospital1"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-bold py-3 px-4 rounded-lg hover:from-cyan-300 hover:to-blue-400 transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2"
                  >
                    <Zap className="w-5 h-5" />
                    ACCESS PLATFORM
                  </button>
                </div>
              </form>

              <div className="mt-6 pt-6 border-t border-white/10">
                <p className="text-xs text-gray-400 text-center">
                  PoC Mode: Mock authentication
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowLogin(false)}
              className="mt-6 text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-2 mx-auto"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              Back to home
            </button>
          </div>
        </BlurFade>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-black">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <AnimatedGridPattern />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent" />
      </div>

      {/* Floating particles effect */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400/30 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`
            }}
          />
        ))}
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-cyan-400" />
          <span className="text-2xl font-bold">
            <span className="text-white">Med</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400">Block</span>
          </span>
        </div>
        <button
          onClick={() => setShowLogin(true)}
          className="px-6 py-2 bg-cyan-400 text-black font-bold rounded-lg hover:bg-cyan-300 transition-all"
        >
          SIGN IN / SIGN UP
        </button>
      </header>

      {/* Hero Section */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-120px)] px-6">
        <BlurFade delay={0.1}>
          <div className="text-center max-w-5xl mx-auto">
            {/* Main Heading */}
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-black mb-8 leading-tight">
              <div className="text-white mb-2">The Future of</div>
              <div className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-500 drop-shadow-[0_0_30px_rgba(250,204,21,0.3)]">
                Healthcare Data
              </div>
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Secure, transparent, and efficient healthcare data sharing powered by blockchain technology and end-to-end encryption.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16">
              <button
                onClick={() => setShowLogin(true)}
                className="group px-8 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-black text-lg rounded-lg hover:from-yellow-300 hover:to-orange-400 transition-all shadow-2xl shadow-yellow-500/30 flex items-center gap-3 transform hover:scale-105"
              >
                <Zap className="w-6 h-6" />
                GET STARTED
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="px-8 py-4 border-2 border-cyan-400 text-cyan-400 font-bold text-lg rounded-lg hover:bg-cyan-400/10 transition-all flex items-center gap-3">
                <Globe className="w-6 h-6" />
                LEARN MORE
              </button>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-20">
              <BlurFade delay={0.2}>
                <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:border-cyan-400/50 transition-all group">
                  <Lock className="w-10 h-10 text-cyan-400 mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="text-white font-bold text-lg mb-2">End-to-End Encryption</h3>
                  <p className="text-gray-400 text-sm">AES-256-GCM encryption with per-record DEKs ensures maximum security</p>
                </div>
              </BlurFade>
              
              <BlurFade delay={0.3}>
                <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:border-purple-400/50 transition-all group">
                  <Database className="w-10 h-10 text-purple-400 mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="text-white font-bold text-lg mb-2">Blockchain Powered</h3>
                  <p className="text-gray-400 text-sm">Hyperledger Fabric provides immutable audit trails and transparency</p>
                </div>
              </BlurFade>
              
              <BlurFade delay={0.4}>
                <div className="bg-gradient-to-br from-orange-500/10 to-yellow-500/10 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:border-yellow-400/50 transition-all group">
                  <Users className="w-10 h-10 text-yellow-400 mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="text-white font-bold text-lg mb-2">Collaborative</h3>
                  <p className="text-gray-400 text-sm">Secure data sharing with granular access control and consent management</p>
                </div>
              </BlurFade>
            </div>
          </div>
        </BlurFade>
      </div>

      {/* Footer Note */}
      <div className="absolute bottom-6 left-0 right-0 text-center z-10">
        <p className="text-gray-500 text-sm">
          .
        </p>
      </div>
    </div>
  );
}

export default Login;

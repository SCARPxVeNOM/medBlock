import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AnimatedGradientText } from '../components/ui/animated-gradient-text';
import { ShimmerButton } from '../components/ui/shimmer-button';
import { BlurFade } from '../components/ui/blur-fade';
import { AnimatedGridPattern } from '../components/ui/animated-grid-pattern';
import { MagicCard } from '../components/ui/magic-card';
import { BorderBeam } from '../components/ui/border-beam';
import { Shield, Lock } from 'lucide-react';

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Mock OAuth2 / SMART on FHIR login
    // TODO: Replace with real OAuth2 flow
    try {
      await login({
        id: userId || 'org1',
        name: userId || 'Organization 1',
        email: `${userId}@example.com`
      });
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <AnimatedGridPattern />
      <div className="relative z-10 max-w-md w-full">
        <BlurFade delay={0.1}>
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Shield className="w-10 h-10 text-white" />
              <h2 className="text-4xl font-extrabold">
                <AnimatedGradientText>MedBlock</AnimatedGradientText>
              </h2>
            </div>
            <p className="text-gray-300 text-lg">
              Healthcare Data Collaboration Platform
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Secure, privacy-preserving healthcare data sharing
            </p>
          </div>
        </BlurFade>

        <BlurFade delay={0.2}>
          <div className="relative">
            <MagicCard className="p-8">
              <form className="space-y-6 relative z-20" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="userId" className="block text-sm font-medium text-white/80 mb-2">
                    Organization ID
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                      id="userId"
                      name="userId"
                      type="text"
                      required
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 transition-all"
                      placeholder="e.g., org1"
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <ShimmerButton
                    type="submit"
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? 'Signing in...' : 'Sign in'}
                  </ShimmerButton>
                </div>

                <div className="text-xs text-white/50 text-center space-y-1">
                  <p>PoC Mode: Mock authentication</p>
                  <p>In production, this would use SMART on FHIR OAuth2</p>
                </div>
              </form>
              <BorderBeam />
            </MagicCard>
          </div>
        </BlurFade>
      </div>
    </div>
  );
}

export default Login;


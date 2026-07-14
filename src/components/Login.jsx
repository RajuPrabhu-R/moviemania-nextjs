import React from 'react';
import { account } from '../appwriteConfig'; 
import { LogIn } from 'lucide-react';

const Login = () => {
  const handleGoogleLogin = () => {
    // 1. Success URL: Where the user goes after a successful login
    const successURL = "https://moviemania-swart.vercel.app";
    
    // 2. Failure URL: Where the user goes if they cancel or an error occurs
    const failureURL = "https://moviemania-swart.vercel.app/login";

    // Correct Appwrite OAuth2 Call
    // Parameters: (provider, success, failure)
    account.createOAuth2Session(
      'google', 
      successURL, 
      failureURL
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-4 font-Poppins">
      {/* Login Card */}
      <div className="max-w-md w-full bg-[#141414] p-10 rounded-2xl border border-white/10 shadow-2xl text-center">
        
        {/* Animated Logo Section */}
        <div className="relative inline-block mb-6">
          <img 
            src="/Itachi-sharingan.png" 
            className="w-20 h-20 animate-spin" 
            alt="Logo" 
            style={{ animationDuration: '3s' }}
          />
          <div className="absolute inset-0 bg-pink-600/20 blur-xl rounded-full -z-10"></div>
        </div>

        {/* Branding */}
        <h1 className="text-3xl font-black text-white mb-2 tracking-tighter uppercase">
          Movie<span className="text-pink-600">Mania</span>
        </h1>
        <p className="text-gray-400 mb-10 text-sm">
          Sign in with Google to sync your watch history and preferences.
        </p>

        {/* Google Login Button */}
        <button 
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-4 bg-white text-black py-4 px-6 rounded-xl font-bold hover:bg-gray-200 transition-all transform active:scale-95 shadow-lg"
        >
          <img 
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
            className="w-6 h-6" 
            alt="Google Icon" 
          />
          Continue with Google
        </button>

        {/* Footer Note */}
        <p className="mt-8 text-[10px] text-gray-500 uppercase tracking-widest">
          Secure Authentication via Appwrite
        </p>
      </div>
    </div>
  );
};

export default Login;
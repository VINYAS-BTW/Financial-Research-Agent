import React, { useState, useEffect, useRef } from "react";
import { TrendingUp, Lock, BarChart3, Play } from "lucide-react";

const FinancialAILanding = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHoveringCTA, setIsHoveringCTA] = useState(false);
  const canvasRef = useRef(null);
  const barsRef = useRef([]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const drawGrid = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const gridSize = 40;
      const gradient = ctx.createLinearGradient(
        0,
        0,
        canvas.width,
        canvas.height
      );
      gradient.addColorStop(0, "rgba(59, 130, 246, 0.1)");
      gradient.addColorStop(1, "rgba(16, 185, 129, 0.1)");

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 0.5;

      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      const distance = Math.sqrt(
        Math.pow(mousePos.x - canvas.width / 2, 2) +
          Math.pow(mousePos.y - canvas.height / 2, 2)
      );
      const maxDistance = Math.sqrt(
        Math.pow(canvas.width / 2, 2) + Math.pow(canvas.height / 2, 2)
      );
      const glowIntensity = 1 - Math.min(distance / maxDistance, 1);

      const glowGradient = ctx.createRadialGradient(
        mousePos.x,
        mousePos.y,
        0,
        mousePos.x,
        mousePos.y,
        200
      );
      glowGradient.addColorStop(
        0,
        `rgba(59, 130, 246, ${0.3 * glowIntensity})`
      );
      glowGradient.addColorStop(1, "rgba(59, 130, 246, 0)");

      ctx.fillStyle = glowGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    const animate = () => {
      drawGrid();
      requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [mousePos]);

  useEffect(() => {
    const interval = setInterval(() => {
      barsRef.current = Array.from(
        { length: 8 },
        () => Math.random() * 100 + 20
      );
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 z-0" />

      {/* Navigation */}
      <nav className="relative z-20 flex items-center justify-between px-8 py-6">
        <div className="flex items-center space-x-2">
          <span className="text-white font-bold text-xl font-vi3">FinRec</span>
        </div>

        <div className="hidden md:flex items-center space-x-8 text-gray-300 text-sm font-vi2">
          <a href="#" className="hover:text-white transition-colors">
            Home
          </a>
          <a href="#" className="hover:text-white transition-colors">
            Features
          </a>
          <a href="#" className="hover:text-white transition-colors">
            Solutions
          </a>
         
        </div>

        <button className="px-6 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white text-sm hover:bg-white/20 transition-all">
          Get Started →
        </button>
      </nav>

      {/* Side Icons */}
      <div className="absolute left-8 top-1/4 z-10 space-y-8">
        <div className="group cursor-pointer">
          <div className="w-12 h-12 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-all">
            <BarChart3 className="w-6 h-6 text-blue-400" />
          </div>
          <p className="text-gray-400 text-xs mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            Analytics
          </p>
          <p className="text-gray-600 text-xs">3 tools</p>
        </div>

        <div className="w-32 h-px bg-gradient-to-r from-white/20 to-transparent"></div>

        <div className="group cursor-pointer">
          <div className="w-12 h-12 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-all">
            <Lock className="w-6 h-6 text-emerald-400" />
          </div>
          <p className="text-gray-400 text-xs mt-2">Security</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-4">
        <div className="mb-6 px-4 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full inline-flex items-center space-x-2 font-vi2">
          <span className="text-gray-300 text-sm">
            AI-powered financial intelligence
          </span>
        </div>

        <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-center mb-8 bg-gradient-to-br from-blue-200 via-blue-300 to-emerald-300 bg-clip-text text-transparent leading-tight tracking-tight font-vi3">
          Make it where it
          <br />
          happens
        </h1>

        <p className="text-gray-400 text-lg md:text-xl text-center max-w-2xl mb-12 font-vi2">
          Transform your financial decisions with intelligent insights and
          real-time market analysis
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <button
            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl text-white font-medium shadow-lg shadow-blue-500/50 hover:shadow-blue-500/70 hover:scale-105 transition-all font-vi2"
            onMouseEnter={() => setIsHoveringCTA(true)}
            onMouseLeave={() => setIsHoveringCTA(false)}
          >
            Start Investing
          </button>

          <button className="px-8 py-4 bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl text-white font-medium hover:bg-white/10 transition-all flex items-center space-x-2 font-vi2">
            <Play className="w-4 h-4" fill="white" />
            <span>See how it works</span>
          </button>
        </div>
      </div>

      {/* Bottom Right Animation */}
      <div className="absolute bottom-8 right-8 z-10">
        <div className="relative">
          <div className="px-4 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg mb-4">
            <p className="text-gray-400 text-xs mb-1">Market Trends</p>
            <div className="flex items-end space-x-1 h-16">
              {[45, 60, 35, 80, 50, 70, 40, 65].map((height, i) => (
                <div
                  key={i}
                  className="w-1.5 bg-gradient-to-t from-blue-500 to-emerald-400 rounded-full transition-all duration-1000"
                  style={{ height: `${height}%` }}
                ></div>
              ))}
            </div>
          </div>

          <div className="w-16 h-16 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl flex items-center justify-center">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-emerald-500/20 flex items-center justify-center animate-pulse">
              <TrendingUp className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute inset-0 pointer-events-none z-5">
        <div
          className="absolute w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"
          style={{
            left: "20%",
            top: "30%",
            animation: "float 8s ease-in-out infinite",
          }}
        ></div>
        <div
          className="absolute w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"
          style={{
            right: "15%",
            top: "40%",
            animation: "float 10s ease-in-out infinite reverse",
          }}
        ></div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-30px); }
        }
      `}</style>
    </div>
  );
};

export default FinancialAILanding;

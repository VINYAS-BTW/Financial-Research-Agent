import React, { useState, useEffect, useRef } from "react";
import { TrendingUp, Lock, BarChart3, Play, Mail, Github, Linkedin, Twitter, MapPin, Phone, Send, ArrowRight } from "lucide-react";

const FinancialAILanding = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHoveringCTA, setIsHoveringCTA] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const canvasRef = useRef(null);
  const barsRef = useRef([]);
  const teamRef = useRef(null);
  const contactRef = useRef(null);
  const homeRef = useRef(null);

  const teamMembers = [
    {
      name: "Saiyam N Bothra",
      role: "Team Lead and Ai Engineer",
      image: "",
      bio: "STILL THINKIN",
      social: { linkedin: "#", twitter: "#", github: "#" }
    },
    {
      name: "Sai Vinyas BS",
      role: "Frontend Lead and Backend Support",
      image: "",
      bio: "CAFFIENE",
      social: { linkedin: "#", twitter: "#", github: "#" }
    },
    {
      name: "Sourabh V Katti",
      role: "TRAIN EXPERT",
      image: "",
      bio: "Built fintech products used by millions globally",
      social: { linkedin: "#", twitter: "#", github: "#" }
    },
   
  ];

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

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
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
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
      glowGradient.addColorStop(0, `rgba(59, 130, 246, ${0.3 * glowIntensity})`);
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
      barsRef.current = Array.from({ length: 8 }, () => Math.random() * 100 + 20);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const observerOptions = {
      threshold: 0.3,
      rootMargin: '0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    }, observerOptions);

    const teamCards = document.querySelectorAll('.team-card');
    teamCards.forEach(card => observer.observe(card));

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (section) => {
    const refs = {
      home: homeRef,
      team: teamRef,
      contact: contactRef
    };
    
    refs[section]?.current?.scrollIntoView({ behavior: 'smooth' });
    setActiveSection(section);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    alert('Thank you! We\'ll get back to you soon.');
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <div className="relative w-full bg-black overflow-x-hidden">
      <canvas ref={canvasRef} className="fixed inset-0 z-0" />

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/50 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-8 py-6">
          <div className="flex items-center space-x-2">
            <span className="text-white font-bold text-xl font-vi3">FinRec</span>
          </div>

          <div className="hidden md:flex items-center space-x-8 text-gray-300 text-sm font-vi2">
            <button 
              onClick={() => scrollToSection('home')}
              className={`hover:text-white transition-colors ${activeSection === 'home' ? 'text-emerald-400' : ''}`}
            >
              Home
            </button>
            <button 
              onClick={() => scrollToSection('team')}
              className={`hover:text-white transition-colors ${activeSection === 'team' ? 'text-emerald-400' : ''}`}
            >
              Team
            </button>
            <button 
              onClick={() => scrollToSection('contact')}
              className={`hover:text-white transition-colors ${activeSection === 'contact' ? 'text-emerald-400' : ''}`}
            >
              Contact
            </button>
          </div>

          <a 
            href="/login"
            className="px-6 py-2 bg-emerald-300/10 backdrop-blur-sm border border-white/20 rounded-lg text-white text-sm hover:bg-white/20 transition-all"
          >
            Get Started →
          </a>
        </div>
      </nav>

      {/* Side Icons */}
      <div className="fixed left-8 top-1/4 z-40 space-y-8 hidden lg:block">
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

      {/* Hero Section */}
      <section ref={homeRef} className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-24">
        <div className="mb-6 px-4 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full inline-flex items-center space-x-2 font-vi2 animate-fade-in">
          <span className="text-gray-300 text-sm">
            AI-powered financial intelligence
          </span>
        </div>

        <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-center mb-8 bg-gradient-to-br from-blue-200 via-emerald-800 to-emerald-300 bg-clip-text text-transparent leading-tight tracking-tight font-vi3 animate-fade-in-up">
          Make it where it
          <br />
          happens
        </h1>

        <p className="text-gray-400 text-lg md:text-xl text-center max-w-2xl mb-12 font-vi2 animate-fade-in-up delay-200">
          Transform your financial decisions with intelligent insights and
          real-time market analysis
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 animate-fade-in-up delay-400">
          <a
            href="/login"
            className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-emerald-950 rounded-2xl text-white font-medium shadow-sm hover:scale-105 transition-all font-vi2 cursor-pointer"
            onMouseEnter={() => setIsHoveringCTA(true)}
            onMouseLeave={() => setIsHoveringCTA(false)}
          >
            Start Investing
          </a>

          <button className="px-8 py-4 bg-white/5 backdrop-blur-sm border border-white/20 rounded-2xl text-white font-medium hover:bg-white/10 transition-all flex items-center space-x-2 font-vi2">
            <Play className="w-4 h-4" fill="white" />
            <span>See how it works</span>
          </button>
        </div>

        {/* Bottom Right Animation */}
        <div className="absolute bottom-8 right-8 z-10 hidden lg:block">
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
      </section>

      {/* Team Section */}
      <section ref={teamRef} className="relative min-h-screen py-32 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-block px-4 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full mb-6">
              <span className="text-emerald-400 text-sm font-vi2">Meet the Minds</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-bold bg-gradient-to-br from-white via-gray-300 to-gray-500 bg-clip-text text-transparent mb-6 font-vi3">
              The Team Behind<br />This Project
            </h2>
            
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {teamMembers.map((member, index) => (
              <div
                key={index}
                className="team-card opacity-0 group"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-all duration-500 hover:scale-[1.02] hover:border-emerald-500/30">
                  {/* Gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-blue-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  <div className="relative flex flex-col md:flex-row items-center md:items-start gap-6">
                    {/* Image with animated border */}
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-2xl blur-xl opacity-0 transition-opacity duration-500"></div>
                      <div className="relative w-32 h-32 rounded-2xl overflow-hidden border-2 border-white/10  transition-all duration-500">
                        <img 
                          src={member.image} 
                          alt={member.name}
                          className="w-full h-full object-cover transform  transition-transform duration-700"
                        />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 text-center md:text-left">
                      <h3 className="text-2xl font-bold text-white mb-1 font-vi3 transition-colors duration-300">
                        {member.name}
                      </h3>
                      <p className="text-emerald-400 text-sm mb-3 font-vi2">{member.role}</p>
                      <p className="text-gray-400 text-sm mb-4 font-vi2 leading-relaxed">
                        {member.bio}
                      </p>

                      {/* Social Links */}
                      <div className="flex items-center justify-center md:justify-start gap-3">
                        <a 
                          href={member.social.linkedin}
                          className="w-9 h-9 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg flex items-center justify-center hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all duration-300 group/social"
                        >
                          <Linkedin className="w-4 h-4 text-gray-400 group-hover/social:text-emerald-400 transition-colors" />
                        </a>
                        <a 
                          href={member.social.twitter}
                          className="w-9 h-9 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg flex items-center justify-center hover:bg-blue-500/20 hover:border-blue-500/50 transition-all duration-300 group/social"
                        >
                          <Twitter className="w-4 h-4 text-gray-400 group-hover/social:text-blue-400 transition-colors" />
                        </a>
                        <a 
                          href={member.social.github}
                          className="w-9 h-9 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg flex items-center justify-center hover:bg-purple-500/20 hover:border-purple-500/50 transition-all duration-300 group/social"
                        >
                          <Github className="w-4 h-4 text-gray-400 group-hover/social:text-purple-400 transition-colors" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section ref={contactRef} className="relative min-h-screen py-32 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            
            <h2 className="text-5xl md:text-6xl font-bold bg-gradient-to-br from-white via-gray-300 to-gray-500 bg-clip-text text-transparent mb-6 font-vi3">
              May be <br />Get in touch ?
            </h2>
          
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-all duration-500">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2 font-vi2">Your Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500/50 transition-all font-vi2"
                    placeholder=""
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2 font-vi2">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500/50 transition-all font-vi2"
                    placeholder=""
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2 font-vi2">Subject</label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500/50 transition-all font-vi2"
                    placeholder=""
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2 font-vi2">Message</label>
                  <textarea
                    required
                    rows="5"
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500/50 transition-all resize-none font-vi2"
                    placeholder=""
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full px-6 py-4 bg-gradient-to-r from-emerald-500 to-emerald-950 rounded-xl text-white font-medium hover:scale-[1.02] transition-all flex items-center justify-center gap-2 font-vi2"
                >
                  <span>Send Message</span>
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>

            {/* Contact Info */}
            <div className="space-y-8">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-all duration-500 group">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Mail className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-2 font-vi3">Email Us</h3>
                    <p className="text-gray-400 text-sm font-vi2">saivinyas18@gmail.com</p>
                   
                  </div>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-all duration-500 group">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Phone className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-2 font-vi3">Call Us</h3>
                    <p className="text-gray-400 text-sm font-vi2">+91 8884180205</p>
                    <p className="text-gray-400 text-sm font-vi2">Any time at your service</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-all duration-500 group">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <MapPin className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-2 font-vi3">Visit Us</h3>
                    <p className="text-gray-400 text-sm font-vi2">RVITM</p>
                    <p className="text-gray-400 text-sm font-vi2">Bangalore,Karnataka</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4">
                <a href="#" className="w-12 h-12 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl flex items-center justify-center hover:bg-blue-500/20 hover:border-blue-500/50 transition-all">
                  <Linkedin className="w-5 h-5 text-gray-400 hover:text-emerald-400 transition-colors" />
                </a>
                <a href="#" className="w-12 h-12 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl flex items-center justify-center hover:bg-blue-500/20 hover:border-blue-500/50 transition-all">
                  <Twitter className="w-5 h-5 text-gray-400 hover:text-blue-400 transition-colors" />
                </a>
                <a href="#" className="w-12 h-12 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl flex items-center justify-center hover:bg-lime-500/20 hover:border-lime-500/50 transition-all">
                  <Github className="w-5 h-5 text-gray-400 hover:text-lime-400 transition-colors" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-white/10 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-white font-bold text-xl mb-4 font-vi3">FinGent</h3>
              <p className="text-gray-400 text-sm font-vi2">
                AI-powered financial intelligence for smarter investment decisions.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4 font-vi3">Product</h4>
              <ul className="space-y-2 text-gray-400 text-sm font-vi2">
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Features</a></li>
               
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4 font-vi3">Company</h4>
              <ul className="space-y-2 text-gray-400 text-sm font-vi2">
                <li><button onClick={() => scrollToSection('team')} className="hover:text-emerald-400 transition-colors">Team</button></li>
             
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4 font-vi3">Legal</h4>
              <ul className="space-y-2 text-gray-400 text-sm font-vi2">
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Terms</a></li>
                
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-sm font-vi2">
              © 2025 FinGent. All rights reserved.
            </p>
            <p className="text-gray-500 text-sm font-vi2">
              Educational purposes only. Not financial advice.
            </p>
          </div>
        </div>
      </footer>

      {/* Floating Elements */}
      <div className="fixed inset-0 pointer-events-none z-5">
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
        
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes fade-in-up {
          from { 
            opacity: 0;
            transform: translateY(30px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slide-in-left {
          from {
            opacity: 0;
            transform: translateX(-100px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
        
        @keyframes slide-in-right {
          from {
            opacity: 0;
            transform: translateX(100px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 1s ease-out;
        }
        
        .delay-200 {
          animation-delay: 0.2s;
          opacity: 0;
          animation-fill-mode: forwards;
        }
        
        .delay-400 {
          animation-delay: 0.4s;
          opacity: 0;
          animation-fill-mode: forwards;
        }
        
        .team-card {
          animation: slide-in-left 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        
        .team-card:nth-child(even) {
          animation: slide-in-right 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        
        .team-card.animate-in {
          animation-play-state: running;
        }
      `}</style>
    </div>
  );
};

export default FinancialAILanding;
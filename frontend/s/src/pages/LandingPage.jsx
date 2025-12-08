import React, { useState, useEffect, useRef } from "react";
import {
  TrendingUp,
  Lock,
  BarChart3,
  Play,
  Mail,
  Github,
  Linkedin,
    MapPin,
  Phone,
  Send,
  ArrowRight,
} from "lucide-react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const FinancialAILanding = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHoveringCTA, setIsHoveringCTA] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const canvasRef = useRef(null);
  const barsRef = useRef([]);
  const teamRef = useRef(null);
  const contactRef = useRef(null);
  const homeRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const progressBarRef = useRef(null);

  const teamMembers = [
    {
      name: "Saiyam N Bothra",
      role: "Team Lead and Ai Engineer",
      image:
        "",
      bio: "STILL THINKIN",
      social: { linkedin: "https:/linkedin.com/in/saiyamnbothra", github: "https://github.com/SaiyamJn" },
    },
    {
      name: "Sai Vinyas BS",
      role: "Frontend Lead and Backend Support",
      image:
        "",
        bio:"Caffeine hits Harder",
      social: { linkedin: "https:/linkedin.com/in/sai-vinyas-bs-864510296", github: "https://github.com/VINYAS-BTW" },
    },
    {
      name: "Sourabh V Katti",
      role: "Backend Lead and Frontend Support",
      image:
        "",
      bio: "Faster than Vande Bharat",
      social: { linkedin: "https:/linkedin.com/in/sourabh-katti-627374303", github: "https://github.com/sou9916" },
    },
  ];

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
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

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Horizontal scroll for team section
      const scrollContainer = scrollContainerRef.current;
      const progressBar = progressBarRef.current;

      if (scrollContainer && progressBar && teamRef.current) {
        const cards = scrollContainer.querySelector(".flex");
        if (!cards) return;

        const scrollWidth = cards.scrollWidth - window.innerWidth;

        // Create horizontal scroll animation
        const scrollTween = gsap.to(cards, {
          x: -scrollWidth,
          ease: "none",
          scrollTrigger: {
            trigger: teamRef.current,
            start: "top top",
            end: () => `+=${scrollWidth}`,
            scrub: 1,
            pin: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        // Progress bar animation
        gsap.to(progressBar, {
          width: "100%",
          ease: "none",
          scrollTrigger: {
            trigger: teamRef.current,
            start: "top top",
            end: () => `+=${scrollWidth}`,
            scrub: 0.3,
          },
        });

        // Parallax effect on cards
        gsap.utils.toArray(".team-card-horizontal").forEach((card) => {
          const img = card.querySelector("img");
          if (img) {
            gsap.fromTo(
              img,
              { scale: 1.2 },
              {
                scale: 1,
                ease: "none",
                scrollTrigger: {
                  trigger: card,
                  containerAnimation: scrollTween,
                  start: "left right",
                  end: "right left",
                  scrub: true,
                },
              }
            );
          }
        });
      }
    });

    return () => ctx.revert();
  }, []);

  const scrollToSection = (section) => {
    const refs = {
      home: homeRef,
      team: teamRef,
      contact: contactRef,
    };

    refs[section]?.current?.scrollIntoView({ behavior: "smooth" });
    setActiveSection(section);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    alert("Thank you! We'll get back to you soon.");
    setFormData({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <div className="relative w-full bg-black overflow-x-hidden">
      <canvas ref={canvasRef} className="fixed inset-0 z-0" />

      {/* Navigation */}
      <motion.nav
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 90, damping: 14 }}
        className="fixed top-3 left-1/2 -translate-x-1/2 w-[90%] md:w-[75%]
                 bg-black/40 backdrop-blur-xl border border-white/10 
                 rounded-full z-50 shadow-[0_4px_30px_rgba(0,0,0,0.4)]"
      >
        <div className="flex items-center justify-between px-8 py-4">
          {/* Logo → Goes to Home */}
          <motion.div
            onClick={() => scrollToSection("home")}
            whileHover={{ scale: 1.01 }}
            className="flex items-center space-x-2 cursor-pointer"
          >
            <span className="text-white font-bold text-2xl font-vi3 tracking-wide">
              FinGent
            </span>
          </motion.div>

          {/* Nav Links */}
          <div className="hidden md:flex items-center space-x-10 text-gray-300 text-sm font-vi2">
            {["home", "team", "contact"].map((sec) => (
              <motion.div
                key={sec}
                onClick={() => scrollToSection(sec)}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.95 }}
                className={`capitalize cursor-pointer ${
                  activeSection === sec
                    ? "text-emerald-400"
                    : "hover:text-white"
                }`}
              >
                {sec}
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <motion.a
            href="/login"
            whileHover={{
              scale: 1.06,
              boxShadow: "0px 0px 12px rgba(16,185,129,0.3)",
            }}
            whileTap={{ scale: 0.96 }}
            className="px-6 py-2 bg-emerald-300/10 backdrop-blur-sm border 
                     border-white/20 rounded-full text-white text-sm 
                     hover:bg-cyan-600/10 transition-all"
          >
            Get Started →
          </motion.a>
        </div>
      </motion.nav>

      {/* Side Icons */}
      <div className="fixed left-8 top-1/4 z-40 space-y-8 hidden lg:block">
        <div className="group ">
          <div className="w-12 h-12 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-blue-400" />
          </div>
          <p className="text-gray-200 text-xs mt-2 ">Analytics</p>
          <p className="text-gray-200 text-xs">3 tools</p>
        </div>

        <div className="w-32 h-px bg-gradient-to-r from-white/20 to-transparent"></div>

        <div className="group ">
          <div className="w-12 h-12 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl flex items-center justify-center">
            <Lock className="w-6 h-6 text-emerald-400" />
          </div>
          <p className="text-gray-400 text-xs mt-2">Security</p>
        </div>
      </div>

      {/* Hero Section */}

      <section
        ref={homeRef}
        className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-24 overflow-hidden"
      >
        {/* BACKGROUND ORBS (TRENDY AS HELL) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 0.35, scale: 1 }}
          transition={{ duration: 2, ease: "easeOut" }}
          className="absolute top-32 left-20 w-72 h-72 bg-emerald-500/20 blur-3xl rounded-full"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 0.25, scale: 1 }}
          transition={{ duration: 2, delay: 0.3, ease: "easeOut" }}
          className="absolute bottom-16 right-16 w-64 h-64 bg-blue-500/20 blur-3xl rounded-full"
        />

        {/* BADGE */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-6 px-4 py-2 bg-white/5 backdrop-blur-sm border border-white/10 
                   rounded-full inline-flex items-center space-x-2 font-vi2"
        >
          <span className="text-gray-300 text-sm">
            AI-powered financial intelligence
          </span>
        </motion.div>

        {/* HEADLINE */}
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.7,
            ease: [0.25, 0.1, 0.25, 1], // smooth cubic bezier
          }}
          className="text-6xl md:text-7xl lg:text-8xl font-bold text-center mb-8 
                   bg-gradient-to-br from-blue-200 via-emerald-800 to-emerald-300
                   bg-clip-text text-transparent leading-tight tracking-tight font-vi3"
        >
          Make it where it
          <br />
          happens
        </motion.h1>

        {/* SUBTEXT */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          whileHover={{ y: 0, opacity: 1 }}
          className="text-gray-400 text-lg md:text-xl text-center max-w-2xl mb-12 font-vi2"
        >
          Transform your financial decisions with intelligent insights and
          real-time market analysis
        </motion.p>

        {/* CTA BUTTONS */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0, y: 20 },
            show: {
              opacity: 1,
              y: 0,
              transition: {
                delay: 0.5,
                staggerChildren: 0.12,
                ease: "easeOut",
              },
            },
          }}
          className="flex flex-col sm:flex-row items-center gap-4"
        >
          <motion.a
            href="/login"
            variants={{
              hidden: { opacity: 0, y: 20 },
              show: { opacity: 1, y: 0 },
            }}
            whileHover={{
              scale: 1.01,
              boxShadow: "0 0 20px rgba(16,185,129,0.35)",
              transition: { type: "spring", stiffness: 180, damping: 12 },
            }}
            whileTap={{ scale: 0.97 }}
            onMouseEnter={() => setIsHoveringCTA(true)}
            onMouseLeave={() => setIsHoveringCTA(false)}
            className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-emerald-950 
                     rounded-2xl text-white font-medium shadow-sm cursor-pointer font-vi2"
          >
            Start Investing
          </motion.a>

          <motion.button
            variants={{
              hidden: { opacity: 0, y: 20 },
              show: { opacity: 1, y: 0 },
            }}
            whileHover={{
              scale: 1.01,
              backgroundColor: "rgba(255,255,255,0.08)",
            }}
            whileTap={{ scale: 0.97 }}
            className="px-8 py-4 bg-white/5  border border-white/20 
                     rounded-2xl text-white font-medium transition-all flex items-center space-x-2 font-vi2 cursor-pointer"
          >
            <Play className="w-4 h-4" fill="white" />
            <span>See how it works</span>
          </motion.button>
        </motion.div>

        {/* Market Animation – Now Animated */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
          className="absolute bottom-8 right-8 z-10 hidden lg:block"
        >
          <div className="relative">
            {/* Bars */}
            <div className="px-4 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg mb-4">
              <p className="text-gray-400 text-xs mb-1">Market Trends</p>
              <div className="flex items-end space-x-1 h-16">
                {[45, 60, 35, 80, 50, 70, 40, 65].map((h, i) => (
                  <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{
                      duration: 0.8,
                      delay: i * 0.05,
                      ease: [0.16, 1, 0.3, 1], // smooth accelerated curve
                    }}
                    className="w-1.5 bg-gradient-to-t from-blue-500 to-emerald-400 rounded-full"
                  />
                ))}
              </div>
            </div>

            {/* Icon Pulse */}
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.5 }}
              className="w-16 h-16 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl 
                       flex items-center justify-center"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{
                  repeat: Infinity,
                  duration: 2,
                  ease: "easeInOut",
                }}
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-emerald-500/20 
                         flex items-center justify-center"
              >
                <TrendingUp className="w-6 h-6 text-emerald-400" />
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Team Section */}
      <section
        ref={teamRef}
        className="relative min-h-screen py-32 overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-4 mb-16">
          <div className="text-center">
            <h2 className="text-5xl md:text-6xl font-bold bg-gradient-to-br from-white via-gray-300 to-gray-500 bg-clip-text text-transparent mb-6 font-vi3">
              The Team Behind
              <br />
              This Project
            </h2>
          </div>
        </div>

        {/* Horizontal Scroll Container */}
        <div ref={scrollContainerRef} className="relative">
          <div className="flex gap-8 px-4" style={{ width: "max-content" }}>
            {teamMembers.map((member, index) => (
              <div
                key={index}
                className="team-card-horizontal group"
                style={{ width: "450px" }}
              >
                <div className="relative bg-white/5 border border-white/10 rounded-4xl p-8 h-full hover:bg-white/10 transition-all duration-500 hover:scale-[1.01] hover:border-emerald-500/30">
                  {/* Gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-blue-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>

                  <div className="relative flex flex-col items-center gap-6">
                    {/* Image with animated border */}
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <div className="relative w-40 h-40 rounded-2xl overflow-hidden border-2 border-white/10 group-hover:border-emerald-500/50 transition-all duration-500">
                        <img
                          src={member.image}
                          alt={member.name}
                          className="w-full h-full object-cover transform group-hover:scale-101 transition-transform duration-700"
                        />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 text-center">
                      <h3 className="text-2xl font-bold text-white mb-1 font-vi3 group-hover:text-emerald-400 transition-colors duration-300">
                        {member.name}
                      </h3>
                      <p className="text-emerald-400 text-sm mb-4 font-vi2">
                        {member.role}
                      </p>
                      <p className="text-gray-400 text-sm mb-6 font-vi2 leading-relaxed">
                        {member.bio}
                      </p>

                      {/* Social Links */}
                      <div className="flex items-center justify-center gap-3">
                        <a
                          href={member.social.linkedin}
                          className="w-10 h-10 bg-white/5  border-white/10 rounded-full flex items-center justify-center hover:bg-cyan-900/20 hover:border-emerald-500/50 transition-all duration-300 group/social"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Linkedin className="w-5 h-5 text-gray-400 group-hover/social:text-cyan-200 transition-colors" />
                        </a>
                        
                        <a
                          href={member.social.github}
                          className="w-10 h-10 bg-white/5  rounded-full flex items-center justify-center hover:bg-lime-900/20 hover:border-purple-500/50 transition-all duration-300 group/social"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Github className="w-5 h-5 text-gray-400 group-hover/social:text-lime-200 transition-colors" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="max-w-7xl mx-auto px-4 mt-12">
          <div className="relative h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              ref={progressBarRef}
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-emerald-500 via-emerald-900 to-cyan-500 rounded-full transition-all duration-300"
              style={{ width: "0%" }}
            ></div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section ref={contactRef} className="relative min-h-screen py-32 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold bg-gradient-to-br from-white via-gray-300 to-gray-500 bg-clip-text text-transparent mb-6 font-vi3">
              May be <br />
              Get in touch ?
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-all duration-500">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2 font-vi2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500/50 transition-all font-vi2"
                    placeholder=""
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2 font-vi2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500/50 transition-all font-vi2"
                    placeholder=""
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2 font-vi2">
                    Subject
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) =>
                      setFormData({ ...formData, subject: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500/50 transition-all font-vi2"
                    placeholder=""
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2 font-vi2">
                    Message
                  </label>
                  <textarea
                    required
                    rows="5"
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
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
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-4xl p-8 hover:bg-white/10 transition-all duration-500 group">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-cyan-500/10 rounded-3xl flex items-center justify-center group-hover:scale-101 transition-transform duration-300">
                    <Mail className="w-6 h-6 text-lime-800" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-2 font-vi3">
                      Email Us
                    </h3>
                    <p className="text-gray-400 text-sm font-vi2">
                      saiyam983@gmail.com
                    </p>
                    <p className="text-gray-400 text-sm font-vi2">
                      saivinyas18@gmail.com
                    </p>
                    <p className="text-gray-400 text-sm font-vi2">
                      kattisourabh99@gmail.com
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-4xl p-8 hover:bg-white/10 transition-all duration-500 group">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-cyan-500/10 rounded-3xl flex items-center justify-center group-hover:scale-101 transition-transform duration-300">
                    <MapPin className="w-6 h-6 text-lime-800" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-2 font-vi3">
                      Our Location
                    </h3>
                    <p className="text-gray-400 text-sm font-vi2">
                      RV Institute of Technology & Management
                    </p>
                    <p className="text-gray-400 text-sm font-vi2">
                      Bangalore, Karnataka
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-4xl p-8 hover:bg-white/10 transition-all duration-500 group">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-cyan-500/10 rounded-3xl flex items-center justify-center group-hover:scale-101 transition-transform duration-300">
                    <Phone className="w-6 h-6 text-lime-800" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-2 font-vi3">
                      Call Us
                    </h3>
                    <p className="text-gray-400 text-sm font-vi2">
                      +91 xxx xxx xxxx
                    </p>
                    <p className="text-gray-400 text-sm font-vi2">
                      +91 xxx xxx xxxx
                    </p>
                    <p className="text-gray-400 text-sm font-vi2">
                      +91 xxx xxx xxxx
                    </p>
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-4xl p-8 hover:bg-white/10 transition-all duration-500 ">
                <h3 className="text-white font-semibold mb-4 font-vi3">
                  Follow Us
                </h3>

                <div className="flex items-center gap-4">
                  <a
                    href="#"
                    className="w-12 h-12 bg-white/5   border-white/10 rounded-3xl flex items-center justify-center hover:bg-blue-500/20 hover:border-blue-500/40 transition-all"
                  >
                    <Linkedin className="w-5 h-5 text-gray-300" />
                  </a>
                  
                  <a
                    href="#"
                    className="w-12 h-12 bg-white/5  border-white/10 rounded-3xl flex items-center justify-center hover:bg-green-900/20 hover:border-green-500/40 transition-all"
                  >
                    <Github className="w-5 h-5 text-gray-300" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* END OF PAGE */}
      <footer className="relative mt-20 bg-black/40 backdrop-blur-xl border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            {/* Brand */}
            <div>
              <h3 className="text-white text-2xl font-bold font-vi3 mb-4">
                FinGent
              </h3>
              <p className="text-gray-400 text-sm font-vi2 leading-relaxed">
                Intelligence that elevates financial decision-making.
                <br />
              </p>

              {/* Social Icons */}
              <div className="flex items-center gap-4 mt-6">
                <a className="w-10 h-10 bg-white/5  rounded-3xl flex items-center justify-center hover:bg-blue-500/20 hover:border-cyan-500/40 transition-all cursor-pointer">
                  <Linkedin className="w-5 h-5 text-gray-300" />
                </a>
                
                <a className="w-10 h-10 bg-white/5  rounded-3xl flex items-center justify-center hover:bg-lime-500/20 hover:border-lime-900/40 transition-all cursor-pointer">
                  <Github className="w-5 h-5 text-gray-300" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-white font-semibold mb-4 font-vi3">
                Quick Links
              </h4>
              <ul className="space-y-3 text-gray-400 text-sm font-vi2">
                <li className="hover:text-white cursor-pointer transition-all">
                  Home
                </li>
                <li className="hover:text-white cursor-pointer transition-all">
                  Team
                </li>
                <li className="hover:text-white cursor-pointer transition-all">
                  Contact
                </li>
              </ul>
            </div>

            {/* Services */}
            <div>
              <h4 className="text-white font-semibold mb-4 font-vi3">
                Services
              </h4>
              <ul className="space-y-3 text-gray-400 text-sm font-vi2">
                <li className="hover:text-white cursor-pointer transition-all">
                  Market Insights
                </li>
                <li className="hover:text-white cursor-pointer transition-all">
                  Risk Analysis
                </li>
                <li className="hover:text-white cursor-pointer transition-all">
                  Portfolio Tools
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-white font-semibold mb-4 font-vi3">
                Contact
              </h4>
              <p className="text-gray-400 text-sm font-vi2">RVITM, Bangalore</p>
              <p className="text-gray-400 text-sm font-vi2 mt-2">
                Bangalore, India
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="w-full h-px bg-white/10 my-12"></div>

          {/* Bottom Note */}
          <div className="flex flex-col md:flex-row items-center justify-between text-gray-500 text-sm font-vi2">
            <p>© {new Date().getFullYear()} FinGent — All Rights Reserved.</p>

            <div className="flex items-center gap-6 mt-4 md:mt-0">
              <p className="hover:text-gray-300 cursor-pointer transition-all">
                Terms
              </p>
              <p className="hover:text-gray-300 cursor-pointer transition-all">
                Privacy
              </p>
              <p className="hover:text-gray-300 cursor-pointer transition-all">
                Cookies
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default FinancialAILanding;

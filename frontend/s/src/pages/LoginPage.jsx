import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();

    // Simplified login
    if (email.trim() !== "") {
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="bg-neutral-900 p-10 rounded-2xl w-[350px] border border-neutral-700">
        <h2 className="text-3xl font-bold mb-3">Sign In</h2>
        <p className="text-gray-400 mb-6">
          Continue to Financial Research AI Agent
        </p>

        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Enter email"
            className="w-full py-2 px-3 rounded-lg bg-neutral-800 border border-neutral-700 text-white"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <button
            type="submit"
            className="w-full mt-5 py-2 bg-cyan-500 rounded-lg font-semibold hover:bg-cyan-400 transition"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}

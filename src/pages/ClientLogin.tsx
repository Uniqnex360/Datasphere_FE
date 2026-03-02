import { useState, FormEvent, useEffect } from "react";
import { AuthAPI } from "../lib/api";

interface LoginProps {
  onLogin: () => void;
}

export function ClientLogin({ onLogin }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [clientName, setClientName] = useState<string | null>(null);
  const [isValidClient, setIsValidClient] = useState<boolean | null>(null);

  // ✅ Validate client from URL
  useEffect(() => {
    const validateClient = async () => {
      const path = window.location.pathname; // e.g. "/final%20test"
      const segments = path.split("/").filter(Boolean);

      if (segments.length === 0) {
        setIsValidClient(false);
        return;
      }

      // Decode URI component to handle spaces or special characters
      const client = decodeURIComponent(segments[0]);
      setClientName(client);

      try {
        const response = await AuthAPI.validateClient(client);

        if (response.exists) {
          setIsValidClient(true);
        } else {
          setIsValidClient(false);
        }
      } catch (err) {
        console.error(err);
        setIsValidClient(false);
      }
    };

    validateClient();
  }, []);

  // ✅ Loading screen while validating
  if (isValidClient === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600 text-lg animate-pulse">
          Validating client portal...
        </div>
      </div>
    );
  }

  // ✅ 404 Page if client not found
  if (isValidClient === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-7xl font-extrabold text-red-600">404</h1>
          <p className="mt-4 text-xl font-semibold text-gray-800">
            Client Portal Not Found
          </p>
          <p className="mt-2 text-gray-500">
            The client you are trying to access does not exist.
          </p>
        </div>
      </div>
    );
  }

  // ✅ Normal Login Flow
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      params.append("username", username);
      params.append("password", password);

      const data = await AuthAPI.login(params);

      // Optional: ensure logged user belongs to this client
      console.log(data, clientName);
      if (data.full_name !== clientName) {
        setError("Invalid client credentials");
        setLoading(false);
        return;
      }

      localStorage.setItem("token", data.access_token);
      localStorage.setItem("isAuthenticated", "true");
      onLogin();
    } catch (err) {
      console.error(err);
      setError("Invalid username or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-xl mb-4">
              <img src="./Datasphere-logo (1).png" alt="Logo" />
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {clientName?.toUpperCase()}
            </h1>

            <p className="text-gray-600">Client Portal for {clientName}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError("");
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter your username"
                required
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter your password"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Powered by DataSphere PIM © 2025
          </p>
        </div>
      </div>
    </div>
  );
}

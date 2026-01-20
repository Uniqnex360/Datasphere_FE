import { useState, FormEvent } from 'react';
import { AuthAPI } from '../lib/api';

interface LoginProps {
  onLogin: () => void;
}

export function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading,setLoading]=useState(false)

  const handleSubmit = async(e: FormEvent) => {
    e.preventDefault();
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams();
      params.append('username', username);
      params.append('password', password);
      const data=await AuthAPI.login(params)
      localStorage.setItem('token',data.access_token)
      localStorage.setItem('isAuthenticated', 'true');
      onLogin()
    } catch (error) {
      console.error(error)
      setError("Invalid username or password")
    }
    finally{
      setLoading(false)
    }
    // if (username === 'admin' && password === 'admin123') {
    //   onLogin();
    // } else {
    //   setError('Invalid username or password');
    // }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-xl mb-4">
              <img src='./Datasphere-logo (1).png'/>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">DataSphere</h1>
            <p className="text-gray-600">Product Information Management System</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError('');
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter your username"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
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
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Powered by DataSphere PIM &copy; 2025
          </p>
        </div>
      </div>
    </div>
  );
}

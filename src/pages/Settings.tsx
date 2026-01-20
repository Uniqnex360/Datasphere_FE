import { useState } from 'react';
import { Bell, Database, Globe, Lock, Palette, Save } from 'lucide-react';

export function Settings() {
  const [settings, setSettings] = useState({
    companyName: 'My PIM System',
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    notifications: {
      importComplete: true,
      exportComplete: true,
      lowCompleteness: false,
    },
    dataQuality: {
      minCompleteness: 80,
      minAccuracy: 90,
    },
    theme: 'light',
  });

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Configure your PIM system preferences</p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Save size={20} />
          Save Changes
        </button>
      </div>

      {saved && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 font-medium">Settings saved successfully!</p>
        </div>
      )}

      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Globe className="text-blue-600" size={24} />
            <h2 className="text-lg font-semibold text-gray-900">General Settings</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Name
              </label>
              <input
                type="text"
                value={settings.companyName}
                onChange={(e) =>
                  setSettings({ ...settings, companyName: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Timezone
                </label>
                <select
                  value={settings.timezone}
                  onChange={(e) =>
                    setSettings({ ...settings, timezone: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date Format
                </label>
                <select
                  value={settings.dateFormat}
                  onChange={(e) =>
                    setSettings({ ...settings, dateFormat: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="text-blue-600" size={24} />
            <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
          </div>
          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.notifications.importComplete}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    notifications: {
                      ...settings.notifications,
                      importComplete: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div>
                <div className="text-sm font-medium text-gray-900">Import Complete</div>
                <div className="text-xs text-gray-600">
                  Get notified when product imports are complete
                </div>
              </div>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.notifications.exportComplete}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    notifications: {
                      ...settings.notifications,
                      exportComplete: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div>
                <div className="text-sm font-medium text-gray-900">Export Complete</div>
                <div className="text-xs text-gray-600">
                  Get notified when product exports are ready
                </div>
              </div>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.notifications.lowCompleteness}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    notifications: {
                      ...settings.notifications,
                      lowCompleteness: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div>
                <div className="text-sm font-medium text-gray-900">Low Completeness Alert</div>
                <div className="text-xs text-gray-600">
                  Get notified when products have low completeness scores
                </div>
              </div>
            </label>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Database className="text-blue-600" size={24} />
            <h2 className="text-lg font-semibold text-gray-900">Data Quality</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Completeness Score (%)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.dataQuality.minCompleteness}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      dataQuality: {
                        ...settings.dataQuality,
                        minCompleteness: parseInt(e.target.value),
                      },
                    })
                  }
                  className="flex-1"
                />
                <span className="text-sm font-medium text-gray-900 w-12 text-right">
                  {settings.dataQuality.minCompleteness}%
                </span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Accuracy Score (%)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.dataQuality.minAccuracy}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      dataQuality: {
                        ...settings.dataQuality,
                        minAccuracy: parseInt(e.target.value),
                      },
                    })
                  }
                  className="flex-1"
                />
                <span className="text-sm font-medium text-gray-900 w-12 text-right">
                  {settings.dataQuality.minAccuracy}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Palette className="text-blue-600" size={24} />
            <h2 className="text-lg font-semibold text-gray-900">Appearance</h2>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Theme</label>
            <div className="flex gap-3">
              <button
                onClick={() => setSettings({ ...settings, theme: 'light' })}
                className={`flex-1 p-4 border-2 rounded-lg transition-colors ${
                  settings.theme === 'light'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-gray-900 mb-1">Light</div>
                <div className="text-xs text-gray-600">Default theme</div>
              </button>
              <button
                onClick={() => setSettings({ ...settings, theme: 'dark' })}
                className={`flex-1 p-4 border-2 rounded-lg transition-colors ${
                  settings.theme === 'dark'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-gray-900 mb-1">Dark</div>
                <div className="text-xs text-gray-600">Coming soon</div>
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Lock className="text-blue-600" size={24} />
            <h2 className="text-lg font-semibold text-gray-900">Security</h2>
          </div>
          <div className="space-y-4">
            <button className="w-full text-left px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="font-medium text-gray-900 mb-1">Change Password</div>
              <div className="text-sm text-gray-600">Update your account password</div>
            </button>
            <button className="w-full text-left px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="font-medium text-gray-900 mb-1">Two-Factor Authentication</div>
              <div className="text-sm text-gray-600">Add an extra layer of security</div>
            </button>
            <button className="w-full text-left px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="font-medium text-gray-900 mb-1">API Keys</div>
              <div className="text-sm text-gray-600">Manage API access keys</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

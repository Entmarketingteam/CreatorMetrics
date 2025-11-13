import LTKConnectionSettings from '../components/LTKConnectionSettings';

export default function Settings() {
  return (
    <div className="space-y-4 sm:space-y-6 w-full overflow-x-hidden">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">Manage your account and platform connections.</p>
      </div>

      <LTKConnectionSettings />

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Account Settings</h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Additional account settings and preferences will be available in the next update.
        </p>
      </div>
    </div>
  );
}

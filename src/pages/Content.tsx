export default function Content() {
  return (
    <div className="space-y-4 sm:space-y-6 w-full overflow-x-hidden">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Content Performance</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">Track how your social content drives sales.</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 sm:p-12 text-center w-full overflow-hidden">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">Content Tracking Coming Soon</h3>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6">
            Connect your social media accounts to track which posts drive the most sales and engagement.
          </p>
          <button className="px-6 py-3 bg-indigo-600 text-white text-sm sm:text-base rounded-lg hover:bg-indigo-700 transition-colors font-medium">
            Connect Instagram
          </button>
        </div>
      </div>
    </div>
  );
}

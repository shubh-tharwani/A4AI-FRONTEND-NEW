import { motion } from 'framer-motion';
import type { AgenticPipelineStatus } from '../../types/agentic';

interface StatusPanelProps {
  status: AgenticPipelineStatus;
}

export default function StatusPanel({ status }: StatusPanelProps) {
  const getStatusColor = () => {
    switch (status.status) {
      case 'running':
        return 'text-blue-600 bg-blue-50';
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = () => {
    switch (status.status) {
      case 'running':
        return (
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        );
      case 'completed':
        return (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'failed':
        return (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01" />
          </svg>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-lg p-4 text-sm"
    >
      <div className="font-medium mb-2">Pipeline Status</div>
      <div className={`flex items-center space-x-2 rounded-md px-3 py-2 ${getStatusColor()}`}>
        {getStatusIcon()}
        <span className="capitalize">{status.status}</span>
      </div>
      {status.current_task && (
        <div className="mt-2 text-gray-600">
          <div className="text-xs font-medium">Current Task:</div>
          <div className="truncate">{status.current_task}</div>
          {status.progress !== undefined && (
            <div className="mt-2">
              <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-blue-600"
                  initial={{ width: 0 }}
                  animate={{ width: `${status.progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <div className="text-xs text-right mt-1">{status.progress}%</div>
            </div>
          )}
        </div>
      )}
      {status.error && (
        <div className="mt-2 text-red-600 text-xs">
          <div className="font-medium">Error:</div>
          <div>{status.error}</div>
        </div>
      )}
    </motion.div>
  );
}

import React from 'react';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface AdkStatusIndicatorProps {
  adkStatus?: {
    implementation: 'real' | 'mock';
    description: string;
    framework: string;
  };
  className?: string;
}

export const AdkStatusIndicator: React.FC<AdkStatusIndicatorProps> = ({ 
  adkStatus, 
  className = '' 
}) => {
  if (!adkStatus) return null;

  const isReal = adkStatus.implementation === 'real';
  const isMock = adkStatus.implementation === 'mock';

  return (
    <div className={`flex items-center space-x-2 text-xs ${className}`}>
      {isReal && (
        <>
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span className="text-green-700 font-medium">Real Google ADK</span>
        </>
      )}
      {isMock && (
        <>
          <AlertTriangle className="w-4 h-4 text-orange-600" />
          <span className="text-orange-700 font-medium">Mock ADK Implementation</span>
        </>
      )}
      <div 
        className="inline-flex items-center cursor-help" 
        title={`${adkStatus.description} - ${adkStatus.framework}`}
      >
        <Info className="w-3 h-3 text-slate-400" />
      </div>
    </div>
  );
}; 
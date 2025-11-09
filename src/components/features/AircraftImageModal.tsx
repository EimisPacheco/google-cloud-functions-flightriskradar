import React from 'react';
import { X, Plane, Gauge, Users, MapPin, Calendar, Info } from 'lucide-react';
import { useDarkMode } from '../../context/DarkModeContext';
import { useTranslation } from '../../context/TranslationContext';
import TranslatedText from '../TranslatedText';
import { AircraftInfo, getAircraftImageUrl } from '../../utils/aircraftData';

interface AircraftImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  aircraftInfo: AircraftInfo;
  aircraftModel: string;
}

const AircraftImageModal: React.FC<AircraftImageModalProps> = ({
  isOpen,
  onClose,
  aircraftInfo,
  aircraftModel
}) => {
  const { isDarkMode } = useDarkMode();
  const { currentLanguage } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`relative w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden ${
        isDarkMode ? 'bg-slate-800' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`relative p-6 border-b ${
          isDarkMode ? 'border-slate-700' : 'border-slate-200'
        }`}>
          <button
            onClick={onClose}
            className={`absolute top-4 right-4 p-2 rounded-lg transition-colors ${
              isDarkMode 
                ? 'hover:bg-slate-700 text-slate-300' 
                : 'hover:bg-slate-100 text-slate-600'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              isDarkMode ? 'bg-slate-700' : 'bg-slate-100'
            }`}>
              <Plane className={`w-6 h-6 ${
                isDarkMode ? 'text-blue-400' : 'text-blue-600'
              }`} />
            </div>
            <div>
              <h2 className={`text-2xl font-bold ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}>
                {aircraftInfo.name}
              </h2>
              <p className={`text-sm ${
                isDarkMode ? 'text-slate-400' : 'text-slate-600'
              }`}>
                <TranslatedText text={`Manufactured by ${aircraftInfo.manufacturer}`} targetLanguage={currentLanguage} />
              </p>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {/* Aircraft Image */}
          <div className={`relative rounded-xl overflow-hidden mb-6 ${
            isDarkMode ? 'bg-slate-900' : 'bg-slate-100'
          }`}>
            <img
              src={getAircraftImageUrl(aircraftInfo.imageId)}
              alt={aircraftInfo.name}
              className="w-full h-auto object-contain"
              style={{ maxHeight: '400px' }}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://images.unsplash.com/photo-1556388158-158ea5ccacbd?w=800&h=400&fit=crop';
              }}
            />
            <div className={`absolute bottom-4 left-4 px-3 py-1 rounded-lg backdrop-blur-sm ${
              isDarkMode ? 'bg-slate-800/80' : 'bg-white/80'
            }`}>
              <p className={`text-sm font-medium ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}>
                {aircraftModel}
              </p>
            </div>
          </div>
          
          {/* Aircraft Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Capacity */}
            <div className={`p-4 rounded-lg ${
              isDarkMode ? 'bg-slate-700' : 'bg-slate-50'
            }`}>
              <div className="flex items-center space-x-2 mb-2">
                <Users className={`w-4 h-4 ${
                  isDarkMode ? 'text-blue-400' : 'text-blue-600'
                }`} />
                <span className={`font-medium ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}>
                  <TranslatedText text="Passenger Capacity" targetLanguage={currentLanguage} />
                </span>
              </div>
              <p className={`text-lg font-semibold ${
                isDarkMode ? 'text-slate-200' : 'text-slate-700'
              }`}>
                {aircraftInfo.capacity}
              </p>
            </div>
            
            {/* Range */}
            <div className={`p-4 rounded-lg ${
              isDarkMode ? 'bg-slate-700' : 'bg-slate-50'
            }`}>
              <div className="flex items-center space-x-2 mb-2">
                <MapPin className={`w-4 h-4 ${
                  isDarkMode ? 'text-green-400' : 'text-green-600'
                }`} />
                <span className={`font-medium ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}>
                  <TranslatedText text="Maximum Range" targetLanguage={currentLanguage} />
                </span>
              </div>
              <p className={`text-lg font-semibold ${
                isDarkMode ? 'text-slate-200' : 'text-slate-700'
              }`}>
                {aircraftInfo.range}
              </p>
            </div>
            
            {/* Cruise Speed */}
            <div className={`p-4 rounded-lg ${
              isDarkMode ? 'bg-slate-700' : 'bg-slate-50'
            }`}>
              <div className="flex items-center space-x-2 mb-2">
                <Gauge className={`w-4 h-4 ${
                  isDarkMode ? 'text-purple-400' : 'text-purple-600'
                }`} />
                <span className={`font-medium ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}>
                  <TranslatedText text="Cruise Speed" targetLanguage={currentLanguage} />
                </span>
              </div>
              <p className={`text-lg font-semibold ${
                isDarkMode ? 'text-slate-200' : 'text-slate-700'
              }`}>
                {aircraftInfo.cruiseSpeed}
              </p>
            </div>
            
            {/* First Flight */}
            <div className={`p-4 rounded-lg ${
              isDarkMode ? 'bg-slate-700' : 'bg-slate-50'
            }`}>
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className={`w-4 h-4 ${
                  isDarkMode ? 'text-orange-400' : 'text-orange-600'
                }`} />
                <span className={`font-medium ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}>
                  <TranslatedText text="First Flight" targetLanguage={currentLanguage} />
                </span>
              </div>
              <p className={`text-lg font-semibold ${
                isDarkMode ? 'text-slate-200' : 'text-slate-700'
              }`}>
                {aircraftInfo.firstFlight}
              </p>
            </div>
          </div>
          
          {/* Description */}
          <div className={`p-4 rounded-lg ${
            isDarkMode ? 'bg-slate-700' : 'bg-slate-50'
          }`}>
            <div className="flex items-center space-x-2 mb-2">
              <Info className={`w-4 h-4 ${
                isDarkMode ? 'text-slate-400' : 'text-slate-600'
              }`} />
              <span className={`font-medium ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}>
                <TranslatedText text="About this Aircraft" targetLanguage={currentLanguage} />
              </span>
            </div>
            <p className={`text-sm leading-relaxed ${
              isDarkMode ? 'text-slate-300' : 'text-slate-600'
            }`}>
              <TranslatedText text={aircraftInfo.description} targetLanguage={currentLanguage} />
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AircraftImageModal;
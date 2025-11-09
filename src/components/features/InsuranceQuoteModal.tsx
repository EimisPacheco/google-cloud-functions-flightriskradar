import React, { useState } from 'react';
import { X, Shield, User, Calendar, DollarSign, Phone, Mail, MapPin, CheckCircle, AlertCircle } from 'lucide-react';
import { Flight } from '../../context/FlightContext';
import TranslatedText from '../TranslatedText';
import { useTranslation } from '../../context/TranslationContext';
import { useDarkMode } from '../../context/DarkModeContext';

interface InsuranceOption {
  id: string;
  provider: string;
  planName: string;
  price: number;
  rating: number;
  coverage: {
    tripCancellation: number;
    tripInterruption: number;
    baggage: number;
    medical: number;
    flightDelay: number;
  };
  highlights: string[];
  bestFor: string;
  color: string;
}

interface InsuranceQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  flight: Flight;
  selectedInsurance: InsuranceOption;
}

interface QuoteFormData {
  // Personal Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  
  // Trip Information
  tripCost: number;
  departureDate: string;
  returnDate: string;
  destination: string;
  travelers: number;
  
  // Coverage Preferences
  coverageLevel: 'basic' | 'standard' | 'premium';
  addOns: string[];
  
  // Medical Information
  preExistingConditions: boolean;
  medicalDetails: string;
}

export const InsuranceQuoteModal: React.FC<InsuranceQuoteModalProps> = ({
  isOpen,
  onClose,
  flight,
  selectedInsurance
}) => {
  const { currentLanguage } = useTranslation();
  const { isDarkMode } = useDarkMode();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quoteGenerated, setQuoteGenerated] = useState(false);
  const [finalQuote, setFinalQuote] = useState<number | null>(null);

  const [formData, setFormData] = useState<QuoteFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    tripCost: flight.price,
    departureDate: '',
    returnDate: '',
    destination: flight.arrival.airport.city,
    travelers: 1,
    coverageLevel: 'standard',
    addOns: [],
    preExistingConditions: false,
    medicalDetails: ''
  });

  const steps = [
    { number: 1, title: 'Personal Info', icon: User },
    { number: 2, title: 'Trip Details', icon: Calendar },
    { number: 3, title: 'Coverage Options', icon: Shield },
    { number: 4, title: 'Review & Quote', icon: DollarSign }
  ];

  const availableAddOns = [
    { id: 'cancel-any-reason', name: 'Cancel for Any Reason', price: 45, description: 'Get 75% refund for any reason' },
    { id: 'adventure-sports', name: 'Adventure Sports Coverage', price: 25, description: 'Coverage for skiing, diving, etc.' },
    { id: 'rental-car', name: 'Rental Car Protection', price: 15, description: 'Collision damage waiver' },
    { id: 'business-equipment', name: 'Business Equipment', price: 35, description: 'Laptop, camera, work tools' },
    { id: 'pet-coverage', name: 'Pet Coverage', price: 20, description: 'Emergency pet boarding' }
  ];

  if (!isOpen) return null;

  const handleInputChange = (field: keyof QuoteFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddOnToggle = (addOnId: string) => {
    setFormData(prev => ({
      ...prev,
      addOns: prev.addOns.includes(addOnId)
        ? prev.addOns.filter(id => id !== addOnId)
        : [...prev.addOns, addOnId]
    }));
  };

  const calculateFinalQuote = () => {
    let basePrice = selectedInsurance.price;
    
    // Coverage level adjustments
    const coverageMultiplier = {
      basic: 0.8,
      standard: 1.0,
      premium: 1.3
    };
    
    basePrice *= coverageMultiplier[formData.coverageLevel];
    
    // Add-ons
    const addOnCosts = formData.addOns.reduce((total, addOnId) => {
      const addOn = availableAddOns.find(a => a.id === addOnId);
      return total + (addOn?.price || 0);
    }, 0);
    
    // Age adjustment (simplified)
    const age = formData.dateOfBirth ? new Date().getFullYear() - new Date(formData.dateOfBirth).getFullYear() : 30;
    const ageMultiplier = age > 65 ? 1.4 : age > 50 ? 1.2 : 1.0;
    
    // Pre-existing conditions
    const medicalMultiplier = formData.preExistingConditions ? 1.25 : 1.0;
    
    return Math.round((basePrice * ageMultiplier * medicalMultiplier + addOnCosts) * formData.travelers);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      const quote = calculateFinalQuote();
      setFinalQuote(quote);
      setQuoteGenerated(true);
      setIsSubmitting(false);
    }, 2000);
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.firstName && formData.lastName && formData.email && formData.phone && formData.dateOfBirth;
      case 2:
        return formData.tripCost && formData.departureDate && formData.destination && formData.travelers;
      case 3:
        return formData.coverageLevel;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                  <TranslatedText text="First Name" targetLanguage={currentLanguage} />
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDarkMode 
                      ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' 
                      : 'border-slate-300 bg-white text-slate-900 placeholder-slate-500'
                  }`}
                  placeholder="John"
                  required
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                  <TranslatedText text="Last Name" targetLanguage={currentLanguage} />
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDarkMode 
                      ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' 
                      : 'border-slate-300 bg-white text-slate-900 placeholder-slate-500'
                  }`}
                  placeholder="Doe"
                  required
                />
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                <TranslatedText text="Email Address" targetLanguage={currentLanguage} />
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="relative">
                <Mail className={`absolute left-3 top-3 w-5 h-5 ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`} />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDarkMode 
                      ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' 
                      : 'border-slate-300 bg-white text-slate-900 placeholder-slate-500'
                  }`}
                  placeholder="john.doe@example.com"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <TranslatedText text="Phone Number" targetLanguage={currentLanguage} />
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+1 (555) 123-4567"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <TranslatedText text="Date of Birth" targetLanguage={currentLanguage} />
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <TranslatedText text="Total Trip Cost" targetLanguage={currentLanguage} />
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <input
                    type="number"
                    value={formData.tripCost}
                    onChange={(e) => handleInputChange('tripCost', parseInt(e.target.value))}
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="2500"
                    required
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  <TranslatedText text="Include flights, hotels, activities, etc." targetLanguage={currentLanguage} />
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <TranslatedText text="Number of Travelers" targetLanguage={currentLanguage} />
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <select
                  value={formData.travelers}
                  onChange={(e) => handleInputChange('travelers', parseInt(e.target.value))}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <TranslatedText text="Departure Date" targetLanguage={currentLanguage} />
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="date"
                  value={formData.departureDate}
                  onChange={(e) => handleInputChange('departureDate', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <TranslatedText text="Return Date" targetLanguage={currentLanguage} />
                  <span className="text-slate-500 text-xs">(Optional)</span>
                </label>
                <input
                  type="date"
                  value={formData.returnDate}
                  onChange={(e) => handleInputChange('returnDate', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <TranslatedText text="Primary Destination" targetLanguage={currentLanguage} />
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={formData.destination}
                  onChange={(e) => handleInputChange('destination', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="New York, NY"
                  required
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-semibold text-slate-900 mb-4">
                <TranslatedText text="Coverage Level" targetLanguage={currentLanguage} />
              </h4>
              <div className="space-y-3">
                {[
                  { id: 'basic', name: 'Basic Coverage', price: '20% less', description: 'Essential protection only' },
                  { id: 'standard', name: 'Standard Coverage', price: 'Base price', description: 'Recommended for most travelers' },
                  { id: 'premium', name: 'Premium Coverage', price: '30% more', description: 'Maximum protection and benefits' }
                ].map((level) => (
                  <label key={level.id} className="flex items-start space-x-3 p-4 border border-slate-200 rounded-lg hover:border-blue-300 cursor-pointer">
                    <input
                      type="radio"
                      name="coverageLevel"
                      value={level.id}
                      checked={formData.coverageLevel === level.id}
                      onChange={(e) => handleInputChange('coverageLevel', e.target.value)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium text-slate-900">
                          <TranslatedText text={level.name} targetLanguage={currentLanguage} />
                        </h5>
                        <span className="text-sm font-medium text-blue-600">
                          <TranslatedText text={level.price} targetLanguage={currentLanguage} />
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">
                        <TranslatedText text={level.description} targetLanguage={currentLanguage} />
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-slate-900 mb-4">
                <TranslatedText text="Optional Add-ons" targetLanguage={currentLanguage} />
              </h4>
              <div className="space-y-3">
                {availableAddOns.map((addOn) => (
                  <label key={addOn.id} className="flex items-start space-x-3 p-4 border border-slate-200 rounded-lg hover:border-blue-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.addOns.includes(addOn.id)}
                      onChange={() => handleAddOnToggle(addOn.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium text-slate-900">
                          <TranslatedText text={addOn.name} targetLanguage={currentLanguage} />
                        </h5>
                        <span className="text-sm font-medium text-green-600">+${addOn.price}</span>
                      </div>
                      <p className="text-sm text-slate-600">
                        <TranslatedText text={addOn.description} targetLanguage={currentLanguage} />
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-yellow-900 mb-2">
                <TranslatedText text="Medical Information" targetLanguage={currentLanguage} />
              </h4>
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.preExistingConditions}
                  onChange={(e) => handleInputChange('preExistingConditions', e.target.checked)}
                  className="mt-1"
                />
                <div>
                  <span className="text-sm text-yellow-800">
                    <TranslatedText text="I have pre-existing medical conditions" targetLanguage={currentLanguage} />
                  </span>
                  <p className="text-xs text-yellow-700 mt-1">
                    <TranslatedText text="This may affect your premium but ensures proper coverage" targetLanguage={currentLanguage} />
                  </p>
                </div>
              </label>
              
              {formData.preExistingConditions && (
                <div className="mt-3">
                  <textarea
                    value={formData.medicalDetails}
                    onChange={(e) => handleInputChange('medicalDetails', e.target.value)}
                    placeholder="Please briefly describe your conditions..."
                    className="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm"
                    rows={3}
                  />
                </div>
              )}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            {!quoteGenerated ? (
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-blue-900 mb-4">
                    <TranslatedText text="Quote Summary" targetLanguage={currentLanguage} />
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-800">
                        <TranslatedText text="Traveler:" targetLanguage={currentLanguage} />
                      </span>
                      <span className="font-medium text-blue-900">{formData.firstName} {formData.lastName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-800">
                        <TranslatedText text="Trip Cost:" targetLanguage={currentLanguage} />
                      </span>
                      <span className="font-medium text-blue-900">${formData.tripCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-800">
                        <TranslatedText text="Travelers:" targetLanguage={currentLanguage} />
                      </span>
                      <span className="font-medium text-blue-900">{formData.travelers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-800">
                        <TranslatedText text="Coverage Level:" targetLanguage={currentLanguage} />
                      </span>
                      <span className="font-medium text-blue-900 capitalize">
                        <TranslatedText text={formData.coverageLevel} targetLanguage={currentLanguage} />
                      </span>
                    </div>
                    {formData.addOns.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-blue-800">
                          <TranslatedText text="Add-ons:" targetLanguage={currentLanguage} />
                        </span>
                        <span className="font-medium text-blue-900">{formData.addOns.length} selected</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-slate-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-slate-700">
                      <p className="font-medium mb-1">
                        <TranslatedText text="Important Notes:" targetLanguage={currentLanguage} />
                      </p>
                      <ul className="space-y-1 text-xs">
                        <li>
                          • <TranslatedText text="This quote is valid for 30 days" targetLanguage={currentLanguage} />
                        </li>
                        <li>
                          • <TranslatedText text="Final premium may vary based on underwriting" targetLanguage={currentLanguage} />
                        </li>
                        <li>
                          • <TranslatedText text="Coverage begins when policy is purchased and trip is paid for" targetLanguage={currentLanguage} />
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">
                    <TranslatedText text="Your Quote is Ready!" targetLanguage={currentLanguage} />
                  </h3>
                  <p className="text-slate-600">
                    <TranslatedText text="Based on your information, here's your personalized quote:" targetLanguage={currentLanguage} />
                  </p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-8">
                  <div className="text-center">
                    <p className="text-sm text-green-700 mb-2">
                      <TranslatedText text="Total Premium" targetLanguage={currentLanguage} />
                    </p>
                    <p className="text-4xl font-bold text-green-900 mb-2">${finalQuote}</p>
                    <p className="text-sm text-green-700">
                      <TranslatedText text={`for ${formData.travelers} traveler${formData.travelers > 1 ? 's' : ''}`} targetLanguage={currentLanguage} />
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <button className="w-full bg-green-600 text-white py-4 rounded-lg font-semibold hover:bg-green-700 transition-colors">
                    <TranslatedText text="Purchase This Policy" targetLanguage={currentLanguage} />
                  </button>
                  <button className="w-full border-2 border-slate-300 text-slate-700 py-3 rounded-lg font-medium hover:border-slate-400 transition-colors">
                    <TranslatedText text="Email Quote to Me" targetLanguage={currentLanguage} />
                  </button>
                  <button className="w-full text-blue-600 py-2 font-medium hover:text-blue-700 transition-colors">
                    <TranslatedText text="Compare with Other Providers" targetLanguage={currentLanguage} />
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`${isDarkMode ? 'bg-slate-800' : 'bg-white'} rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">
                <TranslatedText text="Get Insurance Quote" targetLanguage={currentLanguage} />
              </h2>
              <p className="text-blue-100 text-sm">
                {selectedInsurance.provider} - {selectedInsurance.planName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className={`px-6 py-4 border-b ${isDarkMode ? 'border-slate-600 bg-slate-700' : 'border-slate-200 bg-slate-50'}`}>
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep >= step.number
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : isDarkMode ? 'border-slate-500 text-slate-400' : 'border-slate-300 text-slate-400'
                }`}>
                  <step.icon className="w-5 h-5" />
                </div>
                <div className="ml-3 hidden sm:block">
                  <p className={`text-sm font-medium ${
                    currentStep >= step.number ? 'text-blue-600' : isDarkMode ? 'text-slate-400' : 'text-slate-400'
                  }`}>
                    <TranslatedText text={step.title} targetLanguage={currentLanguage} />
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-12 h-0.5 mx-4 ${
                    currentStep > step.number ? 'bg-blue-600' : isDarkMode ? 'bg-slate-500' : 'bg-slate-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {renderStepContent()}
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-between p-6 border-t ${isDarkMode ? 'border-slate-600 bg-slate-700' : 'border-slate-200 bg-slate-50'}`}>
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`px-6 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
              isDarkMode 
                ? 'border-slate-500 text-slate-300 hover:border-slate-400' 
                : 'border-slate-300 text-slate-700 hover:border-slate-400'
            }`}
          >
            <TranslatedText text="Previous" targetLanguage={currentLanguage} />
          </button>

          <div className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            <TranslatedText text={`Step ${currentStep} of ${steps.length}`} targetLanguage={currentLanguage} />
          </div>

          {!quoteGenerated ? (
            <button
              onClick={nextStep}
              disabled={!isStepValid() || isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>
                    <TranslatedText text="Generating..." targetLanguage={currentLanguage} />
                  </span>
                </>
              ) : (
                <span>
                  <TranslatedText 
                    text={currentStep === 4 ? 'Get Quote' : 'Next'} 
                    targetLanguage={currentLanguage} 
                  />
                </span>
              )}
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-6 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              <TranslatedText text="Close" targetLanguage={currentLanguage} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
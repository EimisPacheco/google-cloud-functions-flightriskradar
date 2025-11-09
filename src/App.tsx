import React, { useRef } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { ChatBot, ChatBotRef } from './components/features/ChatBot';
import { HomePage } from './pages/HomePage';
import { SearchResultsPage } from './pages/SearchResultsPage';
import { RiskAnalysisPage } from './pages/RiskAnalysisPage';
import { InsuranceGuidePage } from './pages/InsuranceGuidePage';
import { AboutPage } from './pages/AboutPage';
import { AirlineAnalyticsPage } from './pages/AirlineAnalyticsPage';
import { AirportAnalyticsPage } from './pages/AirportAnalyticsPage';
import { TravelCommunityPage } from './pages/TravelCommunityPage';
import { FlightProvider } from './context/FlightContext';
import { TranslationProvider } from './context/TranslationContext';
import { DarkModeProvider, useDarkMode } from './context/DarkModeContext';

const AppContent: React.FC<{ onOpenChat: () => void; chatBotRef: React.RefObject<ChatBotRef> }> = ({ onOpenChat, chatBotRef }) => {
  const { isDarkMode } = useDarkMode();
  
  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gradient-to-br from-slate-900 to-slate-800' : 'bg-gradient-to-br from-slate-50 to-blue-50'}`}>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<HomePage onOpenChat={onOpenChat} />} />
          <Route path="/results" element={<SearchResultsPage />} />
          <Route path="/risk-analysis" element={<RiskAnalysisPage />} />
          <Route path="/insurance-guide" element={<InsuranceGuidePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/airline-analytics" element={<AirlineAnalyticsPage />} />
          <Route path="/airport-analytics" element={<AirportAnalyticsPage />} />
          <Route path="/travel-community" element={<TravelCommunityPage />} />
        </Routes>
      </main>
      <Footer />
      <ChatBot ref={chatBotRef} />
    </div>
  );
};

function App() {
  const chatBotRef = useRef<ChatBotRef>(null);

  const openChatBot = () => {
    chatBotRef.current?.openChat();
  };

  return (
    <DarkModeProvider>
    <TranslationProvider>
      <FlightProvider>
        <Router>
            <AppContent onOpenChat={openChatBot} chatBotRef={chatBotRef} />
        </Router>
      </FlightProvider>
    </TranslationProvider>
    </DarkModeProvider>
  );
}

export default App;
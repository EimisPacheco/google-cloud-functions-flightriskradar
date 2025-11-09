import React from 'react';
import { 
  Shield, 
  Brain, 
  Target, 
  DollarSign, 
  Users, 
  Award, 
  Globe, 
  Zap, 
  Database, 
  Cloud, 
  MessageCircle, 
  Mail, 
  Github, 
  Linkedin, 
  Twitter,
  CheckCircle,
  TrendingUp,
  Clock,
  MapPin,
  BarChart3
} from 'lucide-react';
import TranslatedText from '../components/TranslatedText';
import { useTranslation } from '../context/TranslationContext';
import { useDarkMode } from '../context/DarkModeContext';

export const AboutPage: React.FC = () => {
  const { currentLanguage } = useTranslation();
  const { isDarkMode } = useDarkMode();

  const missionValues = [
    {
      icon: Shield,
      title: 'Transparency',
      description: 'No hidden agendas or sales tactics. We provide unbiased, data-driven insights to help you make informed decisions.'
    },
    {
      icon: Brain,
      title: 'Intelligence',
      description: 'Powered by advanced AI and real-time data analysis to deliver accurate risk assessments and personalized recommendations.'
    },
    {
      icon: Target,
      title: 'Precision',
      description: 'Every analysis is tailored to your specific flight, considering weather, connections, airline performance, and seasonal factors.'
    },
    {
      icon: DollarSign,
      title: 'Value',
      description: 'Save money by understanding when insurance is truly necessary and when you can confidently skip it.'
    }
  ];

  const keyFeatures = [
    {
      icon: Brain,
      title: 'AI-Powered Risk Analysis',
      description: 'Advanced machine learning algorithms analyze thousands of data points to assess your flight risk accurately.',
      benefits: ['Real-time weather analysis', 'Historical airline performance', 'Seasonal pattern recognition', 'Connection risk assessment']
    },
    {
      icon: Globe,
      title: 'Global Coverage',
      description: 'Comprehensive analysis for flights worldwide, with detailed insights for both domestic and international travel.',
      benefits: ['Worldwide airport coverage', 'Multi-language support', 'Local weather patterns', 'Regional risk factors']
    },
    {
      icon: Clock,
      title: 'Real-Time Updates',
      description: 'Get up-to-the-minute risk assessments with live weather data and current flight information.',
      benefits: ['Live weather feeds', 'Current flight status', 'Dynamic risk updates', 'Instant notifications']
    },
    {
      icon: BarChart3,
      title: 'Comprehensive Reporting',
      description: 'Detailed reports with risk breakdowns, mitigation strategies, and personalized recommendations.',
      benefits: ['Risk factor analysis', 'Mitigation strategies', 'Insurance recommendations', 'Cost-benefit analysis']
    }
  ];

  const technologyStack = [
    {
      category: 'Frontend',
      technologies: ['React 18', 'TypeScript', 'Tailwind CSS', 'Vite'],
      icon: Zap
    },
    {
      category: 'Backend',
      technologies: ['Google Cloud Functions', 'Python 3.10', 'Google ADK', 'Gemini AI'],
      icon: Cloud
    },
    {
      category: 'Data & APIs',
      technologies: ['BigQuery', 'SerpAPI', 'Google Maps API', 'Weather APIs'],
      icon: Database
    },
    {
      category: 'AI & ML',
      technologies: ['Google Generative AI', 'Machine Learning', 'Natural Language Processing', 'Predictive Analytics'],
      icon: Brain
    }
  ];

  const teamMembers = [
    {
      name: 'FlightRiskRadar Team',
      role: 'AI-Powered Flight Risk Analysis',
      description: 'A dedicated team of aviation experts, data scientists, and AI specialists working to revolutionize travel risk assessment.',
      expertise: ['Aviation Safety', 'Data Science', 'AI/ML', 'Travel Insurance', 'Weather Analysis'],
      image: '/FlightRiskRadarApp.png'
    }
  ];

  const achievements = [
    {
      icon: Award,
      title: 'AI Innovation',
      description: 'Pioneering the use of Google ADK and Gemini AI for flight risk analysis'
    },
    {
      icon: Users,
      title: 'User-Centric Design',
      description: 'Built with travelers in mind, focusing on clarity and actionable insights'
    },
    {
      icon: Shield,
      title: 'Data Security',
      description: 'Enterprise-grade security with Google Cloud infrastructure'
    },
    {
      icon: TrendingUp,
      title: 'Continuous Improvement',
      description: 'Regular updates and enhancements based on user feedback and new data'
    }
  ];

  const statistics = [
    {
      number: '1000+',
      label: 'Airports Analyzed',
      icon: MapPin
    },
    {
      number: '50+',
      label: 'Risk Factors',
      icon: Target
    },
    {
      number: '24/7',
      label: 'Real-Time Monitoring',
      icon: Clock
    },
    {
      number: '99.9%',
      label: 'Uptime',
      icon: Shield
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className={`py-16 relative overflow-hidden ${isDarkMode ? 'bg-slate-800/80 backdrop-blur-md' : 'bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700'}`}>
        <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/723240/pexels-photo-723240.jpeg')] bg-cover bg-center opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="flex items-center justify-center w-24 h-24 bg-white/10 rounded-2xl backdrop-blur-sm">
                <img 
                  src="/FlightRiskRadarApp.png" 
                  alt="FlightRiskRadar" 
                  className="w-18 h-18 object-contain"
                />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              <TranslatedText text="About FlightRiskRadar" targetLanguage={currentLanguage} />
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-4 max-w-3xl mx-auto">
              <TranslatedText 
                text="Revolutionizing travel risk assessment with AI-powered analysis. We help travelers make informed decisions about flight insurance and travel planning." 
                targetLanguage={currentLanguage} 
              />
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Values */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className={`text-3xl font-bold mb-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
              <TranslatedText text="Our Mission & Values" targetLanguage={currentLanguage} />
            </h2>
            <p className={`text-lg ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              <TranslatedText 
                text="Empowering travelers with data-driven insights to make smarter decisions about their flights and insurance." 
                targetLanguage={currentLanguage} 
              />
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {missionValues.map((value, index) => (
              <div
                key={index}
                className={`p-6 rounded-xl border shadow-md ${
                  isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                } hover:shadow-lg transition-all`}
              >
                <div className="flex justify-center mb-4">
                  <div className={`p-3 rounded-full ${isDarkMode ? 'bg-blue-900/50' : 'bg-blue-100'}`}>
                    <value.icon className={`w-6 h-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  </div>
                </div>
                <h3 className={`text-lg font-semibold text-center mb-3 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                  {value.title}
                </h3>
                <p className={`text-sm text-center ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className={`py-16 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className={`text-3xl font-bold mb-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
              <TranslatedText text="Key Features" targetLanguage={currentLanguage} />
            </h2>
            <p className={`text-lg ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              <TranslatedText 
                text="Advanced technology and comprehensive analysis to keep you informed and protected." 
                targetLanguage={currentLanguage} 
              />
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {keyFeatures.map((feature, index) => (
              <div
                key={index}
                className={`p-6 rounded-xl border shadow-md ${
                  isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-200'
                } hover:shadow-lg transition-all`}
              >
                <div className="flex items-center mb-4">
                  <div className={`p-2 rounded-lg mr-4 ${isDarkMode ? 'bg-blue-900/50' : 'bg-blue-100'}`}>
                    <feature.icon className={`w-6 h-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  </div>
                  <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                    {feature.title}
                  </h3>
                </div>
                <p className={`text-sm mb-4 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  {feature.description}
                </p>
                <ul className="space-y-2">
                  {feature.benefits.map((benefit, benefitIndex) => (
                    <li key={benefitIndex} className={`text-sm flex items-center ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className={`text-3xl font-bold mb-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
              <TranslatedText text="Technology Stack" targetLanguage={currentLanguage} />
            </h2>
            <p className={`text-lg ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              <TranslatedText 
                text="Built with cutting-edge technologies for reliability, performance, and accuracy." 
                targetLanguage={currentLanguage} 
              />
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {technologyStack.map((stack, index) => (
              <div
                key={index}
                className={`p-6 rounded-xl border ${
                  isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                } hover:shadow-lg transition-all`}
              >
                <div className="flex items-center mb-4">
                  <div className={`p-2 rounded-lg mr-3 ${isDarkMode ? 'bg-green-900/50' : 'bg-green-100'}`}>
                    <stack.icon className={`w-6 h-6 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                  </div>
                  <h3 className={`font-semibold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                    {stack.category}
                  </h3>
                </div>
                <div className="space-y-2">
                  {stack.technologies.map((tech, techIndex) => (
                    <div key={techIndex} className={`text-sm px-2 py-1 rounded ${isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>
                      {tech}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className={`py-16 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className={`text-3xl font-bold mb-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
              <TranslatedText text="By the Numbers" targetLanguage={currentLanguage} />
            </h2>
            <p className={`text-lg ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              <TranslatedText 
                text="Our platform's reach and capabilities in numbers." 
                targetLanguage={currentLanguage} 
              />
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statistics.map((stat, index) => (
              <div
                key={index}
                className={`p-6 rounded-xl border shadow-md text-center ${
                  isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-200'
                } hover:shadow-lg transition-all`}
              >
                <div className="flex justify-center mb-4">
                  <div className={`p-3 rounded-full ${isDarkMode ? 'bg-blue-900/50' : 'bg-blue-100'}`}>
                    <stat.icon className={`w-6 h-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  </div>
                </div>
                <div className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  {stat.number}
                </div>
                <div className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className={`text-3xl font-bold mb-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
              <TranslatedText text="Our Team" targetLanguage={currentLanguage} />
            </h2>
            <p className={`text-lg ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              <TranslatedText 
                text="Meet the experts behind FlightRiskRadar's innovative approach to travel risk analysis." 
                targetLanguage={currentLanguage} 
              />
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {teamMembers.map((member, index) => (
              <div
                key={index}
                className={`p-6 rounded-xl border shadow-md ${
                  isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                } hover:shadow-lg transition-all`}
              >
                <div className="text-center mb-6">
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden">
                    <img 
                      src={member.image} 
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                    {member.name}
                  </h3>
                  <p className={`text-sm font-medium mb-3 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                    {member.role}
                  </p>
                  <p className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    {member.description}
                  </p>
                </div>
                <div>
                  <h4 className={`font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    <TranslatedText text="Areas of Expertise:" targetLanguage={currentLanguage} />
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {member.expertise.map((skill, skillIndex) => (
                      <span
                        key={skillIndex}
                        className={`text-xs px-2 py-1 rounded-full ${
                          isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Achievements */}
      <section className={`py-16 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className={`text-3xl font-bold mb-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
              <TranslatedText text="Achievements & Recognition" targetLanguage={currentLanguage} />
            </h2>
            <p className={`text-lg ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              <TranslatedText 
                text="Proud milestones and accomplishments in our journey to revolutionize travel risk assessment." 
                targetLanguage={currentLanguage} 
              />
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {achievements.map((achievement, index) => (
              <div
                key={index}
                className={`p-6 rounded-xl border shadow-md text-center ${
                  isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-200'
                } hover:shadow-lg transition-all`}
              >
                <div className="flex justify-center mb-4">
                  <div className={`p-3 rounded-full ${isDarkMode ? 'bg-yellow-900/50' : 'bg-yellow-100'}`}>
                    <achievement.icon className={`w-6 h-6 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
                  </div>
                </div>
                <h3 className={`font-semibold mb-3 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                  {achievement.title}
                </h3>
                <p className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  {achievement.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact & Social */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className={`text-3xl font-bold mb-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
              <TranslatedText text="Get in Touch" targetLanguage={currentLanguage} />
            </h2>
            <p className={`text-lg ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              <TranslatedText 
                text="Have questions or feedback? We'd love to hear from you." 
                targetLanguage={currentLanguage} 
              />
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Contact Info */}
            <div className={`p-6 rounded-xl border shadow-md ${
              isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
            }`}>
              <h3 className={`text-xl font-semibold mb-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                <TranslatedText text="Contact Information" targetLanguage={currentLanguage} />
              </h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <Mail className={`w-5 h-5 mr-3 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  <span className={`${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    support@flightriskradar.com
                  </span>
                </div>
                <div className="flex items-center">
                  <MessageCircle className={`w-5 h-5 mr-3 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  <span className={`${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    <TranslatedText text="Live Chat Available" targetLanguage={currentLanguage} />
                  </span>
                </div>
                <div className="flex items-center">
                  <Clock className={`w-5 h-5 mr-3 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  <span className={`${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    <TranslatedText text="24/7 Support" targetLanguage={currentLanguage} />
                  </span>
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className={`p-6 rounded-xl border shadow-md ${
              isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
            }`}>
              <h3 className={`text-xl font-semibold mb-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                <TranslatedText text="Follow Us" targetLanguage={currentLanguage} />
              </h3>
              <div className="space-y-4">
                <a href="#" className={`flex items-center p-3 rounded-lg transition-colors ${
                  isDarkMode ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-100 text-slate-600'
                }`}>
                  <Github className="w-5 h-5 mr-3" />
                  <span>GitHub</span>
                </a>
                <a href="https://www.linkedin.com/in/eimis-pacheco/" target="_blank" rel="noopener noreferrer" className={`flex items-center p-3 rounded-lg transition-colors ${
                  isDarkMode ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-100 text-slate-600'
                }`}>
                  <Linkedin className="w-5 h-5 mr-3" />
                  <span>LinkedIn</span>
                </a>
                <a href="#" className={`flex items-center p-3 rounded-lg transition-colors ${
                  isDarkMode ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-100 text-slate-600'
                }`}>
                  <Twitter className="w-5 h-5 mr-3" />
                  <span>Twitter</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4 text-white">
            <TranslatedText text="Ready to Experience FlightRiskRadar?" targetLanguage={currentLanguage} />
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            <TranslatedText 
              text="Join thousands of travelers who trust our AI-powered analysis for smarter travel decisions." 
              targetLanguage={currentLanguage} 
            />
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <button 
              onClick={() => window.location.href = '/'}
              className="px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              <TranslatedText text="Start Analyzing" targetLanguage={currentLanguage} />
            </button>
            <button 
              onClick={() => window.location.href = '/insurance-guide'}
              className="px-8 py-4 border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
            >
              <TranslatedText text="Learn More" targetLanguage={currentLanguage} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}; 
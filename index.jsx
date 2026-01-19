import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Users, 
  Globe, 
  ArrowRight, 
  Menu, 
  X, 
  ChevronDown, 
  Search, 
  Filter, 
  Image as ImageIcon,
  Calendar,
  MapPin,
  ExternalLink,
  Loader2,
  ShieldCheck,
  Facebook,
  Twitter,
  Instagram,
  Mail,
  Phone,
  HandHeart // Using a hand icon for "Seva/Donate" feel
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithCustomToken, 
  signInAnonymously, 
  onAuthStateChanged
} from 'firebase/auth';
import { 
  getFirestore, 
  collection
} from 'firebase/firestore';

/**
 * --- CONFIGURATION & FIREBASE SETUP ---
 */
const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
const appId = typeof __app_id !== 'undefined' ? __app_id : 'trust-platform';

let app, auth, db;
try {
  if (Object.keys(firebaseConfig).length > 0) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  }
} catch (e) {
  console.warn("Firebase not initialized (Mock Mode active):", e);
}

// --- MOCK DATA GENERATORS (HINDI CONTEXT) ---

const generateMockProjects = (count) => {
  const titles = [
    "महा अन्नदान सेवा", // Mega Food Distribution
    "गणेश उत्सव और सामुदायिक पूजा", // Ganesh Festival & Community Puja
    "निःशुल्क चिकित्सा शिविर", // Free Medical Camp
    "शिक्षा सहायता अभियान", // Education Support Campaign
    "गौ सेवा कार्यक्रम", // Cow Service Program
    "वरिष्ठ नागरिक सहायता" // Senior Citizen Support
  ];
  
  const descriptions = [
    "हजारों भक्तों को प्रतिदिन सात्विक भोजन और प्रसाद का वितरण।",
    "सामुदायिक एकता को बढ़ावा देने के लिए भव्य गणेश उत्सव का आयोजन।",
    "ग्रामीण क्षेत्रों में मुफ्त स्वास्थ्य जांच और दवा वितरण।",
    "जरूरतमंद छात्रों को किताबें, वर्दी और छात्रवृत्ति प्रदान करना।",
    "गायों के संरक्षण और देखभाल के लिए आश्रय और चारा उपलब्ध कराना।",
    "बुजुर्गों के लिए स्वास्थ्य देखभाल और भावनात्मक समर्थन।"
  ];

  return Array.from({ length: count }, (_, i) => ({
    id: `proj-${i}`,
    title: titles[i % titles.length] + ` #${i + 1}`,
    category: i % 2 === 0 ? 'सेवा कार्य (Seva)' : 'धार्मिक (Religious)',
    description: descriptions[i % descriptions.length],
    image: `https://picsum.photos/seed/${i + 200}/800/600`,
    raised: Math.floor(Math.random() * 500000),
    goal: 1000000,
    date: '2023-11-15',
    location: 'मुंबई, महाराष्ट्र'
  }));
};

const generateMockGallery = (count) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `img-${i}`,
    url: `https://picsum.photos/seed/${i + 800}/600/600`,
    caption: `गणेश चतुर्थी उत्सव - दिन ${i + 1}`,
    date: '2023-09-19'
  }));
};

/**
 * --- REUSABLE UI COMPONENTS ---
 */

const Button = ({ children, variant = 'primary', className = '', onClick, icon: Icon, disabled = false }) => {
  const baseStyles = "inline-flex items-center justify-center px-6 py-3 rounded-full font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
  
  // Updated Colors to Orange/Saffron for the Trust theme
  const variants = {
    primary: "bg-orange-600 text-white hover:bg-orange-700 shadow-lg shadow-orange-600/30",
    secondary: "bg-white text-slate-800 border border-slate-200 hover:bg-orange-50 hover:text-orange-700 shadow-sm",
    outline: "border-2 border-white text-white hover:bg-white/10",
    ghost: "text-slate-600 hover:bg-orange-50 hover:text-orange-700"
  };

  return (
    <button 
      onClick={onClick} 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={disabled}
    >
      {children}
      {Icon && <Icon className="ml-2 w-4 h-4" />}
    </button>
  );
};

const SectionHeading = ({ title, subtitle, align = 'center' }) => (
  <div className={`mb-12 ${align === 'center' ? 'text-center' : 'text-left'}`}>
    <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">{title}</h2>
    <div className={`h-1.5 w-24 bg-orange-500 rounded-full mb-6 ${align === 'center' ? 'mx-auto' : ''}`}></div>
    {subtitle && <p className="text-lg text-slate-600 max-w-2xl mx-auto">{subtitle}</p>}
  </div>
);

const LazyImage = ({ src, alt, className }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className={`relative overflow-hidden bg-slate-100 ${className}`}>
      {!isLoaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      )}
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center text-slate-400 bg-slate-50">
          <ImageIcon className="w-8 h-8" />
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          onError={() => setError(true)}
          className={`w-full h-full object-cover transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          loading="lazy"
        />
      )}
    </div>
  );
};

/**
 * --- MAIN APPLICATION COMPONENT ---
 */
export default function ShreeSiddhivinayakTrust() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Data States
  const [projects, setProjects] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Pagination States
  const [projectPage, setProjectPage] = useState(1);
  const [hasMoreProjects, setHasMoreProjects] = useState(true);

  // Auth & Initial Data
  useEffect(() => {
    const initAuth = async () => {
      if (auth) {
        const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
        try {
          if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            await signInWithCustomToken(auth, __initial_auth_token);
          } else {
            await signInAnonymously(auth);
          }
        } catch (error) {
          console.error("Auth failed:", error);
        }
        return unsubscribe;
      } else {
        setUser({ uid: 'mock-devotee', isAnonymous: true });
      }
    };
    initAuth();
  }, []);

  const fetchProjects = async (reset = false) => {
    setLoading(true);
    setTimeout(() => {
      const newProjects = generateMockProjects(6);
      setProjects(prev => reset ? newProjects : [...prev, ...newProjects]);
      setLoading(false);
      if (projectPage >= 5) setHasMoreProjects(false); 
    }, 800);
  };

  useEffect(() => {
    fetchProjects(true);
    setGallery(generateMockGallery(8));
  }, []);

  const handleLoadMoreProjects = () => {
    setProjectPage(prev => prev + 1);
    fetchProjects();
  };

  // --- SUB-SECTIONS (HINDI TRANSLATED) ---

  const Navbar = () => (
    <nav className="bg-white shadow-sm fixed w-full z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('home')}>
            <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center text-white">
              <span className="font-bold text-2xl">ॐ</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 leading-none">श्री सिद्धिविनायक</h1>
              <span className="text-xs text-orange-600 font-semibold uppercase tracking-wider">गणेश पूजा ट्रस्ट</span>
            </div>
          </div>
          
          <div className="hidden md:flex space-x-8">
            {['होम (Home)', 'हमारे बारे में (About)', 'सेवा कार्य (Projects)', 'दर्शन (Darshan)'].map((item) => (
              <button key={item} className="text-slate-600 hover:text-orange-600 font-medium transition-colors">
                {item}
              </button>
            ))}
            <Button variant="primary" className="px-5 py-2 text-sm">
              दान करें (Donate)
            </Button>
          </div>

          <div className="md:hidden">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-slate-600">
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 p-4 space-y-4">
           {['होम', 'हमारे बारे में', 'सेवा कार्य', 'दर्शन'].map((item) => (
              <button key={item} className="block w-full text-left py-2 text-slate-600 font-medium">
                {item}
              </button>
            ))}
            <Button className="w-full">दान करें</Button>
        </div>
      )}
    </nav>
  );

  const HeroSection = () => (
    <div className="relative bg-slate-900 text-white pt-32 pb-24 overflow-hidden">
      {/* Saffron & Red Gradients for Trust Theme */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-orange-600 rounded-full blur-3xl opacity-30"></div>
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-red-600 rounded-full blur-3xl opacity-20"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 text-center">
        <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-orange-900/50 border border-orange-700 text-orange-200 text-sm font-medium mb-8">
          <ShieldCheck className="w-4 h-4 mr-2" />
          पंजीकृत ट्रस्ट (Reg. Trust) 123-456
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight mb-6 font-serif">
          सेवा, श्रद्धा और समर्पण <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-300">
            श्री गणेश के चरणों में
          </span>
        </h1>
        <p className="text-lg md:text-xl text-slate-300 mb-10 leading-relaxed max-w-3xl mx-auto">
          हमारा उद्देश्य समाज सेवा और धर्म का प्रचार है। आपकी छोटी सी मदद और दान हजारों लोगों के जीवन में खुशियां ला सकती है।
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={() => setActiveTab('donate')}>
            दान करें (Donate Now)
          </Button>
          <Button variant="outline" onClick={() => setActiveTab('projects')}>
            हमारे सेवा कार्य (Our Seva)
          </Button>
        </div>
      </div>
    </div>
  );

  const StatsSection = () => (
    <div className="bg-white relative z-20 -mt-10 max-w-7xl mx-auto px-4 sm:px-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shadow-xl rounded-2xl bg-white p-8 border border-slate-100">
        {[
          { icon: Users, label: "भक्तों की सेवा (Devotees Served)", value: "50,000+", color: "bg-orange-50 text-orange-600" },
          { icon: HandHeart, label: "प्रसाद वितरण (Prasad Meals)", value: "1.2 Lakh+", color: "bg-red-50 text-red-600" },
          { icon: Heart, label: "स्वयंसेवक (Volunteers)", value: "3,500", color: "bg-yellow-50 text-yellow-600" }
        ].map((stat, i) => (
          <div key={i} className="flex items-center space-x-4 p-4 rounded-xl hover:bg-slate-50 transition-colors">
            <div className={`p-3 rounded-lg ${stat.color}`}>
              <stat.icon className="w-8 h-8" />
            </div>
            <div>
              <div className="text-3xl font-bold text-slate-900">{stat.value}</div>
              <div className="text-slate-500 font-medium">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const ProjectsGrid = () => (
    <div className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <SectionHeading 
          title="हमारे सामाजिक कार्य (Our Initiatives)" 
          subtitle="पारदर्शिता और समर्पण के साथ हम समाज के हर वर्ग तक मदद पहुँचाते हैं। यहाँ हमारे चल रहे सेवा कार्यों का विवरण है।"
        />

        {/* Filters */}
        <div className="flex flex-wrap gap-2 justify-center mb-10">
          {['सभी (All)', 'शिक्षा (Education)', 'स्वास्थ्य (Health)', 'अन्नदान (Food)', 'गौ सेवा (Cow Seva)'].map((filter, i) => (
            <button 
              key={filter}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${i === 0 ? 'bg-orange-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-orange-50'}`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project) => (
            <div key={project.id} className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100">
              <div className="relative h-48 overflow-hidden">
                <LazyImage src={project.image} alt={project.title} className="w-full h-full group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-4 left-4 bg-orange-600/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-white uppercase tracking-wide">
                  {project.category}
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center text-xs text-slate-500 mb-3 space-x-4">
                  <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" /> {project.date}</span>
                  <span className="flex items-center"><MapPin className="w-3 h-3 mr-1" /> {project.location}</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-orange-600 transition-colors">{project.title}</h3>
                <p className="text-slate-600 text-sm mb-4 line-clamp-2">{project.description}</p>
                
                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-orange-600">₹{project.raised.toLocaleString()} प्राप्त (Raised)</span>
                    <span className="text-slate-400">लक्ष्य: ₹{project.goal.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div 
                      className="bg-orange-500 h-2 rounded-full transition-all duration-1000" 
                      style={{ width: `${(project.raised / project.goal) * 100}%` }}
                    ></div>
                  </div>
                </div>
                
                <button className="text-orange-600 font-semibold text-sm flex items-center hover:underline">
                  विस्तार में देखें (Details) <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          {hasMoreProjects ? (
            <Button variant="secondary" onClick={handleLoadMoreProjects} disabled={loading}>
              {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'और देखें (Load More)'}
            </Button>
          ) : (
            <p className="text-slate-400 text-sm">सभी प्रोजेक्ट्स दिखाए गए हैं।</p>
          )}
        </div>
      </div>
    </div>
  );

  const GallerySection = () => (
    <div className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <SectionHeading title="दर्शन और उत्सव गैलरी" align="left" subtitle="हमारे ट्रस्ट द्वारा आयोजित कार्यक्रमों और उत्सवों की कुछ झलकियाँ।" />
        
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {gallery.map((item) => (
            <div key={item.id} className="break-inside-avoid relative group rounded-xl overflow-hidden cursor-pointer">
              <LazyImage src={item.url} alt={item.caption} className="w-full h-auto" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                <p className="text-white font-medium text-sm">{item.caption}</p>
                <p className="text-white/70 text-xs">{item.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const Footer = () => (
    <footer className="bg-slate-900 text-slate-300 py-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="col-span-1 md:col-span-1">
          <div className="flex items-center space-x-2 mb-6">
            <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">ॐ</span>
            </div>
            <span className="text-xl font-bold text-white">Shree Siddhivinayak</span>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed">
            धर्म की रक्षा और मानवता की सेवा। श्री सिद्धिविनायक गणेश पूजा ट्रस्ट एक पंजीकृत संस्था है जो समाज कल्याण के लिए समर्पित है।
          </p>
        </div>
        
        <div>
          <h4 className="text-white font-semibold mb-4">महत्वपूर्ण लिंक (Links)</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-orange-400">ट्रस्ट के बारे में (About)</a></li>
            <li><a href="#" className="hover:text-orange-400">आगामी कार्यक्रम (Events)</a></li>
            <li><a href="#" className="hover:text-orange-400">वित्तीय रिपोर्ट (Reports)</a></li>
            <li><a href="#" className="hover:text-orange-400">नियम और शर्तें (Terms)</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-4">संपर्क करें (Contact)</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center"><Mail className="w-4 h-4 mr-2" /> info@siddhivinayaktrust.org</li>
            <li className="flex items-center"><Phone className="w-4 h-4 mr-2" /> +91 22 1234 5678</li>
            <li className="flex items-center space-x-4 mt-4">
              <Facebook className="w-5 h-5 hover:text-blue-500 cursor-pointer" />
              <Twitter className="w-5 h-5 hover:text-blue-400 cursor-pointer" />
              <Instagram className="w-5 h-5 hover:text-pink-500 cursor-pointer" />
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-4">न्यूज़लेटर (Newsletter)</h4>
          <div className="flex flex-col space-y-2">
            <input 
              type="email" 
              placeholder="आपका ईमेल (Your Email)" 
              className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-orange-500"
            />
            <Button variant="primary" className="py-2 text-sm">सब्सक्राइब करें</Button>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-12 pt-8 border-t border-slate-800 text-center text-sm text-slate-500">
        &copy; {new Date().getFullYear()} श्री सिद्धिविनायक गणेश पूजा ट्रस्ट. सर्वाधिकार सुरक्षित।
      </div>
    </footer>
  );

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      <Navbar />
      <main>
        {activeTab === 'home' && (
          <>
            <HeroSection />
            <StatsSection />
            <ProjectsGrid />
            <GallerySection />
          </>
        )}
        {/* Placeholder for other tabs logic */}
        {activeTab === 'projects' && (
           <div className="pt-20"><ProjectsGrid /></div>
        )}
        {activeTab === 'donate' && (
           <div className="pt-32 text-center pb-20">
             <h2 className="text-3xl font-bold mb-4">दान पेज (Donation)</h2>
             <p>सुरक्षित भुगतान गेटवे जल्द ही आ रहा है...</p>
             <Button variant="outline" className="mt-4 text-black border-slate-300" onClick={() => setActiveTab('home')}>वापस जाएं (Go Back)</Button>
           </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

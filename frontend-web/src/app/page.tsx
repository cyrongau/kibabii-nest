'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  ShieldCheck, 
  ArrowRight, 
  MapPin, 
  Star,
  Globe,
  Share2,
  MessageCircle,
  TrendingUp,
  Brain,
  Award,
  Users,
  CheckCircle2,
  Map as MapIcon,
  Search
} from 'lucide-react';
import { useNotifications } from '@/context/NotificationContext';

export default function Home() {
  const router = useRouter();
  const { showToast } = useNotifications();
  const [user, setUser] = React.useState<any>(null);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [testimonials, setTestimonials] = React.useState<any[]>([]);

  React.useEffect(() => {
    const token = localStorage.getItem('access_token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(jsonSafeParse(userData));
    }
    setIsLoaded(true);
    _fetchTestimonials();
  }, []);

  const _fetchTestimonials = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000'}/community/testimonials/approved`);
      const data = await res.json();
      setTestimonials(data);
    } catch (e) {
      console.error("Failed to fetch testimonials", e);
    }
  };

  const jsonSafeParse = (str: string) => {
    try {
      return JSON.parse(str);
    } catch (e) {
      return null;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setUser(null);
    router.push('/');
  };

  const handleCtaClick = (e: React.MouseEvent, href: string) => {
    if (user) {
      e.preventDefault();
      showToast("You are already registered and logged in!", "info");
      router.push(user.role === 'ADMIN' ? '/dashboard/admin' : user.role === 'LANDLORD' ? '/dashboard/landlord' : '/dashboard/student');
    }
  };

  return (
    <div className="min-h-screen bg-background font-sans scroll-smooth text-foreground transition-colors duration-500">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-6 md:px-20 bg-background/80 backdrop-blur-md sticky top-0 z-50 border-b border-border-subtle">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push('/')}>
          <div className="relative w-10 h-10">
            <Image 
              src="/images/logo_full.svg" 
              alt="Kibabii Nest Logo" 
              fill 
              className="object-contain"
            />
          </div>
          <div className="text-2xl font-black text-primary tracking-tighter">Kibabii Nest</div>
        </div>
        
        <div className="hidden md:flex gap-10 text-sm font-bold text-muted-foreground">
          <a href="/" className="hover:text-primary transition-colors">Home</a>
          <a href="/support" className="hover:text-primary transition-colors">Support</a>
          {!user && <a href="/auth/landlord" className="text-primary hover:opacity-80 transition-opacity">Landlord Onboarding</a>}
          {user && (
            <a 
              href={user.role === 'ADMIN' ? '/dashboard/admin' : user.role === 'LANDLORD' ? '/dashboard/landlord' : '/dashboard/student'} 
              className="text-primary hover:opacity-80 transition-opacity"
            >
              My Dashboard
            </a>
          )}
        </div>

        <div className="flex items-center gap-4">
          {isLoaded && (
            <>
              {!user ? (
                <>
                  <a href="/auth/login" className="px-5 py-2.5 text-sm font-bold text-primary hover:bg-muted rounded-xl transition-all">Sign In</a>
                  <a href="/auth/landlord" className="px-6 py-2.5 text-sm font-bold text-white bg-primary rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 hover:scale-[1.02] transition-all">Join as Landlord</a>
                </>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-end hidden sm:flex">
                    <span className="text-xs font-black text-foreground">{user.name}</span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{user.role}</span>
                  </div>
                  <div className="group relative">
                    <button className="w-10 h-10 bg-muted rounded-xl overflow-hidden border border-border-subtle hover:ring-2 hover:ring-primary/20 transition-all">
                      <img 
                        src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} 
                        alt={user.name} 
                        className="w-full h-full object-cover" 
                      />
                    </button>
                    <div className="absolute right-0 mt-2 w-48 bg-card rounded-2xl shadow-xl border border-border-subtle py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                      <button 
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-500/10 transition-colors"
                      >
                        Logout Session
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-6 py-20 md:px-20 md:py-32 bg-muted/20 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16 relative z-10">
          <div className="flex-1 space-y-8 text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full border border-primary/20 mx-auto md:mx-0">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
              <span className="text-[10px] font-black text-primary uppercase tracking-widest">Kibabii Nest is Your next Hostel</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold text-foreground leading-[1.1] tracking-tight text-balance">
              Find your home <br />
              at <span className="text-primary italic">Kibabii</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-lg leading-relaxed text-pretty mx-auto md:mx-0">
              The premier mobile platform for Kibabii University students to discover, book, and manage their housing with zero friction.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
               <button className="bg-primary text-white px-10 py-4 rounded-2xl font-bold shadow-2xl shadow-primary/20 hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                 Get the App
                 <ArrowRight size={18} />
               </button>
               <a 
                 href="/auth/landlord" 
                 onClick={(e) => handleCtaClick(e, '/auth/landlord')}
                 className="bg-card text-foreground border border-border-subtle px-10 py-4 rounded-2xl font-bold hover:bg-muted transition-all text-center"
               >
                 Become a Landlord
               </a>
            </div>
          </div>

          <div className="flex-1 relative w-full hidden md:block">
            <div className="w-full aspect-[4/3] rounded-[3rem] overflow-hidden shadow-2xl relative border-8 border-card group bg-primary/5">
              <img 
                src="/hero-hostel.png" 
                alt="Premium Student Hostel" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 relative z-10"
              />
              <div className="absolute bottom-8 left-8 bg-card/95 backdrop-blur px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-4 border border-border-subtle z-20">
                <div className="w-10 h-10 bg-green-500 rounded-2xl flex items-center justify-center text-white text-lg shadow-lg shadow-green-500/20">✓</div>
                <div>
                  <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Kibabii Nest Verified</div>
                  <div className="text-sm font-black text-foreground leading-none mt-1">100% Secure Platform</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section className="px-6 py-32 md:px-20 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-4xl font-black text-foreground tracking-tight mb-4">Built for Students, Controlled by You</h2>
          <p className="text-muted-foreground font-medium text-lg leading-relaxed">
            Everything you need to secure your home away from home, with zero friction and maximum safety.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard 
            icon={<MapIcon size={24} className="text-primary" />}
            title="Real-time Maps"
            desc="Find hostels directly on an interactive map with proximity stats to Kibabii University."
          />
          <FeatureCard 
            icon={<ShieldCheck size={24} className="text-primary" />}
            title="Verified Listings"
            desc="Every property is hand-vetted by our admin team to ensure safety and hygiene standards."
          />
          <FeatureCard 
            icon={<Users size={24} className="text-primary" />}
            title="Smart Matching"
            desc="Find compatible roommates based on study habits, social preferences, and lifestyle."
          />
          <FeatureCard 
            icon={<TrendingUp size={24} className="text-primary" />}
            title="Predictive Pricing"
            desc="Understand seasonal price trends and secure the best deals before the semester starts."
          />
          <FeatureCard 
            icon={<Brain size={24} className="text-primary" />}
            title="AI Concierge"
            desc="24/7 AI-powered support for maintenance requests, local tips, and campus info."
          />
          <FeatureCard 
            icon={<Award size={24} className="text-primary" />}
            title="Reward System"
            desc="Earn points for referrals and timely payments, redeemable at local campus cafes."
          />
        </div>
      </section>

      {/* App Marketing Section (Mobile Experience) */}
      <section className="bg-slate-950 py-48 px-6 md:px-20 overflow-hidden relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-24">
            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-8">A Seamless Mobile Experience</h2>
            <p className="text-slate-400 font-medium text-xl leading-relaxed">
              The full Kibabii Nest experience is optimized for your mobile device. Book and manage on the go.
            </p>
            
            <div className="flex flex-wrap justify-center gap-6 mt-16">
              <button className="bg-slate-900 text-white px-5 py-3 rounded-xl flex items-center gap-3 hover:bg-slate-800 transition-all border border-white/10 active:scale-95 shadow-xl">
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
                  <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.078-2.04 0-3.905 1.169-4.966 3.002-2.112 3.663-.54 9.089 1.512 12.035 1.004 1.44 2.192 3.051 3.755 3.051 1.499 0 2.07-.914 3.873-.914 1.799 0 2.334.914 3.934.914 1.63 0 2.649-1.455 3.647-2.904 1.155-1.688 1.633-3.325 1.655-3.411-.035-.013-3.175-1.218-3.207-4.821-.033-3.008 2.454-4.453 2.565-4.521-1.408-2.065-3.582-2.296-4.351-2.344-1.921-.153-3.513 1.078-4.457 1.078ZM15.485 3.647c.844-1.024 1.411-2.449 1.255-3.647-1.028.041-2.271.685-3.007 1.541-.661.764-1.238 2.222-1.082 3.38 1.144.089 2.299-.619 2.834-1.274Z"/>
                </svg>
                <div className="text-left leading-none">
                  <p className="text-[9px] uppercase font-bold opacity-60 mb-0.5">Download on the</p>
                  <p className="text-sm font-bold">App Store</p>
                </div>
              </button>

              <button className="bg-slate-900 text-white px-5 py-3 rounded-xl flex items-center gap-3 hover:bg-slate-800 transition-all border border-white/10 active:scale-95 shadow-xl">
                <svg viewBox="0 0 512 512" className="w-6 h-6 fill-current">
                  <path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z"/>
                </svg>
                <div className="text-left leading-none">
                  <p className="text-[9px] uppercase font-bold opacity-60 mb-0.5">Get it on</p>
                  <p className="text-sm font-bold">Google Play</p>
                </div>
              </button>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row items-center gap-20 lg:gap-0 mt-20">
            {/* Left Features */}
            <div className="flex-1 space-y-16 w-full order-2 lg:order-1">
              <AppFeature 
                number="01"
                title="Discovery Feed"
                desc="Smart filters to find what matters most to you—distance, price, or vibe."
              />
              <AppFeature 
                number="02"
                title="Verified Profiles"
                desc="Connect with landlords who have been vetted and rated by fellow students."
              />
            </div>

            {/* Interactive Phone Center */}
            <div className="flex-[1.5] relative px-10 order-1 lg:order-2 group">
              <div className="relative w-full max-w-[340px] aspect-[9/19.5] mx-auto bg-slate-900 rounded-[3.5rem] border-[10px] border-slate-800 shadow-[0_0_100px_rgba(59,130,246,0.3)] overflow-hidden">
                <img 
                  src="/assets/real-discovery.png" 
                  alt="Discovery Home" 
                  className="absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:opacity-0 group-hover:scale-110"
                />
                <img 
                  src="/assets/real-dashboard.png" 
                  alt="Landlord Dashboard" 
                  className="absolute inset-0 w-full h-full object-cover opacity-0 translate-y-10 transition-all duration-700 group-hover:opacity-100 group-hover:translate-y-0"
                />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-7 bg-slate-800 rounded-b-3xl z-30"></div>
              </div>
              <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-primary font-black text-xs uppercase tracking-widest animate-pulse whitespace-nowrap">
                Hover to switch modes
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[130%] h-[130%] bg-blue-600/10 blur-[150px] -z-10 rounded-full"></div>
            </div>

            {/* Right Features */}
            <div className="flex-1 space-y-16 w-full lg:text-right order-3">
              <AppFeature 
                number="03"
                title="Instant Booking"
                desc="Secure your room in minutes with digital signatures and safe campus payments."
                alignRight
              />
              <AppFeature 
                number="04"
                title="Host Dashboard"
                desc="Manage occupancy, earnings, and student inquiries all in one centralized hub."
                alignRight
              />
            </div>
          </div>
        </div>
      </section>

      {/* Community Hub Section */}
      <section className="px-6 py-48 md:px-20 max-w-7xl mx-auto overflow-hidden">
        <div className="flex flex-col lg:flex-row items-center gap-24">
          <div className="flex-1 space-y-12">
            <div>
              <h2 className="text-5xl font-black text-foreground tracking-tight leading-tight mb-6">
                Join the Kibabii Student Community Hub
              </h2>
              <p className="text-muted-foreground font-medium text-lg leading-relaxed max-w-xl">
                Beyond just housing, Kibabii Nest is where the community thrives. Refer friends, earn rewards, and find study buddies in your new home.
              </p>
            </div>

            <ul className="space-y-6">
              <ListItem text="Verified by Kibabii Nest Badge System" />
              <ListItem text="Instant Referral Rewards for successful bookings" />
              <ListItem text="Integrated Campus Partnership benefits" />
              <ListItem text="Bi-weekly community safety workshops" />
            </ul>

            <div className="bg-card p-10 rounded-[3rem] border border-border-subtle relative group overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-xl font-black text-foreground mb-2">Refer a student & Earn Ksh 50</h3>
                <p className="text-muted-foreground font-medium text-sm mb-8">Invited friends get Ksh 1000 off their first month rent.</p>
                <button 
                  onClick={() => {
                    if (!user) router.push('/auth/login');
                    else router.push('/dashboard/student');
                  }}
                  className="bg-[#10B981] text-white px-10 py-4 rounded-2xl font-black shadow-xl shadow-emerald-500/10 hover:bg-green-600 transition-all"
                >
                  Generate Referral Code
                </button>
              </div>
              <Award className="absolute -right-8 -bottom-8 text-primary/5 w-48 h-48 rotate-12 opacity-50 group-hover:rotate-0 transition-transform duration-700" />
            </div>
          </div>

          <div className="flex-1 relative">
            <div className="grid grid-cols-2 gap-6">
              {testimonials.length > 0 ? (
                <>
                  <div className="space-y-6 pt-12">
                    {testimonials.slice(0, 2).map((t, i) => (
                      <TestimonialCard 
                        key={i}
                        name={t.user?.name || "Student"}
                        role={t.user?.studentIdentity?.faculty ? `${t.user.studentIdentity.faculty}, Yr ${t.user.studentIdentity.yearOfStudy}` : "Kibabii Student"}
                        text={t.content}
                        image={t.user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${t.user?.name}`}
                      />
                    ))}
                  </div>
                  <div className="space-y-6">
                    {testimonials.slice(2, 4).map((t, i) => (
                      <TestimonialCard 
                        key={i}
                        name={t.user?.name || "Student"}
                        role={t.user?.studentIdentity?.faculty ? `${t.user.studentIdentity.faculty}, Yr ${t.user.studentIdentity.yearOfStudy}` : "Kibabii Student"}
                        text={t.content}
                        image={t.user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${t.user?.name}`}
                        active={i === 0}
                      />
                    ))}
                    {testimonials.length < 3 && (
                      <TestimonialCard 
                        name="100% transparent. No hidden fees or fake listings. This is how student housing should be."
                        role=""
                        text=""
                        image=""
                        justText
                      />
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-6 pt-12">
                    <TestimonialCard 
                      name="Sarah Jenkins"
                      role="Sophomore, Engineering"
                      text="Found my best friend and my studio through Kibabii Nest. The map feature is a lifesaver!"
                      image="https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah"
                    />
                  </div>
                  <div className="space-y-6">
                    <TestimonialCard 
                      name="Alex Thompson"
                      role="Host, Azure Commons"
                      text="As a landlord, the app made managing 24 rooms effortless. Highly recommend to all hosts!"
                      image="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex"
                      active
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Landlord CTA Section */}
      <section className="px-6 pb-48 md:px-20 max-w-7xl mx-auto">
        <div className="bg-primary rounded-[3rem] p-12 md:p-20 relative overflow-hidden flex flex-col lg:flex-row items-center gap-16 shadow-2xl shadow-primary/20">
          <div className="flex-1 space-y-10 relative z-10 text-center lg:text-left">
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
              Own a property near <br />
              Kibabii?
            </h2>
            <p className="text-blue-50 text-lg font-medium max-w-md mx-auto lg:mx-0 opacity-80 leading-relaxed">
              Join hundreds of landlords who trust Kibabii Nest to manage their student rentals. We handle the discovery, vetting, and booking process for you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <a 
                href="/auth/landlord" 
                onClick={(e) => handleCtaClick(e, '/auth/landlord')}
                className="bg-white text-primary px-10 py-5 rounded-2xl font-black shadow-xl shadow-primary/20 hover:bg-slate-50 hover:scale-[1.02] transition-all"
              >
                List Your Property
              </a>
              <a href="/support" className="bg-white/10 text-white border border-white/20 px-10 py-5 rounded-2xl font-black hover:bg-white/20 transition-all">
                Learn More
              </a>
            </div>
          </div>

          {/* Decorative shapes */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-white pt-24 pb-12 px-6 md:px-20 border-t border-white/5">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-20">
          <div className="space-y-8">
            <div className="text-3xl font-black tracking-tighter text-primary">Kibabii Nest</div>
            <p className="text-slate-400 font-medium leading-relaxed">
              The professional management platform for Kibabii landlords and the ultimate discovery app for students.
            </p>
            <div className="flex gap-4">
              <SocialIcon icon={<Globe size={18} />} />
              <SocialIcon icon={<Share2 size={18} />} />
              <SocialIcon icon={<MessageCircle size={18} />} />
            </div>
            {/* Play store apps in footer */}
            <div className="flex flex-col gap-3 pt-4">
              <button className="bg-white/5 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-white/10 transition-all border border-white/10 active:scale-95 text-left">
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                  <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.078-2.04 0-3.905 1.169-4.966 3.002-2.112 3.663-.54 9.089 1.512 12.035 1.004 1.44 2.192 3.051 3.755 3.051 1.499 0 2.07-.914 3.873-.914 1.799 0 2.334.914 3.934.914 1.63 0 2.649-1.455 3.647-2.904 1.155-1.688 1.633-3.325 1.655-3.411-.035-.013-3.175-1.218-3.207-4.821-.033-3.008 2.454-4.453 2.565-4.521-1.408-2.065-3.582-2.296-4.351-2.344-1.921-.153-3.513 1.078-4.457 1.078ZM15.485 3.647c.844-1.024 1.411-2.449 1.255-3.647-1.028.041-2.271.685-3.007 1.541-.661.764-1.238 2.222-1.082 3.38 1.144.089 2.299-.619 2.834-1.274Z"/>
                </svg>
                <div className="leading-none">
                  <p className="text-[7px] uppercase font-bold opacity-60 mb-0.5">Download on</p>
                  <p className="text-[10px] font-bold">App Store</p>
                </div>
              </button>
              <button className="bg-white/5 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-white/10 transition-all border border-white/10 active:scale-95 text-left">
                <svg viewBox="0 0 512 512" className="w-5 h-5 fill-current">
                  <path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z"/>
                </svg>
                <div className="leading-none">
                  <p className="text-[7px] uppercase font-bold opacity-60 mb-0.5">Get it on</p>
                  <p className="text-[10px] font-bold">Google Play</p>
                </div>
              </button>
            </div>
          </div>

          <div>
            <h4 className="font-black mb-8 text-lg">Platform</h4>
            <ul className="space-y-4 text-slate-400 font-bold text-sm">
              <li><a href="/auth/landlord" className="hover:text-primary transition-colors">List Property</a></li>
              <li><a href="/auth/login" className="hover:text-primary transition-colors">Host Dashboard</a></li>
              <li><a href="/support" className="hover:text-primary transition-colors">Safety Guidelines</a></li>
              <li><a href="/support" className="hover:text-primary transition-colors">Help Center</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-black mb-8 text-lg">Legal</h4>
            <ul className="space-y-4 text-slate-400 font-bold text-sm">
              <li><a href="/support" className="hover:text-primary transition-colors">Privacy Policy</a></li>
              <li><a href="/support" className="hover:text-primary transition-colors">Terms of Service</a></li>
              <li><a href="/support" className="hover:text-primary transition-colors">Booking Policy</a></li>
              <li><a href="/support" className="hover:text-primary transition-colors">Cookie Policy</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-black mb-8 text-lg">Contact</h4>
            <ul className="space-y-4 text-slate-400 font-bold text-sm text-slate-400">
              <li className="flex items-center gap-2"><MapPin size={14} /> Bungoma, KE</li>
              <li className="flex items-center gap-2"><Globe size={14} /> kibabiinest.com</li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-xs font-bold text-slate-500">
          <div>© 2026 Kibabii Nest. All rights reserved.</div>
          <div>Made for Kibabii University</div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="bg-card p-10 rounded-[2.5rem] border border-border-subtle hover:bg-muted hover:shadow-xl hover:-translate-y-1 transition-all duration-500 space-y-6">
      <div className="w-14 h-14 bg-background rounded-2xl flex items-center justify-center shadow-sm border border-border-subtle">
        {icon}
      </div>
      <h3 className="text-xl font-black text-foreground tracking-tight">{title}</h3>
      <p className="text-muted-foreground font-medium leading-relaxed text-sm">
        {desc}
      </p>
    </div>
  );
}

function AppFeature({ number, title, desc, alignRight }: { number: string, title: string, desc: string, alignRight?: boolean }) {
  return (
    <div className={`space-y-4 ${alignRight ? 'lg:text-right' : ''}`}>
      <div className={`flex items-center gap-4 ${alignRight ? 'lg:flex-row-reverse' : ''}`}>
        <div className="text-xl font-black text-primary/50 tracking-tighter">{number}</div>
        <div className="h-px bg-white/10 flex-1 max-w-[40px]"></div>
        <h3 className="text-xl font-black text-white tracking-tight">{title}</h3>
      </div>
      <p className="text-slate-400 font-medium text-sm leading-relaxed max-w-sm ml-auto mr-auto lg:ml-0 lg:mr-0">
        {desc}
      </p>
    </div>
  );
}

function ListItem({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-4 text-muted-foreground font-bold">
      <CheckCircle2 size={20} className="text-[#10B981]" />
      {text}
    </li>
  );
}

function TestimonialCard({ name, role, text, image, active = false, justText = false }: { name: string, role: string, text: string, image: string, active?: boolean, justText?: boolean }) {
  if (justText) {
    return (
      <div className="bg-card p-8 rounded-[2rem] border border-border-subtle shadow-sm">
        <p className="text-muted-foreground font-bold text-sm leading-relaxed italic">
          "{name}"
        </p>
      </div>
    );
  }
  return (
    <div className={`p-8 rounded-[2rem] border border-border-subtle shadow-xl transition-all duration-500 ${active ? 'bg-primary text-white scale-105 shadow-primary/20' : 'bg-card text-foreground hover:scale-105'}`}>
      <p className={`text-sm font-bold leading-relaxed mb-6 ${active ? 'text-white' : 'text-muted-foreground italic'}`}>
        "{text}"
      </p>
      <div className="flex items-center gap-4">
        <img src={image} className="w-10 h-10 rounded-full bg-muted" />
        <div>
          <div className="text-sm font-black">{name}</div>
          <div className={`text-[10px] font-bold ${active ? 'text-blue-100' : 'text-muted-foreground'}`}>{role}</div>
        </div>
      </div>
    </div>
  );
}

function StatsCard({ value, label, bg }: { value: string, label: string, bg: string }) {
  return (
    <div className={`${bg} backdrop-blur-xl p-10 rounded-[2.5rem] border border-white/10 text-center min-w-[220px] space-y-2`}>
      <div className="text-4xl font-black text-white tracking-tighter">{value}</div>
      <div className="text-xs font-bold text-blue-100 uppercase tracking-widest">{label}</div>
    </div>
  );
}

function SocialIcon({ icon }: { icon: React.ReactNode }) {
  return (
    <a href="#" className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-slate-400 hover:bg-primary hover:text-white transition-all">
      {icon}
    </a>
  );
}

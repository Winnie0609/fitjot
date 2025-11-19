'use client';

import { ArrowRight, Menu } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { NavItem } from '@/components/ui/nav-item';
import { NAVIGATION_ITEMS } from '@/constants/navigation';

const _MARQUEE_ITEMS = [
  { id: 'workout', label: 'Workout' },
  { id: 'logo', label: 'FitJot' },
];

const REPEAT_COUNT = 15;

const MARQUEE_ITEMS = Array.from(
  { length: REPEAT_COUNT * _MARQUEE_ITEMS.length },
  (_, i) => {
    return _MARQUEE_ITEMS[i % _MARQUEE_ITEMS.length];
  }
);

const FAQ_ITEMS = [
  {
    id: 'item-1',
    question: 'Is this workout tracking app free?',
    answer: 'Yes, FitJot is completely free.',
  },
  {
    id: 'item-2',
    question: 'Can I use this on my mobile device?',
    answer:
      'Absolutely. The app is fully responsive and designed to work seamlessly on all devices.',
  },
  {
    id: 'item-3',
    question: 'Can I export my workout data?',
    answer:
      'Data export is a planned feature. We believe you should always have control over your personal data.',
  },
  {
    id: 'item-4',
    question: 'What is InBody integration?',
    answer:
      'InBody is a device that analyzes body composition. Our app allows you to log these results to track your progress alongside your workout data.',
  },
];

export function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const navbar = document.querySelector('nav');
      const navbarHeight = navbar?.offsetHeight || 80;

      const sections = document.querySelectorAll('section[id]');
      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        const sectionTop = rect.top + window.scrollY - navbarHeight - 100;
        const sectionBottom = sectionTop + rect.height;
        const scrollPosition = window.scrollY;

        if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
          setActiveSection(section.id);
        }
      });
    };

    handleScroll();

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSmoothScroll = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
      e.preventDefault();
      e.stopPropagation(); // prevent event from bubbling up to the parent element

      const element = document.getElementById(targetId);
      if (!element) return;

      const navbar = document.querySelector('nav');
      const navbarHeight = navbar?.offsetHeight || 80;
      const rect = element.getBoundingClientRect();
      const elementPosition = rect.top + window.scrollY - navbarHeight;

      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth',
      });

      setMobileMenuOpen(false);
    },
    []
  );

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Navbar */}
      <nav className="sticky top-2 md:top-4 z-50 px-4 md:px-6 lg:px-12 py-2 md:py-4 max-w-5xl mx-auto">
        <div className="bg-black rounded-full shadow-lg">
          <div className="container max-w-6xl mx-auto flex h-12 md:h-14 items-center justify-between px-4 md:px-6">
            <div className="cursor-pointer" onClick={() => scrollToTop()}>
              <Image
                src="/images/logo.png"
                alt="FitJot logo"
                width={100}
                height={100}
                className="w-20 h-auto md:w-[100px] md:h-auto"
                priority
              />
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              {NAVIGATION_ITEMS.map((item) => (
                <NavItem
                  key={item.id}
                  href={item.href}
                  label={item.label}
                  isActive={activeSection === item.id}
                  onClick={(e) => handleSmoothScroll(e, item.id)}
                />
              ))}
              <Link href="/login">
                <Button
                  size="sm"
                  className="bg-[#CDFE5A] text-black hover:bg-[#B8E551] rounded-full px-6"
                >
                  Login
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-2 bg-black text-white rounded-3xl shadow-lg p-6">
            <div className="flex flex-col gap-4">
              {NAVIGATION_ITEMS.map((item) => (
                <NavItem
                  key={item.id}
                  href={item.href}
                  label={item.label}
                  isActive={activeSection === item.id}
                  onClick={(e) => handleSmoothScroll(e, item.id)}
                  className="py-2"
                />
              ))}
              <div className="border-t border-white/20 pt-4 flex flex-col gap-3">
                <Link href="/login">
                  <Button
                    size="sm"
                    className="w-full bg-[#CDFE5A] text-black hover:bg-[#B8E551] rounded-full"
                  >
                    Login
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-12 md:pt-20 md:pb-24">
        <div className="container max-w-6xl mx-auto px-6 md:px-8">
          <div className="grid md:grid-cols-2 gap-8 md:gap-16 lg:gap-20 items-center">
            {/* Left: Text Content */}
            <div className="text-left">
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4 md:mb-6">
                Effortless Tracking,
                <br />
                Powerful Results.
              </h1>
              <p className="text-base md:text-lg lg:text-xl text-muted-foreground mb-6 md:mb-8 max-w-xl">
                Say goodbye to paper and complex spreadsheets. A minimalist
                training log designed for fitness enthusiasts, focusing on your
                every growth.
              </p>
              <Link href="/signup">
                <Button
                  size="lg"
                  className="bg-[#CDFE5A] text-black hover:bg-[#B8E551] text-base md:text-lg px-6 md:px-6 py-3 rounded-full"
                >
                  <div className="ml-2 md:ml-4">Log Your First Workout</div>
                  <ArrowRight className="mx-2 h-4 w-4 md:h-5 md:w-5" />
                </Button>
              </Link>
            </div>

            {/* Right: Hero Image */}
            <Image
              src="/images/hero.jpg"
              alt="Woman training at gym"
              width={500}
              height={312}
              className="w-full h-auto object-cover relative rounded-2xl overflow-hidden aspect-16/10"
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 md:py-20 bg-muted/30">
        <div className="container max-w-6xl mx-auto px-6 md:px-8">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-12 md:mb-16 lg:mb-22">
            All You Need, Nothing You Don&apos;t
          </h2>
          <div className="grid md:grid-cols-3 gap-8 md:gap-6 lg:gap-0 px-4 md:px-12 lg:px-24">
            {/* Feature 1 */}
            <div className="text-center px-4 md:px-6">
              <div className="flex items-center justify-center mb-4 md:mb-6">
                <Image
                  src="/images/kettlebell.png"
                  alt="Kettlebell icon"
                  width={75}
                  height={75}
                  className="w-16 h-16 md:w-auto md:h-[75px]"
                  loading="lazy"
                />
              </div>
              <h3 className="text-lg md:text-xl font-bold mb-3 md:mb-4">
                Minimalist Workout Log
              </h3>
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                Quickly log your exercise, sets, weight, and reps with a clean
                and intuitive interface.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center px-4 md:px-6">
              <div className="flex items-center justify-center mb-4 md:mb-6">
                <Image
                  src="/images/report.png"
                  alt="Analytics chart icon"
                  width={90}
                  height={90}
                  className="w-16 h-16 md:w-auto md:h-[80px]"
                  loading="lazy"
                />
              </div>
              <h3 className="text-lg md:text-xl font-bold mb-3 md:mb-4">
                Data-Driven Insights
              </h3>
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                Automatically visualize your training volume, intensity, and
                progress curves. Let the data guide you.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center px-4 md:px-6">
              <div className="flex items-center justify-center mb-4 md:mb-6">
                <Image
                  src="/images/body.png"
                  alt="Body composition icon"
                  width={80}
                  height={80}
                  className="w-16 h-16 md:w-auto md:h-[75px]"
                  loading="lazy"
                />
              </div>
              <h3 className="text-lg md:text-xl font-bold mb-3 md:mb-4">
                Body Composition Analysis
              </h3>
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                Integrate your InBody data to track weight, muscle mass, and
                body fat for a comprehensive overview.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Marquee Section */}
      <section className="py-2 md:py-3 overflow-hidden bg-black">
        <div className="flex shrink-0 whitespace-nowrap animate-marquee">
          <div className="flex items-center gap-2 md:gap-4 mx-2 md:mx-4">
            {MARQUEE_ITEMS.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-2 md:gap-4 mx-5 md:mx-4"
              >
                {item.id === 'workout' && (
                  <span className="text-[#CDFE5A] text-base md:text-xl mb-0.5 mx-1 md:mx-2 font-bold">
                    {item.label}
                  </span>
                )}
                <Image
                  src="/images/logo.png"
                  alt=""
                  width={80}
                  height={80}
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-12 md:py-24">
        <div className="container max-w-6xl mx-auto px-6 md:px-8">
          <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center mb-12 md:mb-30">
            {/* Step 1 */}
            <div className="order-2 md:order-1">
              <div className="relative w-full">
                {/* Desktop Mockup */}
                <div className="rounded-lg flex items-center justify-center w-full">
                  <Image
                    src="/images/mock-desktop.png"
                    alt="Workout logging interface on desktop"
                    width={500}
                    height={500}
                    className="w-full h-auto"
                    loading="lazy"
                  />
                </div>

                {/* Mobile Mockup - Overlaid */}
                <div className="absolute bottom-2 md:bottom-4 right-0 w-1/3 md:w-1/4 top-12 md:top-20 z-10 drop-shadow-2xl">
                  <Image
                    src="/images/mock-mobile.gif"
                    alt="Workout logging on mobile device"
                    width={200}
                    height={400}
                    className="md:w-full md:h-auto w-4/5 h-auto rounded-lg md:rounded-3xl"
                    unoptimized
                  />
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <h3 className="text-2xl md:text-3xl font-bold mb-3 md:mb-4">
                1. Log Your Session
              </h3>
              <p className="text-muted-foreground text-base md:text-lg max-w-md">
                Simply select exercises and record your sets, reps, and weight
                as you go. Our intuitive interface makes live tracking
                effortless.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">
            <div>
              <h3 className="text-2xl md:text-3xl font-bold mb-3 md:mb-4">
                2. Analyze and Grow
              </h3>
              <p className="text-muted-foreground text-base md:text-lg max-w-md">
                Review historical data and charts to understand your progress
                and make informed decisions for your next workout.
              </p>
            </div>
            <div>
              <div className="rounded-lg flex items-center justify-center w-full">
                <Image
                  src="/images/analysis.jpg"
                  alt="Workout analytics dashboard with charts"
                  width={1000}
                  height={562}
                  className="w-full h-auto aspect-16/9 object-cover rounded-2xl"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-0 px-6 md:py-16 lg:py-20">
        <div className="container max-w-5xl mx-auto  md:px-6 lg:px-12">
          <div className="bg-[#F5FED7] rounded-2xl md:rounded-3xl px-6 md:px-12 lg:px-16 py-6 md:py-8">
            <div className="flex flex-col md:flex-row gap-10 md:gap-20 items-center">
              {/* Left: Illustration */}
              <div className="flex items-center justify-center w-full md:w-1/3">
                <Image
                  src="/images/cta.png"
                  alt="Person ready to start training"
                  width={500}
                  height={500}
                  className="md:w-full md:h-auto w-3/4 h-auto"
                  loading="lazy"
                />
              </div>

              {/* Right: Text Content */}
              <div className="text-left w-full md:w-2/3">
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2 md:mb-4 leading-tight">
                  Make Every Rep Count!
                </h2>
                <p className="text-base md:text-lg text-muted-foreground mb-6 md:mb-8 leading-relaxed">
                  Your strongest self is built one rep at a time. Start logging
                  your progress today and build the consistency that fuels real
                  growth.
                </p>
                <Link href="/signup">
                  <Button
                    size="lg"
                    className="bg-black text-white hover:bg-[#1A1A1A] text-base md:text-lg px-6 md:px-8 rounded-full"
                  >
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-12 md:py-20 bg-muted/30">
        <div className="container max-w-6xl mx-auto px-6 md:px-8">
          <div className="grid md:grid-cols-2 gap-14 md:gap-16 items-center">
            <div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-6 md:mb-8">
                Frequently Asked Questions
              </h2>
              <Accordion type="single" collapsible className="w-full">
                {FAQ_ITEMS.map((faq) => (
                  <AccordionItem key={faq.id} value={faq.id}>
                    <AccordionTrigger className="text-left text-sm md:text-base">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm md:text-base">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            <div className="flex items-center justify-center order-first md:order-last">
              <div className="relative w-48 h-48 md:w-72 md:h-72 flex items-center justify-center">
                {/* Background Circle */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 md:w-64 md:h-64 bg-primary/5 rounded-full" />

                {/* Image */}
                <div className="relative z-10 w-24 md:w-40 md:h-auto">
                  <Image
                    src="/images/faq.png"
                    alt="Person with question mark"
                    width={250}
                    height={250}
                    className="w-full h-auto"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-4 md:pt-10 md:pb-4 bg-muted/20 text-white">
        <div className="bg-black mx-4 rounded-3xl">
          <div className="container max-w-6xl mx-auto p-10 md:px-8">
            <div className="grid md:grid-cols-3 gap-6 md:gap-8 mb-6 md:mb-8">
              <div>
                <div
                  className="flex items-center gap-2 font-bold text-xl mb-2 cursor-pointer"
                  onClick={() => scrollToTop()}
                >
                  <Image
                    src="/images/logo.png"
                    alt="FitJot logo"
                    width={100}
                    height={100}
                    className="w-20 h-auto md:w-[100px] md:h-auto"
                  />
                </div>
                <p className="text-xs md:text-sm">
                  Your Digital Training Partner.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2 md:mb-3 text-sm md:text-base text-[#CDFE5A]">
                  Product
                </h4>
                <div className="flex flex-col gap-2">
                  <a
                    href="#features"
                    onClick={(e) => handleSmoothScroll(e, 'features')}
                    className="text-xs md:text-sm  hover:underline transition-all"
                  >
                    Features
                  </a>
                  <a
                    href="#how-it-works"
                    onClick={(e) => handleSmoothScroll(e, 'how-it-works')}
                    className="text-xs md:text-sm  hover:underline transition-all"
                  >
                    How It Works
                  </a>
                  <a
                    href="#faq"
                    onClick={(e) => handleSmoothScroll(e, 'faq')}
                    className="text-xs md:text-sm  hover:underline transition-all"
                  >
                    FAQ
                  </a>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2 md:mb-3 text-sm md:text-base text-[#CDFE5A]">
                  Resources
                </h4>
                <div className="flex flex-col gap-2">
                  <a
                    href="mailto:winnieong0609@gmail.com"
                    className="text-xs md:text-sm  hover:underline"
                  >
                    Contact
                  </a>
                  <a
                    target="_blank"
                    href="https://github.com/Winnie0609/fitjot"
                    className="text-xs md:text-sm  hover:underline"
                  >
                    Source Code
                  </a>
                </div>
              </div>
            </div>
            <div className="border-t pt-6 md:pt-8 flex flex-col md:flex-row justify-between items-center gap-2 md:gap-4">
              <p className="text-xs md:text-sm">
                Built for lifter, by a lifter.
              </p>
              <p className="text-xs md:text-sm">
                © {new Date().getFullYear()}{' '}
                <span className="text-[#CDFE5A] font-bold">FitJot</span>. All
                rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

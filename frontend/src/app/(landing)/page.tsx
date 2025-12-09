'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Lock, Lightbulb, Zap, ArrowRight, Sparkles, Shield, Users } from 'lucide-react';

export default function HomePage() {
  const scrollToExplanation = () => {
    document.getElementById('explanation')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-100 dark:from-gray-950 dark:via-blue-950/20 dark:to-indigo-950/20">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="container relative mx-auto px-4 py-20 md:py-32">
          <div className="mx-auto max-w-4xl text-center">
            {/* Badge */}
            <div className="mb-6 flex justify-center">
              <Badge variant="primary" className="text-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Hackathon Prototype 2.0
              </Badge>
            </div>

            {/* Main Title */}
            <h1 className="mb-6 text-5xl font-bold leading-tight text-gray-900 dark:text-gray-100 md:text-6xl lg:text-7xl">
              Smart ID as an{' '}
              <span className="bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                Accessibility Key
              </span>{' '}
              for the Deaf
            </h1>

            {/* Subtitle */}
            <p className="mb-10 text-lg text-gray-600 dark:text-gray-400 md:text-xl">
              Tap your Smart ID to auto-activate &quot;Deaf Mode&quot; at government kiosks.
              <br />
              Seamlessly communicate via our AI-powered Sign Language Avatar.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/demo">
                <Button size="lg" className="group w-full sm:w-auto">
                  Try Demo
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                onClick={scrollToExplanation}
                className="w-full sm:w-auto"
              >
                View Concept
              </Button>
            </div>
          </div>
        </div>

        {/* Decorative Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1440 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full"
          >
            <path
              d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
              className="fill-white dark:fill-gray-950"
            />
          </svg>
        </div>
      </section>

      {/* Explanation Section */}
      <section id="explanation" className="bg-white py-20 dark:bg-gray-950">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <Badge variant="primary" className="mb-4">
              How It Works
            </Badge>
            <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-gray-100 md:text-4xl">
              Three Simple Steps to Inclusive Communication
            </h2>
            <p className="mx-auto max-w-2xl text-gray-600 dark:text-gray-400">
              Our Smart ID system revolutionizes accessibility by automatically detecting and
              adapting to user needs.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {/* Step 1 */}
            <Card className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <div className="mb-4 inline-flex rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 p-3">
                  <Lock className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">Secure Auto-Detect</CardTitle>
                <CardDescription>
                  Tap your Smart ID card at any government kiosk to instantly activate Deaf Mode
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-600">•</span>
                    <span>Encrypted accessibility preferences stored on card</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-600">•</span>
                    <span>No manual setup required at each visit</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-600">•</span>
                    <span>Privacy-first biometric authentication</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Step 2 */}
            <Card className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <div className="mb-4 inline-flex rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 p-3">
                  <Lightbulb className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">Sign → Speech</CardTitle>
                <CardDescription>
                  Use Malaysian Sign Language (BIM) - AI converts to text and speech in real-time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600">•</span>
                    <span>Advanced gesture recognition technology</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600">•</span>
                    <span>Supports full BIM vocabulary</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600">•</span>
                    <span>Instant translation for officers</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Step 3 */}
            <Card className="transition-shadow hover:shadow-lg">
              <CardHeader>
                <div className="mb-4 inline-flex rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 p-3">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">Speech → Avatar</CardTitle>
                <CardDescription>
                  Officer&apos;s response is shown through an animated sign language avatar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">•</span>
                    <span>Realistic 3D avatar with accurate gestures</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">•</span>
                    <span>Natural facial expressions included</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">•</span>
                    <span>Bilingual support (BM & English)</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gradient-to-br from-gray-50 to-blue-50 py-20 dark:from-gray-900 dark:to-gray-950">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <Badge variant="success" className="mb-4">
              <Shield className="h-3.5 w-3.5" />
              Privacy & Security First
            </Badge>
            <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-gray-100 md:text-4xl">
              Built for Everyone, Secured for You
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <Shield className="mb-2 h-8 w-8 text-cyan-600" />
                <CardTitle className="text-lg">End-to-End Encryption</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  All accessibility preferences encrypted on your Smart ID. Only you control your
                  data.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Zap className="mb-2 h-8 w-8 text-purple-600" />
                <CardTitle className="text-lg">Powered by AI</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  State-of-the-art machine learning models trained on Malaysian Sign Language.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="mb-2 h-8 w-8 text-green-600" />
                <CardTitle className="text-lg">Universal Access</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Works at all government kiosks nationwide. No special hardware needed.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-cyan-600 to-blue-600 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">
            Ready to Experience the Future?
          </h2>
          <p className="mb-8 text-lg text-cyan-100">
            Try our interactive demo and see how Smart ID transforms accessibility.
          </p>
          <Link href="/demo">
            <Button
              size="lg"
              className="bg-white text-cyan-600 hover:bg-gray-100 dark:bg-gray-900 dark:text-cyan-400 dark:hover:bg-gray-800"
            >
              Launch Demo
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}



import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  AlertCircle,
  CheckCircle,
  Fingerprint,
  Shield,
  Smartphone,
  Wifi,
  Users,
  Globe,
  Zap,
  Lock,
  Server,
  MapPin,
} from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Hero Section */}
      <section className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-16">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="primary" className="mb-4">
              About the Project
            </Badge>
            <h1 className="mb-4 text-4xl font-bold text-gray-900 dark:text-gray-100 md:text-5xl">
              Building an Inclusive Malaysia
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Smart ID Sign Avatar is an AI hybrid system demonstrating how Smart ID technology
              can revolutionize accessibility for the deaf community in Malaysia.
            </p>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-4 py-12">
        {/* Problem Section */}
        <section className="mb-16">
          <div className="mb-8 text-center">
            <Badge variant="danger" className="mb-4">
              <AlertCircle className="h-3.5 w-3.5" />
              The Problem
            </Badge>
            <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-gray-100">
              Communication Barriers in Public Services
            </h2>
          </div>

          <div className="mx-auto max-w-4xl">
            <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="mb-3 text-xl font-semibold text-gray-900 dark:text-gray-100">
                      Current Challenges for Deaf Citizens
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-lg bg-white p-4 dark:bg-gray-900">
                        <h4 className="mb-2 font-medium text-gray-900 dark:text-gray-100">
                          At Government Kiosks
                        </h4>
                        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                          <li className="flex items-start gap-2">
                            <span className="text-red-600">•</span>
                            <span>No automatic detection of accessibility needs</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-red-600">•</span>
                            <span>Officers often lack sign language training</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-red-600">•</span>
                            <span>Manual setup required at every visit</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-red-600">•</span>
                            <span>Limited or no interpreter availability</span>
                          </li>
                        </ul>
                      </div>

                      <div className="rounded-lg bg-white p-4 dark:bg-gray-900">
                        <h4 className="mb-2 font-medium text-gray-900 dark:text-gray-100">
                          Impact on Daily Life
                        </h4>
                        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                          <li className="flex items-start gap-2">
                            <span className="text-red-600">•</span>
                            <span>Delays in accessing essential services</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-red-600">•</span>
                            <span>Frustration and communication breakdowns</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-red-600">•</span>
                            <span>Need to bring interpreters or family members</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-red-600">•</span>
                            <span>Reduced independence and dignity</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border-l-4 border-red-600 bg-white p-4 dark:bg-gray-900">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      <strong>Key Statistic:</strong> There are over 44,000 Deaf Malaysians living with hearing impairment, yet there are only about 60 active sign language interpreters serving this entire community, highlighting serious communication barriers across society including public services.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Solution Section */}
        <section className="mb-16">
          <div className="mb-8 text-center">
            <Badge variant="success" className="mb-4">
              <CheckCircle className="h-3.5 w-3.5" />
              How Smart ID Helps
            </Badge>
            <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-gray-100">
              Three Ways Smart ID Transforms Accessibility
            </h2>
          </div>

          <div className="mx-auto max-w-5xl">
            <div className="grid gap-6 md:grid-cols-3">
              {/* Solution 1 */}
              <Card className="border-cyan-200 bg-gradient-to-br from-cyan-50 to-blue-50 dark:border-cyan-800 dark:from-cyan-950/20 dark:to-blue-950/20">
                <CardHeader>
                  <div className="mb-3 inline-flex rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 p-3">
                    <Fingerprint className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">1. Encrypted Accessibility Profile</CardTitle>
                  <CardDescription>
                    Your Smart ID stores encrypted accessibility preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                    <li className="flex items-start gap-2">
                      <Shield className="mt-0.5 h-4 w-4 flex-shrink-0 text-cyan-600" />
                      <span>
                        <strong>Secure Storage:</strong> Preferences encrypted on chip using
                        military-grade encryption
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Lock className="mt-0.5 h-4 w-4 flex-shrink-0 text-cyan-600" />
                      <span>
                        <strong>Privacy First:</strong> Only you control who accesses your
                        accessibility data
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Zap className="mt-0.5 h-4 w-4 flex-shrink-0 text-cyan-600" />
                      <span>
                        <strong>One-Time Setup:</strong> Configure once, works everywhere
                        automatically
                      </span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Solution 2 */}
              <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 dark:border-purple-800 dark:from-purple-950/20 dark:to-pink-950/20">
                <CardHeader>
                  <div className="mb-3 inline-flex rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 p-3">
                    <Smartphone className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">2. Auto-Activate Deaf Mode</CardTitle>
                  <CardDescription>
                    Kiosks instantly adapt when you tap your Smart ID
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                    <li className="flex items-start gap-2">
                      <Zap className="mt-0.5 h-4 w-4 flex-shrink-0 text-purple-600" />
                      <span>
                        <strong>Instant Recognition:</strong> NFC tap triggers Deaf Mode in &lt;1
                        second
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Users className="mt-0.5 h-4 w-4 flex-shrink-0 text-purple-600" />
                      <span>
                        <strong>No Manual Setup:</strong> Officers don&apos;t need to configure
                        anything
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Globe className="mt-0.5 h-4 w-4 flex-shrink-0 text-purple-600" />
                      <span>
                        <strong>Universal Standard:</strong> Works at all government kiosks
                        nationwide
                      </span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Solution 3 */}
              <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 dark:border-green-800 dark:from-green-950/20 dark:to-emerald-950/20">
                <CardHeader>
                  <div className="mb-3 inline-flex rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 p-3">
                    <Wifi className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">3. Hybrid AI Processing</CardTitle>
                  <CardDescription>
                    Privacy-focused hybrid processing with local hand detection
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                    <li className="flex items-start gap-2">
                      <Server className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                      <span>
                        <strong>Local Hand Detection:</strong> MediaPipe runs on-device for fast hand tracking
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Shield className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                      <span>
                        <strong>Privacy-Focused:</strong> Hand detection happens locally; only cropped hand regions sent for classification
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Zap className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                      <span>
                        <strong>Cloud-Enhanced:</strong> Roboflow API provides accurate sign classification; OpenAI enhances interpretation
                      </span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Roadmap Section */}
        <section>
          <div className="mb-8 text-center">
            <Badge variant="purple" className="mb-4">
              <MapPin className="h-3.5 w-3.5" />
              Future Roadmap
            </Badge>
            <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-gray-100">
              Path to Real-World Deployment
            </h2>
            <p className="mx-auto max-w-2xl text-gray-600 dark:text-gray-400">
              Our vision for scaling this prototype into a nationwide accessibility solution
            </p>
          </div>

          <div className="mx-auto max-w-5xl">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Phase 1 */}
              <Card>
                <CardHeader>
                  <Badge variant="primary" className="mb-2 w-fit">
                    Phase 1: Q1-Q2 2026
                  </Badge>
                  <CardTitle className="text-xl">Pilot Program</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                    <li className="flex items-start gap-3">
                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-cyan-100 text-xs font-bold text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400">
                        1
                      </span>
                      <span>
                        <strong className="text-gray-900 dark:text-gray-100">
                          Kiosk Integration:
                        </strong>{' '}
                        Deploy at 10 pilot government offices in Kuala Lumpur
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-cyan-100 text-xs font-bold text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400">
                        2
                      </span>
                      <span>
                        <strong className="text-gray-900 dark:text-gray-100">
                          Smart ID Update:
                        </strong>{' '}
                        Add accessibility profile field to Smart ID chip specification
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-cyan-100 text-xs font-bold text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400">
                        3
                      </span>
                      <span>
                        <strong className="text-gray-900 dark:text-gray-100">
                          User Testing:
                        </strong>{' '}
                        Partner with Malaysian Federation of the Deaf for feedback
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-cyan-100 text-xs font-bold text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400">
                        4
                      </span>
                      <span>
                        <strong className="text-gray-900 dark:text-gray-100">
                          BIM Model Training:
                        </strong>{' '}
                        Expand Malaysian Sign Language vocabulary to 5,000+ signs
                      </span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Phase 2 */}
              <Card>
                <CardHeader>
                  <Badge variant="success" className="mb-2 w-fit">
                    Phase 2: Q3-Q4 2026
                  </Badge>
                  <CardTitle className="text-xl">National Rollout</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                    <li className="flex items-start gap-3">
                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        1
                      </span>
                      <span>
                        <strong className="text-gray-900 dark:text-gray-100">
                          Nationwide Deployment:
                        </strong>{' '}
                        Install at all 500+ government service centers
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        2
                      </span>
                      <span>
                        <strong className="text-gray-900 dark:text-gray-100">
                          Biometric Enhancement:
                        </strong>{' '}
                        Integrate fingerprint/face recognition for secure activation
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        3
                      </span>
                      <span>
                        <strong className="text-gray-900 dark:text-gray-100">
                          Mobile App:
                        </strong>{' '}
                        Launch companion app for managing accessibility preferences
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        4
                      </span>
                      <span>
                        <strong className="text-gray-900 dark:text-gray-100">
                          Officer Training:
                        </strong>{' '}
                        Train 10,000+ government officers on system usage
                      </span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Phase 3 */}
              <Card>
                <CardHeader>
                  <Badge variant="purple" className="mb-2 w-fit">
                    Phase 3: 2027
                  </Badge>
                  <CardTitle className="text-xl">Advanced Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                    <li className="flex items-start gap-3">
                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                        1
                      </span>
                      <span>
                        <strong className="text-gray-900 dark:text-gray-100">
                          Multi-Language Support:
                        </strong>{' '}
                        Add support for international sign languages (ASL, BSL, etc.)
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                        2
                      </span>
                      <span>
                        <strong className="text-gray-900 dark:text-gray-100">
                          Emotion Recognition:
                        </strong>{' '}
                        Enhance avatar with natural facial expressions and emotions
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                        3
                      </span>
                      <span>
                        <strong className="text-gray-900 dark:text-gray-100">
                          Context Awareness:
                        </strong>{' '}
                        AI learns common government service workflows for better translation
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                        4
                      </span>
                      <span>
                        <strong className="text-gray-900 dark:text-gray-100">
                          Private Sector:
                        </strong>{' '}
                        Expand to banks, hospitals, and retail through API licensing
                      </span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Phase 4 */}
              <Card>
                <CardHeader>
                  <Badge variant="warning" className="mb-2 w-fit">
                    Phase 4: 2028+
                  </Badge>
                  <CardTitle className="text-xl">Ecosystem Expansion</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                    <li className="flex items-start gap-3">
                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        1
                      </span>
                      <span>
                        <strong className="text-gray-900 dark:text-gray-100">
                          Regional Expansion:
                        </strong>{' '}
                        Partner with ASEAN countries for cross-border accessibility
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        2
                      </span>
                      <span>
                        <strong className="text-gray-900 dark:text-gray-100">
                          Other Disabilities:
                        </strong>{' '}
                        Extend Smart ID profiles for blind, mobility-impaired users
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        3
                      </span>
                      <span>
                        <strong className="text-gray-900 dark:text-gray-100">
                          Open Source SDK:
                        </strong>{' '}
                        Release developer tools for third-party integrations
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        4
                      </span>
                      <span>
                        <strong className="text-gray-900 dark:text-gray-100">
                          UN Partnership:
                        </strong>{' '}
                        Collaborate with WHO for global accessibility standards
                      </span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="mt-16">
          <Card className="border-cyan-200 bg-gradient-to-br from-cyan-50 to-blue-50 dark:border-cyan-800 dark:from-cyan-950/20 dark:to-blue-950/20">
            <CardContent className="py-8 text-center">
              <h3 className="mb-3 text-2xl font-bold text-gray-900 dark:text-gray-100">
                Join Us in Building an Inclusive Future
              </h3>
              <p className="mb-6 text-gray-600 dark:text-gray-400">
                This is a hackathon prototype. We&apos;re seeking partnerships with government
                agencies, technology providers, and accessibility advocates to make this vision a
                reality.
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-sm">
                <Badge variant="primary">
                  <Users className="h-3.5 w-3.5" />
                  44,000+ Potential Users
                </Badge>
                <Badge variant="success">
                  <Globe className="h-3.5 w-3.5" />
                  Nationwide Impact
                </Badge>
                <Badge variant="purple">
                  <Zap className="h-3.5 w-3.5" />
                  Scalable Technology
                </Badge>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}



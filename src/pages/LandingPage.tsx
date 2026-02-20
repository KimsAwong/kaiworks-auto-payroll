import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { 
  Clock, 
  FileText, 
  Users, 
  Shield, 
  BarChart3, 
  MessageCircle,
  ArrowRight,
  CheckCircle
} from "lucide-react";

const features = [
  {
    icon: <Clock className="h-6 w-6" />,
    title: "Smart Timesheets",
    description: "Workers submit daily hours that automatically calculate pay"
  },
  {
    icon: <FileText className="h-6 w-6" />,
    title: "Auto Payslips",
    description: "Payslips generated automatically—no manual editing required"
  },
  {
    icon: <Users className="h-6 w-6" />,
    title: "Worker Management",
    description: "Manage permanent and temporary workers with contract tracking"
  },
  {
    icon: <Shield className="h-6 w-6" />,
    title: "Secure Auth",
    description: "PNG phone number + email verification for all users"
  },
  {
    icon: <BarChart3 className="h-6 w-6" />,
    title: "CEO Analytics",
    description: "Full visibility into workforce performance and payroll"
  },
  {
    icon: <MessageCircle className="h-6 w-6" />,
    title: "Team Chat",
    description: "WhatsApp-like messaging between workers and supervisors"
  }
];

const roles = [
  { name: "CEO / Owner", color: "bg-primary" },
  { name: "General Manager", color: "bg-accent" },
  { name: "Supervisors", color: "bg-warning" },
  { name: "Workers", color: "bg-success" }
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Logo size="md" />
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link to="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-5" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <CheckCircle size={16} />
              Built for Papua New Guinea Businesses
            </div>
            
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Workforce Management
              <span className="block text-gradient">Made Simple</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Automate timesheets, generate payslips instantly, and manage your entire workforce 
              from CEO to temporary workers—all in one powerful platform.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup">
                <Button size="lg" className="gap-2 px-8">
                  Create Account
                  <ArrowRight size={18} />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="gap-2">
                Watch Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Hierarchy Visualization */}
      <section className="py-16 bg-secondary/30">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-center mb-12">
            Complete Organizational Hierarchy
          </h2>
          
          <div className="flex flex-col items-center gap-4 max-w-md mx-auto">
            {roles.map((role, index) => (
              <div key={role.name} className="relative w-full">
                <div className={`${role.color} text-white px-6 py-4 rounded-lg text-center font-medium shadow-lg`}>
                  {role.name}
                </div>
                {index < roles.length - 1 && (
                  <div className="absolute left-1/2 -translate-x-1/2 top-full h-4 w-0.5 bg-border" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
              Everything You Need
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              A complete workforce management solution designed for PNG businesses
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-card border border-border rounded-xl p-6 card-hover"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="font-display text-lg font-semibold mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Ready to Transform Your Workforce?
          </h2>
          <p className="text-primary-foreground/80 text-lg mb-8 max-w-2xl mx-auto">
            Join businesses across Papua New Guinea who are simplifying their payroll and workforce management.
          </p>
          <Link to="/login">
            <Button size="lg" variant="secondary" className="gap-2">
              Get Started Today
              <ArrowRight size={18} />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <Logo size="sm" />
            <p className="text-sm text-muted-foreground">
              © 2024 WorkFlow PNG. Built for KAIAWORKS Civil Engineering Contractors.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

import {
  ArrowRight,
  Boxes,
  Code,
  Terminal,
  Trophy,
  Users,
  Zap,
} from "lucide-react";

export function FeaturesSection() {
  const features = [
    {
      icon: Terminal,
      title: "CLI-Based Learning",
      description:
        "Practice on your local machine with our custom CLI tool. Real Kubernetes, real experience.",
      color: "bg-primary",
    },
    {
      icon: Boxes,
      title: "Progressive Challenges",
      description:
        "Start with pods and services, advance to deployments, StatefulSets, and complex architectures.",
      color: "bg-accent",
    },
    {
      icon: Trophy,
      title: "Track Your Progress",
      description:
        "Complete challenges, earn achievements, and see your Kubernetes skills grow over time.",
      color: "bg-secondary",
    },
    {
      icon: Users,
      title: "Community Driven",
      description:
        "Challenges are open source on GitHub. Contribute, suggest improvements, or create your own.",
      color: "bg-primary",
    },
    {
      icon: Code,
      title: "Real-World Scenarios",
      description:
        "Learn by solving actual problems you'll face in production Kubernetes environments.",
      color: "bg-accent",
    },
    {
      icon: Zap,
      title: "Instant Feedback",
      description:
        "Get immediate validation on your solutions. Learn from mistakes and iterate quickly.",
      color: "bg-secondary",
    },
  ];

  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-black text-balance">
            Learn by doing, not just reading
          </h2>
          <p className="text-xl font-medium max-w-2xl mx-auto">
            Kubeasy provides hands-on experience with Kubernetes concepts
            through interactive challenges.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group p-6 rounded-lg bg-card neo-border neo-shadow hover:neo-shadow-lg transition-all"
              >
                <div
                  className={`mb-4 inline-flex p-3 rounded-lg ${feature.color} text-white neo-border`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-black mb-2 text-foreground">
                  {feature.title}
                </h3>
                <p className="text-foreground font-medium leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <a
            href="/challenges"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-md font-black text-lg neo-border neo-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
          >
            Browse All Challenges
            <ArrowRight className="h-5 w-5" />
          </a>
        </div>
      </div>
    </section>
  );
}

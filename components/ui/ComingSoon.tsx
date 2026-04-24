import { Construction } from "lucide-react";

interface Props {
  title: string;
  description?: string;
}

export default function ComingSoon({ title, description }: Props) {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4 animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-navy-900/10 to-navy-700/10 border border-border flex items-center justify-center mb-4">
        <Construction size={28} className="text-gold" />
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-2">{title}</h1>
      <p className="text-muted-foreground text-sm max-w-sm">
        {description ?? "This module is under active development and will be available in a future release."}
      </p>
      <div className="mt-6 flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/20">
        <div className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
        <span className="text-xs text-gold font-medium">Coming soon</span>
      </div>
    </div>
  );
}

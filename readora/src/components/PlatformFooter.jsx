import { BookOpen } from "lucide-react";

const PlatformFooter = () => {
  return (
    <footer 
      className="mt-16 mb-12 py-12 px-6 text-center rounded-[32px] relative overflow-hidden"
      style={{ 
        background: "var(--surface)", 
        border: "1px solid var(--border)",
      }}
    >
      {/* Subtle glass effect element */}
      <div 
        className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-(--primary) to-transparent opacity-20"
      />
      
      <div className="flex flex-col items-center gap-4 relative z-10">
        <div 
          className="p-2.5 rounded-2xl shadow-lg"
          style={{ background: "var(--primary)", color: "var(--background)" }}
        >
          <BookOpen size={24} />
        </div>
        
        <div>
          <h3 
            className="text-xl font-extrabold tracking-tight"
            style={{ fontFamily: "var(--font-lora)", color: "var(--text-primary)" }}
          >
            Readora
          </h3>
          <p 
            className="text-xs font-medium uppercase tracking-[0.2em] mt-1 opacity-60"
            style={{ color: "var(--text-muted)" }}
          >
            Reading Sanctuary
          </p>
        </div>
        
        <div 
          className="h-px w-16 bg-linear-to-r from-transparent via-(--border) to-transparent" 
        />
        
        <p 
          className="text-xs max-w-[280px] leading-relaxed mx-auto italic font-medium"
          style={{ color: "var(--text-secondary)" }}
        >
          Discover stories that move you and organize your literary journey in a space designed for deep focus.
        </p>
        
        <div className="pt-8 border-t border-(--border) flex flex-col md:flex-row justify-between items-center gap-4 w-full opacity-40">
           <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
            © {new Date().getFullYear()} Readora Platform. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default PlatformFooter;

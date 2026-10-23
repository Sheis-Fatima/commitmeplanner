import { motion } from "framer-motion";
import { Target } from "lucide-react";

const SplashScreen = () => (
  <div className="min-h-screen bg-background text-foreground grid place-items-center overflow-hidden">
    <div className="absolute inset-0">
      <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />
    </div>
    <motion.div initial={{ opacity: 0, scale: .9 }} animate={{ opacity: 1, scale: 1 }} className="relative flex flex-col items-center">
      <motion.div animate={{ boxShadow: ["0 0 0 rgba(74,222,128,0)", "0 0 45px rgba(74,222,128,.16)", "0 0 0 rgba(74,222,128,0)"] }} transition={{ duration: 1.8, repeat: Infinity }} className="grid h-16 w-16 place-items-center rounded-2xl bg-primary text-primary-foreground">
        <Target size={28} strokeWidth={2.4} />
      </motion.div>
      <p className="mt-5 font-display text-2xl font-semibold tracking-tight">commit<span className="text-primary">me</span></p>
      <p className="mt-2 text-xs text-muted-foreground">Making room for what matters.</p>
      <div className="mt-6 flex items-center gap-1.5">{[0,1,2].map((i) => <motion.span key={i} animate={{ y: [0, -4, 0], opacity: [.35, 1, .35] }} transition={{ duration: .9, repeat: Infinity, delay: i * .13 }} className="h-1.5 w-1.5 rounded-full bg-primary" />)}</div>
    </motion.div>
  </div>
);

export default SplashScreen;

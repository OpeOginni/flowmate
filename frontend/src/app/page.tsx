import MainPageInput from "@/components/MainPageInput";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center">
      <main className="container flex flex-col items-center justify-center px-4 text-center">
        <div className="space-y-6 mb-8 flex flex-row">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
            say hey to your <span className="text-6xl md:text-7xl lg:text-8xl font-extrabold text-primary">Flow Mate</span>
          </h1>
        </div>

        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed">
          Automate your Flow blockchain actions with ease. Schedule transactions, 
          manage DeFi activities, and take control of your crypto workflow.
        </p>

        <MainPageInput
        />
      </main>
    </div>
  );
}

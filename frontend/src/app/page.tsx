import ConnectWallet from "@/components/ConnectWallet";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">

      <main>
        <h1 className="text-4xl font-bold">Flow Mate</h1>

        <div className="flex flex-col items-center justify-center">
          <ConnectWallet />
        </div>
      </main>
    </div>
  );
}

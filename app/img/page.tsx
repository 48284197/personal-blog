import FiveGridGenerator from "@/components/FiveGridGenerator";

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-100 p-10">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-8 text-3xl font-bold">
          小红书五图拼图生成器
        </h1>

        <FiveGridGenerator />
      </div>
    </main>
  );
}
import Image from '@/components/app-image';

export default function HeroSection() {
  return (
    <main className="bg-[#FAF7F2] min-h-screen">
      {/* Hero */}
      <section className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 px-8 py-20 items-center">
        {/* Left Content */}
        <div>
          <h1 className="text-6xl font-extrabold leading-tight text-[#2B160B]">
            和有趣的人 <br /> 分享萌宠生活
          </h1>
          <p className="mt-6 text-2xl text-gray-600">
            毛球，温暖有爱的宠物社区
          </p>

          <div className="flex gap-5 mt-10">
            <button className="bg-yellow-400 hover:bg-yellow-300 px-10 py-4 rounded-full text-xl font-semibold">
              立即加入
            </button>
            <button className="border border-gray-300 px-10 py-4 rounded-full text-xl">
              了解毛球
            </button>
          </div>

          {/* Stats */}
          <div className="flex gap-12 mt-14 text-[#2B160B]">
            <div>
              <h3 className="text-3xl font-bold">50万+</h3>
              <p className="text-gray-500">宠物用户</p>
            </div>
            <div>
              <h3 className="text-3xl font-bold">200万+</h3>
              <p className="text-gray-500">萌宠分享</p>
            </div>
            <div>
              <h3 className="text-3xl font-bold">1000万+</h3>
              <p className="text-gray-500">互动点赞</p>
            </div>
          </div>
        </div>

        {/* Right Image */}
        <div className="relative flex justify-center">
          <div className="relative w-full max-w-xl h-[520px]">
            <Image
              src="https://xuxiweii.s3.bitiful.net/uploads/1777434188799-h1cj144us1k-UI.png"
              alt="宠物主图"
              fill
              className="object-contain"
              unoptimized
            />
          </div>

          {/* Floating Card */}
          <div className="absolute bottom-10 left-10 bg-white rounded-full shadow-xl px-8 py-5 flex items-center gap-4">
            <div className="flex -space-x-3">
              <div className="w-10 h-10 bg-yellow-300 rounded-full border-2 border-white"></div>
              <div className="w-10 h-10 bg-orange-300 rounded-full border-2 border-white"></div>
              <div className="w-10 h-10 bg-gray-300 rounded-full border-2 border-white"></div>
            </div>
            <p className="text-lg">
              已有 <span className="text-yellow-500 font-bold">500,000+</span> 毛孩子在这里
            </p>
          </div>
        </div>
      </section>

      {/* Discover Section */}
      <section className="max-w-7xl mx-auto px-8 pb-20">
        <div className="bg-white rounded-[40px] p-10 shadow-sm">
          <h2 className="text-4xl font-bold text-[#2B160B] mb-3">发现更多精彩</h2>
          <p className="text-gray-500 mb-8">探索萌宠世界的无限乐趣</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "带柯基去公园玩耍的一天", img: "/pet1.jpg" },
              { title: "猫咪的迷惑行为大赏", img: "/pet2.jpg" },
              { title: "春天与你和毛孩子更配哦", img: "/pet3.jpg" },
              { title: "兔兔的可爱瞬间", img: "/pet4.jpg" },
            ].map((pet, index) => (
              <div
                key={index}
                className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition"
              >
                <div className="relative h-60 w-full">
                  <Image
                    src={pet.img}
                    alt={pet.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-lg text-[#2B160B]">
                    {pet.title}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}


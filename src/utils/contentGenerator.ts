const instagramCaptions = [
  "Obsessed with these Lululemon Align leggings! 😍 Perfect for yoga and running errands. The fabric is buttery soft and they never slide down. Link in bio! #activewear #lululemon #leggings",
  "Amazon fall haul is LIVE! 🍂 Found this cozy oversized sweater for under $40 and it comes in 12 colors! You NEED this in your wardrobe. Link in stories! #amazonfinds #fallfashion #sweaterweather",
  "My top 5 beauty must-haves this month 💄 Swipe to see them all! From skincare to makeup, these products have been on repeat. Everything linked in my stories. #beautyfavorites #skincare #makeup",
  "Walmart home decor that looks expensive but ISN'T 🏡 Under $50 for everything! This accent chair is only $89 and looks SO good in my living room. #walmartfinds #homedecor #budgetfriendly",
  "Get ready with me using my favorite products! ✨ Starting with this amazing primer and finishing with the best setting spray. All linked below. #grwm #beautyhaul #makeup",
  "Found the PERFECT workout set at Target! 💪 The quality is insane for the price and it's actually squat-proof. Comes in 8 colors! #targetstyle #activewear #workoutclothes",
  "My Amazon storefront is updated with all my current favorites! 🛍️ Home, fashion, beauty - it's all there. The link is in my bio! #amazonfinds #amazonfashion #shoppinghaul",
  "This Stanley cup keeps my water ice cold for 24 hours! ❄️ Life changing honestly. It fits in my car cup holder perfectly. #stanley #stanleycup #hydration",
  "Styling this $30 Amazon dress 3 ways! 👗 From casual to dressy, this dress does it all. Available in petite, regular, and plus sizes! #amazonfashion #dresshaul #styling",
  "My skincare routine that cleared my acne! ✨ These products transformed my skin in just 30 days. Links to everything in bio. #skincare #acne #skincareroutine",
  "Best purchases from this month! 💯 Everything I'm sharing has been thoroughly tested and loved. Swipe for honest reviews! #monthlyhaul #favorites #shopping",
  "Kitchen gadgets from Amazon that I actually use! 🍳 No gimmicks, just things that make cooking easier. Under $30 each! #kitchengadgets #amazonfin kitchen",
  "LTK sale alert! 🚨 So many of my favorites are on sale right now. Grab them before they sell out! Link in bio. #ltkfinds #salealert #shopping",
  "This jumpsuit is EVERYTHING! 😍 Comfortable, flattering, and only $45. Wearing size small and it fits perfectly. #jumpsuit #fashion #ootd",
  "Amazon beauty dupes that actually work! 💅 Saving you hundreds of dollars with these finds. The quality is insane! #beautydupes #amazonfins #makeup",
  "My nighttime skincare routine for glowing skin! 🌙 Step by step breakdown of what I use. Products linked in stories! #nighttimeroutine #skincare #glowingskin",
  "Home office setup on a budget! 💻 Everything from Amazon and Walmart under $200 total. Swipe for links! #homeoffice #wfh #desksetup",
  "The coziest loungewear for fall! 🍂 Living in this set from Amazon. So soft and comes in tons of colors. #loungewear #cozy #fallvibes",
  "Trying viral TikTok products! ✨ Here's what's actually worth the hype. Some were hits, some were misses! #tiktokmademebuyit #viral #productreview",
  "My morning coffee routine ☕ Using my favorite espresso machine and these amazing mugs. Everything linked! #coffee #morningroutine #espresso",
  "Affordable designer dupes! 👜 Get the look for less with these amazing finds. The quality will shock you! #designerdupes #fashion #handbags",
  "Winter coat try-on haul! 🧥 Found the warmest, most stylish coats under $100. Perfect for cold weather! #wintercoat #fashion #haul",
  "My fitness must-haves! 💪 From resistance bands to yoga mats, these are game changers. Links in bio! #fitness #workout #fitnessmotivation",
  "Organizing my closet with Amazon finds! 👔 These storage solutions changed everything. Swipe to see the before and after! #closetorganization #organization #amazon",
  "Best self-care products for busy moms! 🛀 Taking time for yourself is so important. These products make it easy! #selfcare #momlife #wellness",
  "My favorite clean beauty products! 🌿 Non-toxic, effective, and affordable. Your skin will thank you! #cleanbeauty #nontoxic #skincare",
  "Walmart fashion that looks designer! 👗 You won't believe these prices. Everything under $40! #walmartfashion #budgetstyle #ootd",
  "Travel essentials I never fly without! ✈️ These items make traveling so much easier. Links to everything! #travelessentials #travel #packing",
  "My productivity setup! 📝 From planners to tech, these items keep me organized and on track. #productivity #organization #workspace",
  "Neutral home decor finds! 🤎 Creating a calm, beautiful space on a budget. Everything is linked! #homedecor #neutraldecor #homedesign"
];

const postTypes = ['POST', 'REEL', 'STORY'] as const;
const platforms = ['INSTAGRAM'] as const;

export interface MockPost {
  platform: typeof platforms[number];
  postType: typeof postTypes[number];
  postedAt: string;
  caption: string;
  thumbnailUrl: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  engagementRate: number;
}

const getRandomElement = <T,>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

const getRandomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const getRandomDate = (daysAgo: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
  date.setHours(getRandomInt(6, 22), getRandomInt(0, 59), 0, 0);
  return date;
};

const generateThumbnailGradient = (index: number): string => {
  const gradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    'linear-gradient(135deg, #ff6e7f 0%, #bfe9ff 100%)',
  ];
  return gradients[index % gradients.length];
};

export const generateMockPosts = (count: number = 28): MockPost[] => {
  const posts: MockPost[] = [];

  for (let i = 0; i < count; i++) {
    const postType = getRandomElement<typeof postTypes[number]>(
      postTypes.map((type, idx) => {
        if (type === 'REEL') return Array(5).fill(type);
        if (type === 'POST') return Array(4).fill(type);
        return Array(1).fill(type);
      }).flat() as typeof postTypes[number][]
    );

    const views = getRandomInt(15000, 250000);
    const likeRate = Math.random() * (0.15 - 0.05) + 0.05;
    const likes = Math.floor(views * likeRate);
    const commentRate = Math.random() * (0.15 - 0.05) + 0.05;
    const comments = Math.floor(likes * commentRate);
    const shareRate = Math.random() * (0.8 - 0.3) + 0.3;
    const shares = Math.floor(comments * shareRate);
    const saveRate = Math.random() * (0.35 - 0.15) + 0.15;
    const saves = Math.floor(likes * saveRate);
    const engagementRate = ((likes + comments + saves) / views) * 100;

    posts.push({
      platform: 'INSTAGRAM',
      postType,
      postedAt: getRandomDate(90).toISOString(),
      caption: getRandomElement(instagramCaptions),
      thumbnailUrl: generateThumbnailGradient(i),
      views,
      likes,
      comments,
      shares,
      saves,
      engagementRate: parseFloat(engagementRate.toFixed(2)),
    });
  }

  return posts.sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());
};

export const extractProductMentions = (caption: string): string[] => {
  const products: string[] = [];
  const productKeywords = [
    'Lululemon',
    'Stanley',
    'Amazon',
    'Walmart',
    'Target',
    'leggings',
    'sweater',
    'dress',
    'jumpsuit',
    'coat',
    'primer',
    'setting spray',
    'espresso machine',
    'yoga mat',
    'resistance bands',
  ];

  productKeywords.forEach((keyword) => {
    if (caption.toLowerCase().includes(keyword.toLowerCase())) {
      products.push(keyword);
    }
  });

  return products;
};

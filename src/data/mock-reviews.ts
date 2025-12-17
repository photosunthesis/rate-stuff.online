export type Review = {
  id: string
  userId: string
  userDisplayName: string
  stuffName: string
  rating: number
  title: string
  content: string
  tags: string[]
  images?: string[]
  avatarUrl?: string
  createdAt: Date
}



export const mockReviews: Review[] = [
  {
    id: '1',
    userId: 'user1',
    userDisplayName: 'Alex Chen',
    stuffName: 'AirPods Pro',
    rating: 9.2,
    title: 'Best wireless earbuds I\'ve owned',
    avatarUrl: 'https://mockmind-api.uifaces.co/content/human/178.jpg',
    content:
      'The noise cancellation is incredible and the sound quality is pristine. Battery life gets me through a full day easily. The only downside is the price, but they\'re worth every penny.\n\nI\'ve been using these for almost a year now and I can confidently say they\'ve transformed the way I experience audio. The seamless integration with my Apple devices is fantastic - switching between my MacBook, iPad, and iPhone is instantaneous.\n\nThe sound profile is incredibly balanced, with crisp highs, warm mids, and punchy lows that make both music and podcasts enjoyable. The noise cancellation is one of the best I\'ve experienced, effectively blocking out ambient noise without being too aggressive.\n\nThe transparency mode is also well-implemented for when I need to hear my surroundings. Battery life is solid too - I get about 4-5 hours of continuous playback with ANC enabled, and the charging case provides multiple additional charges.',
    tags: ['electronics', 'audio', 'apple'],
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=320&fit=crop', 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400&h=320&fit=crop'],
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
  },
  {
    id: '2',
    userId: 'user2',
    userDisplayName: 'Jordan Lee',
    stuffName: 'The Midnight Library',
    rating: 8.3,
    avatarUrl: 'https://mockmind-api.uifaces.co/content/human/169.jpg',
    title: 'Thought-provoking and uplifting',
    content:
      'A captivating novel that explores parallel lives and second chances. The premise is unique and the characters feel real. Definitely a must-read for anyone who enjoys philosophical fiction.\n\nThis book has genuinely changed the way I think about choices and regrets. Matt Haig masterfully weaves together the story of Nora\'s alternate lives with profound philosophical questions about happiness, meaning, and what it means to truly live.\n\nWhat struck me most was how relatable the themes are - the idea that we\'re all just trying to do our best with the choices we\'ve made is both comforting and motivating. The writing is accessible yet poetic, making it easy to get lost in the pages.\n\nThe characters feel genuine and their struggles resonate deeply. I found myself reflecting on my own life choices throughout the reading experience. The ending left me feeling hopeful and inspired, reminding me that it\'s never too late to embrace the life you want.\n\nI\'ve already recommended it to several friends and I\'m sure I\'ll revisit this book multiple times.',
    tags: ['books', 'fiction', 'philosophy'],
    images: ['https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=1470&auto=format&fit=crop'],
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
  },
  {
    id: '3',
    userId: 'user3',
    userDisplayName: 'Sam Rodriguez',
    stuffName: 'Pasta Carbonara at Mario\'s',
    rating: 7.1,
    title: 'Authentic but a bit pricey',
    content:
      'The carbonara is made the traditional way with real guanciale and Pecorino Romano. Great atmosphere and service, though portions could be bigger for the price.',
    tags: ['food', 'italian', 'restaurant'],
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
  {
    id: '4',
    userId: 'user4',
    userDisplayName: 'Morgan Swift',
    stuffName: 'VS Code',
    rating: 9.8,
    avatarUrl: 'https://mockmind-api.uifaces.co/content/human/181.jpg',
    title: 'The best code editor out there',
    content:
      'Endless customization, amazing extensions, and great performance. IntelliSense is phenomenal and the integrated terminal is super useful. I can\'t imagine coding without it now.',
    tags: ['software', 'development', 'tools'],
    createdAt: new Date(Date.now() - 36 * 60 * 60 * 1000),
  },
  {
    id: '5',
    userId: 'user5',
    userDisplayName: 'Casey Park',
    stuffName: 'Nike Air Max 90',
    rating: 6.5,
    title: 'Comfortable but showing wear quickly',
    content:
      'Really comfy for everyday wear and the design is timeless. However, the sole started showing signs of wear after just 3 months. Good shoes but not great value for money.',
    tags: ['fashion', 'shoes', 'nike'],
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
  },
  {
    id: '6',
    userId: 'user6',
    userDisplayName: 'Riley Taylor',
    stuffName: 'Elden Ring',
    avatarUrl: 'https://mockmind-api.uifaces.co/content/human/136.jpg',
    rating: 9.1,
    title: 'Masterpiece of game design',
    content:
      'Open world souls-like done perfectly. The exploration is rewarding, boss fights are epic, and the atmosphere is unmatched. Some performance issues on launch but nothing that detracts from the experience.',
    tags: ['gaming', 'video-games', 'souls-like'],
    createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000),
  },
  {
    id: '7',
    userId: 'user7',
    userDisplayName: 'Avery Kim',
    stuffName: 'Espresso Machine',
    rating: 4.2,
    title: 'Way too complicated for beginners',
    content:
      'Beautiful machine but the learning curve is steep. Requires lots of practice to dial in shots properly. Would not recommend for casual coffee drinkers.',
    tags: ['coffee', 'kitchen', 'gadgets'],
    createdAt: new Date(Date.now() - 96 * 60 * 60 * 1000),
  },
  {
    id: '14',
    userId: 'user14',
    userDisplayName: 'Taylor Green',
    stuffName: 'Blender 3D',
    rating: 8.7,
    avatarUrl: 'https://mockmind-api.uifaces.co/content/human/127.jpg',
    title: 'Incredible 3D creation suite, steep learning curve',
    content:
      'Blender is an absolutely phenomenal piece of software. As someone who has worked with various 3D modeling and animation tools, I can confidently say that Blender is punching way above its weight for a free tool. The modeling tools are comprehensive and intuitive once you get past the initial learning curve. The rendering engines, especially Cycles, produce absolutely stunning results that rival paid software. The sculpting tools are fantastic for organic modeling, the UV unwrapping is smooth and efficient, and the animation suite is robust. I\'ve used it for character animation, product visualization, architectural renders, and motion graphics - it excels at all of them. The community is incredibly supportive and there are thousands of tutorials available online. My main critique is that the learning curve is quite steep, and the UI can feel overwhelming for beginners. The shortcut-heavy workflow takes time to master. However, once you invest the time to learn Blender properly, you\'ll find it\'s not just free, but it\'s potentially more powerful than many commercial alternatives. The regular updates and constant improvements from the Blender team are commendable. If you\'re considering learning 3D, Blender is an obvious choice - there\'s no better way to get started without spending thousands of dollars.',
    tags: ['3d', 'software', 'animation', 'design'],
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
  },
  {
    id: '9',
    userId: 'user9',
    userDisplayName: 'Quinn Davis',
    stuffName: 'Dyson Hair Dryer',
    rating: 5.4,
    title: 'Effective but questionable value',
    content:
      'Does dry hair quickly and reduces frizz. The tech is impressive, but I\'m not sure it\'s worth $400 when a $50 dryer does essentially the same job.',
    tags: ['beauty', 'hair', 'electronics'],
    createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
  },
  {
    id: '10',
    userId: 'user10',
    userDisplayName: 'Blake Johnson',
    stuffName: 'TanStack Router',
    rating: 9.3,
    title: 'Modern routing for React',
    content:
      'Amazing type-safe routing library for React. The DevTools are super helpful, and the API is intuitive once you get the hang of it. Essential for any modern React project.',
    tags: ['web-dev', 'react', 'typescript'],
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
  },
  {
    id: '11',
    userId: 'user11',
    userDisplayName: 'Phoenix Stone',
    stuffName: 'Sushi at Koi Garden',
    rating: 8.6,
    title: 'Fresh and beautifully presented',
    content:
      'High quality ingredients and skilled preparation. The presentation is artistic and the flavors are authentic. A bit on the pricey side but definitely worth the splurge for a special occasion.',
    tags: ['food', 'sushi', 'restaurant'],
    createdAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000),
  },
  {
    id: '13',
    userId: 'user13',
    userDisplayName: 'Casey Morgan',
    stuffName: 'Notion',
    rating: 9.5,
    avatarUrl: 'https://mockmind-api.uifaces.co/content/human/94.jpg',
    title: 'The ultimate productivity and organization tool',
    content:
      'Notion has completely revolutionized how I organize my life, work, and projects. I came to this app skeptical after trying dozens of productivity tools, but the flexibility and power of Notion is genuinely unmatched. Whether I\'m managing my personal finances, organizing my career development goals, planning vacations, or collaborating with my team on complex projects, Notion adapts perfectly to my needs. The database functionality is incredibly powerful - I can create custom views, link related information, and automate workflows with formulas. The template gallery has saved me countless hours of setup time. The UI might seem intimidating at first, but once you understand the fundamentals, you\'ll realize how thoughtfully designed it is. The community support is amazing too - there are thousands of templates and guides available. My only minor complaint is that the mobile app could use some performance improvements, but the web version is lightning fast. For the price, Notion is an absolute steal. I\'ve replaced about five different subscription services with Notion, so I\'m actually saving money while having a more unified and organized system.',
    tags: ['productivity', 'apps', 'tools', 'organization'],
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
  }
]

export function getRatingEmoji(rating: number): string {
  const roundedRating = Math.round(rating)
  
  if (roundedRating >= 10) return '🤩'
  if (roundedRating >= 9) return '😍'
  if (roundedRating >= 8) return '😄'
  if (roundedRating >= 7) return '😊'
  if (roundedRating >= 6) return '🙂'
  if (roundedRating >= 5) return '😑'
  if (roundedRating >= 4) return '😐'
  if (roundedRating >= 3) return '😕'
  if (roundedRating >= 2) return '😞'
  return '😭'
}

export function getTimeAgo(date: Date): string {
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`
  const weeks = Math.floor(days / 7)
  if (weeks < 4) return `${weeks}w`
  
  // If different year, show month and year
  if (date.getFullYear() !== now.getFullYear()) {
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }
  
  return date.toLocaleDateString()
}

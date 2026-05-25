
import React, { useState } from 'react';
import { 
  Trophy, 
  Gamepad2, 
  Brain, 
  Star, 
  ChevronRight, 
  CheckCircle2, 
  XCircle, 
  Timer, 
  Award,
  Zap,
  Target,
  TrendingUp,
  ShieldCheck,
  Users,
  Dice5,
  Play,
  Video,
  Music,
  BookOpen,
  Headphones,
  FileText as FileIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Info } from 'lucide-react';
import SnakeAndLadderGame from './SnakeAndLadderGame';

interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface QuizLevel {
  id: string;
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  questions: Question[];
}

interface GameState {
  year: number;
  balance: number;
  invested: number;
  history: { year: number; balance: number; return: number }[];
  currentEvent: { title: string; effect: number; description: string } | null;
  marketMood: 'Bull' | 'Bear' | 'Volatile' | 'Stagnant';
  isGameOver: boolean;
}

interface BudgetHeroState {
  month: number;
  savings: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  history: { month: number; savings: number; event: string }[];
  currentEvent: { title: string; cost: number; description: string } | null;
  isGameOver: boolean;
}

interface LearningResource {
  id: string;
  title: string;
  type: 'video' | 'audio' | 'article';
  duration: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  category: string;
  content?: {
    description: string;
    url?: string;
    transcript?: string;
    body?: string;
  };
}

const ACADEMY_RESOURCES: LearningResource[] = [
  {
    id: 'v1',
    title: 'The 50/30/20 Rule: Mastering Your Budget',
    type: 'video',
    duration: '5:24',
    level: 'Beginner',
    category: 'Budgeting',
    content: {
      url: 'https://www.youtube.com/embed/3mJ9R7W8Ksc',
      description: 'Learn the foundational rule of personal finance that helps you balance your needs, wants, and savings goals effectively.',
      transcript: 'Budgeting is not about restriction; it is about freedom. The 50/30/20 rule provides a simple framework...'
    }
  },
  {
    id: 'v2',
    title: 'Power of Compounding: How ₹10k becomes ₹1 Crore',
    type: 'video',
    duration: '8:45',
    level: 'Beginner',
    category: 'Investing',
    content: {
      url: 'https://www.youtube.com/embed/fD3I-S59PPA',
      description: 'Visualize the exponential growth of your wealth over time and understand why starting early is your greatest advantage.',
      transcript: 'Einstein called it the eighth wonder of the world. Compound interest is the process where...'
    }
  },
  {
    id: 'v3',
    title: 'Advanced Tax Loss Harvesting in India',
    type: 'video',
    duration: '12:15',
    level: 'Advanced',
    category: 'Taxation',
    content: {
      url: 'https://www.youtube.com/embed/8v6L9l88_P0',
      description: 'A deep dive into offsetting capital gains with losses to maximize your post-tax returns under Indian Income Tax laws.',
      transcript: 'Tax loss harvesting is a strategy frequently used by HNIs to optimize their portfolios...'
    }
  },
  {
    id: 'v4',
    title: 'Retirement Planning 101: Starting Early',
    type: 'video',
    duration: '10:30',
    level: 'Beginner',
    category: 'Retirement',
    content: {
      url: 'https://www.youtube.com/embed/uGv_OQ4S_0A',
      description: 'Understand the basics of retirement planning and why the "Time Value of Money" is your best friend.',
      transcript: 'Retirement is not an age, it is a financial status...'
    }
  },
  {
    id: 'v5',
    title: 'Estate Planning & Succession Law',
    type: 'video',
    duration: '15:45',
    level: 'Intermediate',
    category: 'Legal',
    content: {
      url: 'https://www.youtube.com/embed/8v6L9l88_P0',
      description: 'Navigating the complexities of inheritance, wills, and trusts in the Indian context.',
      transcript: 'Planning for after you are gone is one of the kindest things you can do for your family...'
    }
  },
  {
    id: 'a1',
    title: 'Market Cycles & Emotional Intelligence',
    type: 'audio',
    duration: '15:00',
    level: 'Intermediate',
    category: 'Psychology',
    content: {
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      description: 'Listen to top wealth managers discuss how to stay rational when the markets are volatile.',
      transcript: 'Welcome to the Wealth Insights podcast. Today we discuss the psychological aspect of investing...'
    }
  },
  {
    id: 'a2',
    title: 'The Future of Indian Fintech',
    type: 'audio',
    duration: '22:30',
    level: 'Advanced',
    category: 'Trends',
    content: {
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
      description: 'Exploring how UPI, ONDC, and Account Aggregators are changing the landscape of wealth management in India.',
      transcript: 'In this episode, we interview the founders of some of India\'s largest fintech firms...'
    }
  },
  {
    id: 'a3',
    title: 'Psychology of Money: A Deep Dive',
    type: 'audio',
    duration: '18:45',
    level: 'Beginner',
    category: 'Psychology',
    content: {
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
      description: 'Understanding our biases and how they affect our financial decision making.',
      transcript: 'Your relationship with money is rarely about math, it is about history and ego...'
    }
  },
  {
    id: 'ar1',
    title: 'Emergency Funds: The Ultimate Guide',
    type: 'article',
    duration: '6 min read',
    level: 'Beginner',
    category: 'Protection',
    content: {
      description: 'Everything you need to know about building a safety net that protects your family from financial shocks.',
      body: `### Why You Need an Emergency Fund
An emergency fund is a stash of money set aside to cover the financial surprises life throws your way. These events can be stressful and costly.

### How Much Should You Save?
Most financial advisors recommend saving three to six months' worth of living expenses. However, this depends on your career stability and family size.

### Where to Keep the Money?
Accessibility is key. A high-yield savings account or a liquid mutual fund is ideal.
`
    }
  },
  {
    id: 'ar2',
    title: 'Understanding Estate Planning & Wills',
    type: 'article',
    duration: '10 min read',
    level: 'Intermediate',
    category: 'Estate Planning',
    content: {
      description: 'Why creating a will is crucial for every Indian family, regardless of their current net worth.',
      body: `### The Legal Framework in India
In India, succession is governed by personal laws based on religion or the Indian Succession Act, 1925.

### What Happens Without a Will?
If you die 'intestate', your assets are distributed according to the law of the land, which might not align with your wishes.

### Key Elements of a Valid Will
1. Testator details
2. List of assets
3. Appointment of executor
4. Signatures of two witnesses
`
    }
  },
  {
    id: 'ar3',
    title: 'Asset Allocation Strategies for 2024',
    type: 'article',
    duration: '12 min read',
    level: 'Advanced',
    category: 'Investing',
    content: {
      description: 'Analyzing the shifting global economy and how to rebalance your portfolio for the coming decade.',
      body: `### The New Normal
With inflation cooling and interest rates stabilizing, the 60/40 portfolio is making a comeback.

### Alternative Assets
Real estate, gold, and private equity should now form 10-15% of an advanced portfolio.

### Rebalancing Frequency
We recommend a quarterly review but only act if allocations drift by more than 5%.
`
    }
  }
];

const QUIZ_LEVELS: QuizLevel[] = [
  {
    id: 'beginner',
    title: 'Foundations of Wealth',
    description: 'Master the basics of budgeting, saving, and simple interest.',
    difficulty: 'Beginner',
    questions: [
      {
        id: 'b1',
        text: 'What is the "50/30/20 Rule" in personal finance?',
        options: [
          '50% Savings, 30% Needs, 20% Wants',
          '50% Needs, 30% Wants, 20% Savings',
          '50% Investment, 30% Savings, 20% Spending',
          '50% Debt, 30% Needs, 20% Wants'
        ],
        correctAnswer: 1,
        explanation: 'The 50/30/20 rule suggests allocating 50% of income to needs, 30% to wants, and 20% to savings or debt repayment.'
      },
      {
        id: 'b2',
        text: 'What is an "Emergency Fund"?',
        options: [
          'Money saved for a luxury vacation',
          'A fund for buying stocks during a market crash',
          '3-6 months of living expenses saved for unexpected events',
          'A credit card used only for emergencies'
        ],
        correctAnswer: 2,
        explanation: 'An emergency fund is a safety net of 3-6 months of expenses to cover unexpected costs like medical bills or job loss.'
      },
      {
        id: 'b3',
        text: 'Which of these is a "Liability"?',
        options: [
          'A rental property',
          'A car loan',
          'A fixed deposit',
          'Gold jewelry'
        ],
        correctAnswer: 1,
        explanation: 'A liability is something that takes money out of your pocket, like a loan. Assets put money into your pocket.'
      }
    ]
  },
  {
    id: 'intermediate',
    title: 'Investment Architect',
    description: 'Learn about asset allocation, mutual funds, and risk management.',
    difficulty: 'Intermediate',
    questions: [
      {
        id: 'i1',
        text: 'What is "Asset Allocation"?',
        options: [
          'Picking the best single stock to buy',
          'Dividing an investment portfolio among different asset categories',
          'Selling all assets during a market downturn',
          'Buying only government bonds'
        ],
        correctAnswer: 1,
        explanation: 'Asset allocation is the strategy of balancing risk and reward by apportioning a portfolio\'s assets according to an individual\'s goals, risk tolerance, and investment horizon.'
      },
      {
        id: 'i2',
        text: 'What does "Rupee Cost Averaging" mean in a SIP?',
        options: [
          'Buying more units when prices are low and fewer when prices are high',
          'Always buying the same number of units every month',
          'Waiting for the market to bottom before investing',
          'Investing only when the rupee is strong'
        ],
        correctAnswer: 0,
        explanation: 'SIPs allow you to buy more units when the NAV is low and fewer when it is high, averaging out your cost over time.'
      }
    ]
  },
  {
    id: 'advanced',
    title: 'Legacy Strategist',
    description: 'Complex tax strategies, estate planning, and alternative investments.',
    difficulty: 'Advanced',
    questions: [
      {
        id: 'a1',
        text: 'What is the primary benefit of a "HUF" (Hindu Undivided Family) in Indian taxation?',
        options: [
          'It provides free insurance to all members',
          'It is treated as a separate tax entity, allowing for additional tax slabs and deductions',
          'It guarantees a 10% return on all investments',
          'It exempts the family from all capital gains taxes'
        ],
        correctAnswer: 1,
        explanation: 'A HUF is treated as a separate person for tax purposes, meaning it has its own basic exemption limit and deductions under Section 80C.'
      }
    ]
  }
];

const FinanceIntelligence: React.FC = () => {
  const [activeView, setActiveView] = useState<'overview' | 'quiz' | 'games' | 'academy'>('overview');
  const [selectedLevel, setSelectedLevel] = useState<QuizLevel | null>(null);
  const [selectedResource, setSelectedResource] = useState<LearningResource | null>(null);
  const [academyLevel, setAcademyLevel] = useState<'All' | 'Beginner' | 'Intermediate' | 'Advanced'>('All');
  const [academyType, setAcademyType] = useState<'All' | 'video' | 'audio' | 'article'>('All');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const tabs = [
    { id: 'overview', label: 'Intelligence hub', icon: Brain },
    { id: 'academy', label: 'Wealth Academy', icon: BookOpen },
    { id: 'quiz', label: 'Certifications', icon: Trophy },
    { id: 'games', label: 'Simulations', icon: Gamepad2 },
  ];

  // Market Master Game State
  const [activeGame, setActiveGame] = useState<'market' | 'budget' | 'snake-ladder' | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    year: 1,
    balance: 100000,
    invested: 0,
    history: [{ year: 0, balance: 100000, return: 0 }],
    currentEvent: null,
    marketMood: 'Stagnant',
    isGameOver: false
  });

  // Budget Hero State
  const [budgetState, setBudgetState] = useState<BudgetHeroState>({
    month: 1,
    savings: 50000,
    monthlyIncome: 80000,
    monthlyExpenses: 50000,
    history: [{ month: 0, savings: 50000, event: 'Started' }],
    currentEvent: null,
    isGameOver: false
  });

  const startMarketMaster = () => {
    setGameState({
      year: 1,
      balance: 100000,
      invested: 0,
      history: [{ year: 0, balance: 100000, return: 0 }],
      currentEvent: null,
      marketMood: 'Stagnant',
      isGameOver: false
    });
    setActiveGame('market');
    setActiveView('games');
  };

  const startBudgetHero = () => {
    setBudgetState({
      month: 1,
      savings: 50000,
      monthlyIncome: 80000,
      monthlyExpenses: 50000,
      history: [{ month: 0, savings: 50000, event: 'Started' }],
      currentEvent: null,
      isGameOver: false
    });
    setActiveGame('budget');
    setActiveView('games');
  };

  const startSnakeLadder = () => {
    setActiveGame('snake-ladder');
    setActiveView('games');
  };

  const nextMonth = () => {
    if (budgetState.isGameOver) return;

    const events = [
      { title: 'Bonus!', cost: 20000, description: 'You received a performance bonus at work.' },
      { title: 'Car Repair', cost: -15000, description: 'Your car broke down and needs urgent repairs.' },
      { title: 'Medical Bill', cost: -8000, description: 'An unexpected visit to the dentist.' },
      { title: 'Tax Refund', cost: 12000, description: 'The government sent you a tax refund.' },
      { title: 'Friend\'s Wedding', cost: -10000, description: 'Gifts and travel for a close friend\'s wedding.' },
      { title: 'Home Maintenance', cost: -5000, description: 'A leaky pipe needed fixing.' },
      { title: 'Side Hustle', cost: 5000, description: 'You earned extra from a freelance project.' },
      { title: 'Appliance Failure', cost: -12000, description: 'The refrigerator stopped working.' }
    ];

    const randomEvent = Math.random() > 0.6 ? events[Math.floor(Math.random() * events.length)] : null;
    const eventCost = randomEvent ? randomEvent.cost : 0;
    
    const monthlySavings = budgetState.monthlyIncome - budgetState.monthlyExpenses;
    const newSavings = budgetState.savings + monthlySavings + eventCost;
    
    setBudgetState(prev => ({
      ...prev,
      month: prev.month + 1,
      savings: newSavings,
      currentEvent: randomEvent,
      history: [...prev.history, { month: prev.month, savings: newSavings, event: randomEvent?.title || 'Normal Month' }],
      isGameOver: prev.month >= 12 || newSavings < 0
    }));
  };

  const nextYear = (investAmount: number) => {
    if (gameState.isGameOver) return;

    const moods: GameState['marketMood'][] = ['Bull', 'Bear', 'Volatile', 'Stagnant'];
    const newMood = moods[Math.floor(Math.random() * moods.length)];
    
    const events = [
      { title: 'Tech Boom', effect: 0.25, description: 'Silicon Valley innovations drive markets to new highs.' },
      { title: 'Global Crisis', effect: -0.30, description: 'Supply chain disruptions cause a sharp market correction.' },
      { title: 'Interest Rate Cut', effect: 0.15, description: 'Central bank lowers rates, boosting equity markets.' },
      { title: 'Inflation Spike', effect: -0.10, description: 'Rising costs squeeze corporate margins.' },
      { title: 'Bull Run', effect: 0.20, description: 'Optimism prevails as corporate earnings beat expectations.' },
      { title: 'Bear Grip', effect: -0.20, description: 'Fear dominates as economic indicators weaken.' },
      { title: 'Stable Growth', effect: 0.08, description: 'A quiet year with steady economic progress.' },
      { title: 'Market Volatility', effect: 0.02, description: 'Prices swing wildly but end the year nearly flat.' }
    ];
    
    const randomEvent = events[Math.floor(Math.random() * events.length)];
    
    // Calculate return based on mood and event
    let baseReturn = 0;
    switch (newMood) {
      case 'Bull': baseReturn = Math.random() * 0.15 + 0.05; break;
      case 'Bear': baseReturn = Math.random() * -0.20 - 0.05; break;
      case 'Volatile': baseReturn = Math.random() * 0.40 - 0.20; break;
      case 'Stagnant': baseReturn = Math.random() * 0.06 - 0.02; break;
    }
    
    const totalReturn = baseReturn + randomEvent.effect;
    const earnings = investAmount * totalReturn;
    const newBalance = gameState.balance + earnings;
    
    const newHistory = [...gameState.history, { year: gameState.year, balance: newBalance, return: totalReturn }];
    
    setGameState(prev => ({
      ...prev,
      year: prev.year + 1,
      balance: newBalance,
      history: newHistory,
      currentEvent: randomEvent,
      marketMood: newMood,
      isGameOver: prev.year >= 10
    }));
  };

  const startQuiz = (level: QuizLevel) => {
    setSelectedLevel(level);
    setCurrentQuestionIndex(0);
    setScore(0);
    setQuizComplete(false);
    setShowExplanation(false);
    setSelectedOption(null);
    setActiveView('quiz');
  };

  const handleAnswer = (optionIndex: number) => {
    if (selectedOption !== null) return;
    
    setSelectedOption(optionIndex);
    if (optionIndex === selectedLevel!.questions[currentQuestionIndex].correctAnswer) {
      setScore(prev => prev + 1);
    }
    setShowExplanation(true);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < selectedLevel!.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setShowExplanation(false);
    } else {
      setQuizComplete(true);
    }
  };

  const renderOverview = () => (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-serif text-4xl font-medium text-slate-900 tracking-tight">Intelligence Hub</h2>
          <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-2">Elevating financial literacy across generations</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quiz Section */}
        <div className="premium-card p-8 space-y-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
              <Brain size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Financial IQ Quiz</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Test your knowledge & earn certifications</p>
            </div>
          </div>

          <div className="space-y-4">
            {QUIZ_LEVELS.map((level) => (
              <button
                key={level.id}
                onClick={() => startQuiz(level)}
                className="w-full group flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5 transition-all text-left"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${
                    level.difficulty === 'Beginner' ? 'bg-emerald-50 text-emerald-600' :
                    level.difficulty === 'Intermediate' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                  }`}>
                    {level.difficulty[0]}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{level.title}</h4>
                    <p className="text-xs text-slate-500">{level.description}</p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
              </button>
            ))}
          </div>
        </div>

        {/* Games Section */}
        <div className="premium-card p-8 space-y-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
              <Gamepad2 size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Wealth Games</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Learn through immersive simulations</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { title: 'Market Master', icon: TrendingUp, color: 'emerald', desc: 'Simulate 10 years of market cycles in 5 minutes.', action: startMarketMaster },
              { title: 'Budget Hero', icon: Target, color: 'indigo', desc: 'Manage a family budget through unexpected life events.', action: startBudgetHero },
              { title: 'Wealth Snakes & Ladders', icon: Dice5, color: 'amber', desc: 'Experience the ups and downs of wealth creation in this classic game.', action: startSnakeLadder },
              { title: 'Wealth Academy', icon: BookOpen, color: 'indigo', desc: 'Watch, listen and read about finance at your own pace.', action: () => setActiveView('academy') },
              { title: 'Risk Shield', icon: ShieldCheck, color: 'rose', desc: 'Identify financial risks and choose the right protection.', action: () => setActiveView('games') },
            ].map((game, i) => (
              <button
                key={i}
                onClick={game.action}
                className="p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-500/5 transition-all text-left space-y-3 group"
              >
                <div className={`w-10 h-10 rounded-xl bg-${game.color}-50 text-${game.color}-600 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <game.icon size={20} />
                </div>
                <h4 className="font-bold text-slate-900">{game.title}</h4>
                <p className="text-[10px] text-slate-500 leading-relaxed">{game.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Certification Section */}
      <div className="premium-card p-8 bg-gradient-to-br from-wealth-navy to-slate-900 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-wealth-gold/10 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-wealth-gold/20 text-wealth-gold rounded-full text-[10px] font-black uppercase tracking-widest border border-wealth-gold/30">
              <Award size={12} />
              Elite Certification Program
            </div>
            <h3 className="text-3xl font-bold tracking-tight">Become a Certified Family Wealth Architect</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Complete all quiz levels and simulations to earn a verified certification. Share this with your next generation to ensure a legacy of financial wisdom.
            </p>
            <div className="flex gap-4 pt-2">
              <div className="flex items-center gap-2">
                <Trophy className="text-wealth-gold" size={18} />
                <span className="text-xs font-bold">3 Levels</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="text-wealth-gold" size={18} />
                <span className="text-xs font-bold">12 Badges</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-wealth-gold" size={18} />
                <span className="text-xs font-bold">Verified Certificate</span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => startQuiz(QUIZ_LEVELS[0])}
            className="premium-button-primary px-8 py-4 bg-wealth-gold text-wealth-navy hover:bg-white transition-all"
          >
            <span className="text-xs font-black uppercase tracking-widest">Start Certification Journey</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderQuiz = () => {
    if (!selectedLevel) return null;
    const currentQuestion = selectedLevel.questions[currentQuestionIndex];

    if (quizComplete) {
      const percentage = (score / selectedLevel.questions.length) * 100;
      return (
        <div className="max-w-2xl mx-auto py-12 text-center space-y-8">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto shadow-xl"
          >
            <Trophy size={48} />
          </motion.div>
          
          <div className="space-y-2">
            <h3 className="text-3xl font-bold text-slate-900">Quiz Completed!</h3>
            <p className="text-slate-500">You've mastered the {selectedLevel.title} level.</p>
          </div>

          <div className="p-8 bg-white rounded-[2rem] border border-slate-100 shadow-xl space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Your Score</p>
                <p className="text-2xl font-black text-slate-900">{score}/{selectedLevel.questions.length}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Accuracy</p>
                <p className="text-2xl font-black text-indigo-600">{percentage.toFixed(0)}%</p>
              </div>
            </div>
            
            {percentage >= 70 ? (
              <div className="p-4 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 flex items-center gap-3 text-sm font-bold">
                <CheckCircle2 size={20} />
                Level Certified! Badge added to your profile.
              </div>
            ) : (
              <div className="p-4 bg-amber-50 text-amber-700 rounded-2xl border border-amber-100 flex items-center gap-3 text-sm font-bold">
                <Zap size={20} />
                Keep practicing to earn your certification.
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <button 
              onClick={() => setActiveView('overview')}
              className="flex-1 px-8 py-4 border border-slate-200 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-all"
            >
              Back to Hub
            </button>
            <button 
              onClick={() => startQuiz(selectedLevel)}
              className="flex-1 px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
            >
              Retake Quiz
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => setActiveView('overview')}
            className="text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center gap-2"
          >
            <ChevronRight className="rotate-180" size={16} />
            Exit Quiz
          </button>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Progress</p>
              <p className="text-sm font-black text-slate-900">{currentQuestionIndex + 1} / {selectedLevel.questions.length}</p>
            </div>
            <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-600 transition-all duration-500"
                style={{ width: `${((currentQuestionIndex + 1) / selectedLevel.questions.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">
              <Brain size={12} />
              {selectedLevel.title}
            </div>
            <h3 className="text-2xl font-bold text-slate-900 leading-tight">
              {currentQuestion.text}
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {currentQuestion.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                disabled={selectedOption !== null}
                className={`p-6 rounded-2xl border text-left transition-all relative overflow-hidden ${
                  selectedOption === null 
                    ? 'bg-white border-slate-200 hover:border-indigo-600 hover:shadow-lg' 
                    : selectedOption === idx
                      ? idx === currentQuestion.correctAnswer
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
                        : 'bg-rose-50 border-rose-500 text-rose-900'
                      : idx === currentQuestion.correctAnswer
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
                        : 'bg-white border-slate-100 opacity-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm">{option}</span>
                  {selectedOption !== null && idx === currentQuestion.correctAnswer && (
                    <CheckCircle2 className="text-emerald-600" size={20} />
                  )}
                  {selectedOption === idx && idx !== currentQuestion.correctAnswer && (
                    <XCircle className="text-rose-600" size={20} />
                  )}
                </div>
              </button>
            ))}
          </div>

          <AnimatePresence>
            {showExplanation && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 bg-indigo-50 rounded-2xl border border-indigo-100 space-y-4"
              >
                <div className="flex items-center gap-2 text-indigo-900">
                  <Timer size={18} />
                  <h4 className="text-xs font-black uppercase tracking-widest">Expert Explanation</h4>
                </div>
                <p className="text-sm text-indigo-800 leading-relaxed">
                  {currentQuestion.explanation}
                </p>
                <button 
                  onClick={nextQuestion}
                  className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                >
                  {currentQuestionIndex === selectedLevel.questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
                  <ChevronRight size={18} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  };

  const renderGames = () => {
    if (activeGame === 'market') {
      return (
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => { setActiveGame(null); setActiveView('overview'); }}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center gap-2"
            >
              <ChevronRight className="rotate-180" size={16} />
              Quit Game
            </button>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Current Year</p>
                <p className="text-xl font-black text-slate-900">{gameState.year} / 10</p>
              </div>
              <div className="h-10 w-px bg-slate-200" />
              <div className="text-right">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Net Worth</p>
                <p className="text-xl font-black text-emerald-600">₹{gameState.balance.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              </div>
            </div>
          </div>

          {!gameState.isGameOver ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                {/* Market Status */}
                <div className="premium-card p-8 bg-slate-900 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl" />
                  <div className="relative z-10 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${
                          gameState.marketMood === 'Bull' ? 'bg-emerald-500/20 text-emerald-400' :
                          gameState.marketMood === 'Bear' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          <TrendingUp size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Market Sentiment</p>
                          <h4 className="text-lg font-bold">{gameState.marketMood} Market</h4>
                        </div>
                      </div>
                    </div>

                    {gameState.currentEvent && (
                      <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-2"
                      >
                        <div className="flex items-center gap-2 text-wealth-gold">
                          <Zap size={16} />
                          <h5 className="text-xs font-black uppercase tracking-widest">Year {gameState.year - 1} Event: {gameState.currentEvent.title}</h5>
                        </div>
                        <p className="text-sm text-slate-300">{gameState.currentEvent.description}</p>
                        <div className={`text-xs font-bold ${gameState.currentEvent.effect >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          Impact: {(gameState.currentEvent.effect * 100).toFixed(0)}%
                        </div>
                      </motion.div>
                    )}

                    <div className="space-y-4">
                      <p className="text-sm font-medium text-slate-300">How much of your ₹{gameState.balance.toLocaleString(undefined, { maximumFractionDigits: 0 })} would you like to invest this year?</p>
                      <div className="grid grid-cols-4 gap-3">
                        {[0, 0.25, 0.5, 1].map(percent => (
                          <button
                            key={percent}
                            onClick={() => nextYear(gameState.balance * percent)}
                            className="py-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold border border-white/10 transition-all"
                          >
                            {percent === 0 ? 'Hold Cash' : percent === 1 ? 'All In' : `${percent * 100}%`}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Performance Chart Placeholder */}
                <div className="premium-card p-8 space-y-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Wealth Journey</h4>
                  <div className="h-48 flex items-end gap-2">
                    {gameState.history.map((h, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2">
                        <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height: `${(h.balance / Math.max(...gameState.history.map(x => x.balance))) * 100}%` }}
                          className={`w-full rounded-t-lg ${h.return >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                        />
                        <span className="text-[8px] font-bold text-slate-400">Y{h.year}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="premium-card p-6 space-y-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Investment Tips</h4>
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="mt-1 p-1.5 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                        <Info size={14} />
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">Diversification is key. Don't put all your money in a Bear market unless you have high risk tolerance.</p>
                    </div>
                    <div className="flex gap-3">
                      <div className="mt-1 p-1.5 bg-amber-50 text-amber-600 rounded-lg shrink-0">
                        <Timer size={14} />
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">Time in the market is often better than timing the market. SIP-like consistency helps.</p>
                    </div>
                  </div>
                </div>

                <div className="premium-card p-6 bg-emerald-50 border-emerald-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-white rounded-xl text-emerald-600 shadow-sm">
                      <TrendingUp size={18} />
                    </div>
                    <h4 className="font-bold text-emerald-900">Current Strategy</h4>
                  </div>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    You are currently in Year {gameState.year}. The goal is to reach ₹5,00,000 by Year 10.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto text-center space-y-8 py-12">
              <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-xl">
                <Trophy size={48} />
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-bold text-slate-900">Simulation Complete!</h3>
                <p className="text-slate-500">You've navigated 10 years of market cycles.</p>
              </div>

              <div className="premium-card p-10 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Final Wealth</p>
                    <p className="text-3xl font-black text-slate-900">₹{gameState.balance.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Total Return</p>
                    <p className={`text-3xl font-black ${gameState.balance >= 100000 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {(((gameState.balance - 100000) / 100000) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
                
                <div className="p-4 bg-slate-50 rounded-2xl text-sm font-medium text-slate-600 italic">
                  {gameState.balance > 500000 ? "Incredible! You're a true Market Master." :
                   gameState.balance > 200000 ? "Solid performance. You've successfully grown your wealth." :
                   gameState.balance > 100000 ? "You survived the markets, but there's room for more aggressive growth." :
                   "A tough decade. Review your strategy and try again!"}
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => { setActiveGame(null); setActiveView('overview'); }}
                  className="flex-1 px-8 py-4 border border-slate-200 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Back to Hub
                </button>
                <button 
                  onClick={startMarketMaster}
                  className="flex-1 px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                >
                  Play Again
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (activeGame === 'budget') {
      return (
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => { setActiveGame(null); setActiveView('overview'); }}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center gap-2"
            >
              <ChevronRight className="rotate-180" size={16} />
              Quit Game
            </button>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Current Month</p>
                <p className="text-xl font-black text-slate-900">{budgetState.month} / 12</p>
              </div>
              <div className="h-10 w-px bg-slate-200" />
              <div className="text-right">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Total Savings</p>
                <p className="text-xl font-black text-indigo-600">₹{budgetState.savings.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {!budgetState.isGameOver ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <div className="premium-card p-8 bg-indigo-900 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl" />
                  <div className="relative z-10 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
                          <Target size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Monthly Status</p>
                          <h4 className="text-lg font-bold">Month {budgetState.month}</h4>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-1">Income</p>
                        <p className="text-xl font-bold">₹{budgetState.monthlyIncome.toLocaleString()}</p>
                      </div>
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-1">Expenses</p>
                        <p className="text-xl font-bold">₹{budgetState.monthlyExpenses.toLocaleString()}</p>
                      </div>
                    </div>

                    {budgetState.currentEvent && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 rounded-2xl border ${
                          budgetState.currentEvent.cost >= 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Zap size={14} />
                          <h5 className="text-xs font-black uppercase tracking-widest">{budgetState.currentEvent.title}</h5>
                        </div>
                        <p className="text-xs opacity-80 mb-2">{budgetState.currentEvent.description}</p>
                        <p className="text-sm font-bold">Impact: ₹{budgetState.currentEvent.cost.toLocaleString()}</p>
                      </motion.div>
                    )}

                    <button 
                      onClick={nextMonth}
                      className="w-full py-4 bg-white text-indigo-900 rounded-2xl font-bold hover:bg-slate-100 transition-all flex items-center justify-center gap-2 shadow-xl"
                    >
                      Next Month
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>

                <div className="premium-card p-8 space-y-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Savings Growth</h4>
                  <div className="h-48 flex items-end gap-2">
                    {budgetState.history.map((h, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2">
                        <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height: `${(h.savings / Math.max(...budgetState.history.map(x => x.savings), 1)) * 100}%` }}
                          className="w-full rounded-t-lg bg-indigo-500"
                        />
                        <span className="text-[8px] font-bold text-slate-400">M{h.month}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="premium-card p-6 space-y-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Budgeting Tips</h4>
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="mt-1 p-1.5 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
                        <ShieldCheck size={14} />
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">Always keep an emergency fund. Unexpected costs can wipe out your savings.</p>
                    </div>
                    <div className="flex gap-3">
                      <div className="mt-1 p-1.5 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                        <Star size={14} />
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">Consistency is better than intensity. Saving ₹30,000 every month adds up fast!</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto text-center space-y-8 py-12">
              <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto shadow-xl ${budgetState.savings >= 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600'}`}>
                {budgetState.savings >= 0 ? <Trophy size={48} /> : <XCircle size={48} />}
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-bold text-slate-900">{budgetState.savings >= 0 ? 'Year Complete!' : 'Game Over'}</h3>
                <p className="text-slate-500">{budgetState.savings >= 0 ? 'You managed your budget for a full year.' : 'You ran out of savings!'}</p>
              </div>

              <div className="premium-card p-10 space-y-6">
                <div className="text-center">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Final Savings</p>
                  <p className={`text-4xl font-black ${budgetState.savings >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>₹{budgetState.savings.toLocaleString()}</p>
                </div>
                
                <div className="p-4 bg-slate-50 rounded-2xl text-sm font-medium text-slate-600 italic">
                  {budgetState.savings > 300000 ? "Financial Wizard! Your savings are incredible." :
                   budgetState.savings > 100000 ? "Great job! You've built a solid nest egg." :
                   budgetState.savings >= 0 ? "You made it through the year. Try to optimize your expenses next time!" :
                   "Budgeting is hard. Don't give up—try again and watch those unexpected costs!"}
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => { setActiveGame(null); setActiveView('overview'); }}
                  className="flex-1 px-8 py-4 border border-slate-200 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Back to Hub
                </button>
                <button 
                  onClick={startBudgetHero}
                  className="flex-1 px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                >
                  Play Again
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (activeGame === 'snake-ladder') {
      return <SnakeAndLadderGame onBack={() => { setActiveGame(null); setActiveView('overview'); }} />;
    }

    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => setActiveView('overview')}
            className="text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center gap-2"
          >
            <ChevronRight className="rotate-180" size={16} />
            Back to Hub
          </button>
        </div>

        <div className="premium-card p-20 flex flex-col items-center justify-center text-center space-y-6 border-dashed">
          <div className="w-24 h-24 bg-emerald-50 rounded-3xl flex items-center justify-center text-emerald-600 shadow-inner">
            <Gamepad2 size={48} />
          </div>
          <div>
            <h3 className="text-serif text-2xl font-medium text-slate-900">Wealth Simulations Loading</h3>
            <p className="text-slate-400 max-w-sm mx-auto mt-2 text-sm">We are architecting immersive financial simulations to help you and your family master the markets in a risk-free environment.</p>
          </div>
          <div className="flex gap-4">
            <div className="px-4 py-2 bg-slate-50 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest border border-slate-100">
              Coming Soon: Market Master
            </div>
            <div className="px-4 py-2 bg-slate-50 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-widest border border-slate-100">
              Coming Soon: Budget Hero
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAcademy = () => {
    if (selectedResource) {
      return (
        <div className="space-y-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSelectedResource(null)}
              className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-all shadow-sm"
            >
              <ChevronRight className="rotate-180" size={20} />
            </button>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">{selectedResource.category} • {selectedResource.level}</p>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{selectedResource.title}</h2>
            </div>
          </div>

          <div className="max-w-4xl mx-auto">
            {selectedResource.type === 'video' && (
              <div className="space-y-6">
                <div className="aspect-video bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-white">
                  <iframe 
                    width="100%" 
                    height="100%" 
                    src={selectedResource.content?.url} 
                    title={selectedResource.title}
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
                <div className="premium-card p-8 space-y-4">
                  <h4 className="text-lg font-bold text-slate-900">About this video</h4>
                  <p className="text-slate-600 leading-relaxed">{selectedResource.content?.description}</p>
                </div>
              </div>
            )}

            {selectedResource.type === 'audio' && (
              <div className="space-y-6">
                <div className="premium-card p-12 bg-gradient-to-br from-indigo-600 to-slate-900 text-white rounded-[2.5rem] flex flex-col items-center text-center space-y-8">
                  <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center animate-pulse">
                    <Headphones size={48} className="text-indigo-200" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold">{selectedResource.title}</h3>
                    <p className="text-indigo-200 text-sm">{selectedResource.category}</p>
                  </div>
                  <div className="w-full max-w-md bg-white/10 rounded-2xl p-6 space-y-4">
                    <audio 
                      controls 
                      className="w-full h-10 filter invert contrast-50 brightness-200"
                      src={selectedResource.content?.url}
                    />
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-indigo-300">
                      <span>Stereo HD</span>
                      <span>{selectedResource.duration}</span>
                    </div>
                  </div>
                </div>
                <div className="premium-card p-8 space-y-4">
                  <h4 className="text-lg font-bold text-slate-900">Audio Insights</h4>
                  <p className="text-slate-600 leading-relaxed">{selectedResource.content?.description}</p>
                </div>
              </div>
            )}

            {selectedResource.type === 'article' && (
              <div className="premium-card p-8 md:p-12 space-y-8 max-w-none">
                <div className="border-b border-slate-100 pb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                      Article
                    </span>
                    <span className="text-xs font-medium text-slate-400">{selectedResource.duration}</span>
                  </div>
                  <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-4">{selectedResource.title}</h1>
                  <p className="text-lg text-slate-500 italic leading-relaxed">{selectedResource.content?.description}</p>
                </div>
                
                <div className="space-y-6">
                  {selectedResource.content?.body?.split('\n\n').map((paragraph, index) => {
                    if (paragraph.trim().startsWith('###')) {
                      return <h3 key={index} className="text-xl font-bold text-slate-900 mt-8 mb-4">{paragraph.replace('###', '').trim()}</h3>;
                    }
                    return <p key={index} className="text-slate-700 leading-relaxed text-lg font-medium">{paragraph.trim()}</p>;
                  })}
                </div>

                <div className="mt-12 p-8 bg-slate-50 rounded-2xl">
                  <h5 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                    <Zap size={18} className="text-amber-500" />
                    Key Takeaway
                  </h5>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {selectedResource.id === 'ar1' 
                      ? "The 50/30/20 rule isn't just about limiting spending; it's about intentionality. By automating your savings first, you can spend your 'wants' budget guilt-free."
                      : "Tax loss harvesting is a powerful tool to enhance post-tax returns. However, it should be done thoughtfully and typically towards the end of the financial year to maximize impact."
                    }
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    const filteredResources = ACADEMY_RESOURCES.filter(r => {
      const levelMatch = academyLevel === 'All' || r.level === academyLevel;
      const typeMatch = academyType === 'All' || r.type === academyType;
      return levelMatch && typeMatch;
    });

    return (
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setActiveView('overview')}
              className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-all shadow-sm"
            >
              <ChevronRight className="rotate-180" size={20} />
            </button>
            <div>
              <h2 className="text-serif text-3xl font-medium text-slate-900 tracking-tight">Wealth Academy</h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Multi-modal learning for every stage</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <select 
              value={academyLevel}
              onChange={(e) => setAcademyLevel(e.target.value as any)}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none focus:border-indigo-500 transition-all"
            >
              <option value="All">All Levels</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
            <select 
              value={academyType}
              onChange={(e) => setAcademyType(e.target.value as any)}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none focus:border-indigo-500 transition-all"
            >
              <option value="All">All Formats</option>
              <option value="video">Videos</option>
              <option value="audio">Audios</option>
              <option value="article">Articles</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {filteredResources.map((resource) => (
            <motion.div
              layout
              key={resource.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => setSelectedResource(resource)}
              className="premium-card p-6 flex flex-col justify-between group cursor-pointer hover:border-indigo-400 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className={`p-2.5 rounded-xl ${
                    resource.type === 'video' ? 'bg-rose-50 text-rose-600' :
                    resource.type === 'audio' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'
                  }`}>
                    {resource.type === 'video' && <Video size={18} />}
                    {resource.type === 'audio' && <Headphones size={18} />}
                    {resource.type === 'article' && <FileIcon size={18} />}
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${
                    resource.level === 'Beginner' ? 'bg-emerald-50 text-emerald-600' :
                    resource.level === 'Intermediate' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                  }`}>
                    {resource.level}
                  </span>
                </div>
                
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{resource.category}</p>
                  <h4 className="font-bold text-slate-900 leading-snug group-hover:text-indigo-600 transition-colors line-clamp-2">
                    {resource.title}
                  </h4>
                </div>
              </div>

              <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-50">
                <span className="text-xs font-medium text-slate-400">{resource.duration}</span>
                <div className="flex items-center gap-1.5 text-xs font-black text-indigo-600 group-hover:text-indigo-700 transition-all uppercase tracking-widest">
                  {resource.type === 'video' ? 'Watch' : resource.type === 'audio' ? 'Listen' : 'Read'}
                  <Play size={12} fill="currentColor" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredResources.length === 0 && (
          <div className="p-20 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mx-auto">
              <BookOpen size={32} />
            </div>
            <p className="text-slate-400 font-medium">No resources found for the selected filters.</p>
            <button 
              onClick={() => { setAcademyLevel('All'); setAcademyType('All'); }}
              className="text-indigo-600 font-bold text-sm hover:underline"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Tab Navigation */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveView(tab.id as any);
              if (tab.id === 'quiz') setSelectedLevel(null); // Reset quiz level selection if clicking the main tab
              if (tab.id === 'games') setActiveGame(null);
            }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeView === tab.id
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeView}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeView === 'overview' && renderOverview()}
          {activeView === 'quiz' && (selectedLevel ? renderQuiz() : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {QUIZ_LEVELS.map((level) => (
                <button
                  key={level.id}
                  onClick={() => startQuiz(level)}
                  className="premium-card p-8 group text-left hover:border-indigo-200 hover:shadow-xl transition-all"
                >
                   <div className={`w-12 h-12 rounded-2xl mb-6 flex items-center justify-center font-black text-lg ${
                    level.difficulty === 'Beginner' ? 'bg-emerald-50 text-emerald-600' :
                    level.difficulty === 'Intermediate' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                  }`}>
                    {level.difficulty[0]}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 mb-2">{level.title}</h3>
                  <p className="text-sm text-slate-500 mb-6">{level.description}</p>
                  <div className="flex items-center gap-2 text-xs font-black text-indigo-600 uppercase tracking-widest">
                    Start Certification
                    <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              ))}
            </div>
          ))}
          {activeView === 'games' && (activeGame ? renderGames() : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {[
               { title: 'Market Master', icon: TrendingUp, color: 'emerald', desc: 'Simulate 10 years of market cycles in 5 minutes.', action: startMarketMaster },
               { title: 'Budget Hero', icon: Target, color: 'indigo', desc: 'Manage a family budget through unexpected life events.', action: startBudgetHero },
               { title: 'Wealth Snakes & Ladders', icon: Dice5, color: 'amber', desc: 'Experience the ups and downs of wealth creation in this classic game.', action: startSnakeLadder },
               { title: 'Risk Shield', icon: ShieldCheck, color: 'rose', desc: 'Identify financial risks and choose the right protection.', action: () => {} },
             ].map((game, i) => (
               <button
                 key={i}
                 onClick={game.action}
                 className="premium-card p-8 text-left hover:border-emerald-200 hover:shadow-xl transition-all group"
               >
                 <div className={`w-12 h-12 rounded-2xl bg-${game.color}-50 text-${game.color}-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                   <game.icon size={24} />
                 </div>
                 <h4 className="text-xl font-bold text-slate-900 mb-2">{game.title}</h4>
                 <p className="text-sm text-slate-500 mb-6 leading-relaxed">{game.desc}</p>
                 <div className={`flex items-center gap-2 text-xs font-black text-${game.color}-600 uppercase tracking-widest`}>
                   Launch Simulation
                   <Play size={14} fill="currentColor" />
                 </div>
               </button>
             ))}
           </div>
          ))}
          {activeView === 'academy' && renderAcademy()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default FinanceIntelligence;

// Single source of truth. Every fact here comes from Huseyn's CV.
// Not published on purpose: date of birth and street address.

export const person = {
  name: 'Huseyn Alipanahov',
  first: 'HUSEYN',
  last: 'ALIPANAHOV',
  role: 'Front-end Developer',
  city: 'Baku',
  country: 'Azerbaijan',
  email: 'elipenahov04@gmail.com',
  phone: '+994 70 617 16 07',
};

export const about = {
  lead:
    'I studied Information Technologies at the Azerbaijan University of Architecture and Construction. Technology, and artificial intelligence in particular, has held my interest from the day it entered our lives.',
  body:
    'I have strong computer skills, use Microsoft Office at a professional level, and research and solve the technical problems I run into on my own.',
  next: ['Cybersecurity', 'QA engineering', 'Data analytics'],
};

export const traits = [
  {
    id: 'analytical',
    title: 'Analytical thinking',
    short: 'Analytical',
    text: 'Thinking analytically is one of my main strengths. I look at a problem in parts before I reach for a fix.',
  },
  {
    id: 'problem',
    title: 'Problem solving',
    short: 'Problems',
    text: 'I research and solve the technical problems I meet on my own, and I stay calm while doing it.',
  },
  {
    id: 'adapt',
    title: 'Adaptability',
    short: 'Adaptable',
    text: 'I adapt quickly to new technologies, and to new environments, socially as well as technically.',
  },
  {
    id: 'team',
    title: 'Teamwork',
    short: 'Team',
    text: 'Friendly, sociable and cheerful. I am inclined to work with a team.',
  },
] as const;

export const languages = [
  { name: 'Azerbaijani', value: 100 },
  { name: 'Turkish', value: 75 },
  { name: 'English', value: 60 },
  { name: 'Russian', value: 30 },
];

export type Category = 'frontend' | 'backend' | 'database' | 'tools';

export const categories: { id: Category; label: string }[] = [
  { id: 'frontend', label: 'Frontend' },
  { id: 'backend', label: 'Backend' },
  { id: 'database', label: 'Database' },
  { id: 'tools', label: 'Tools' },
];

export type Skill = {
  id: string;
  name: string;
  cat: Category;
  x: number; // position in a 1000 x 600 field
  y: number;
  text: string;
};

// The list is the CV's. Descriptions say what each technology is, not how well it is known.
export const skills: Skill[] = [
  { id: 'html', name: 'HTML', cat: 'frontend', x: 90, y: 250, text: 'The structure every interface starts from: semantic markup, forms, accessibility.' },
  { id: 'css', name: 'CSS', cat: 'frontend', x: 220, y: 150, text: 'Layout, typography and motion for the web: grid, flexbox, custom properties.' },
  { id: 'sass', name: 'SASS', cat: 'frontend', x: 350, y: 60, text: 'CSS with variables, nesting and mixins, compiled to plain CSS.' },
  { id: 'tailwind', name: 'Tailwind', cat: 'frontend', x: 390, y: 175, text: 'Utility-first CSS framework for composing layouts directly in markup.' },
  { id: 'bootstrap', name: 'Bootstrap', cat: 'frontend', x: 110, y: 70, text: 'Component and grid framework for responsive layouts.' },
  { id: 'js', name: 'JavaScript', cat: 'frontend', x: 250, y: 370, text: 'The language of the browser, and the thread that runs from interface to server.' },
  { id: 'ts', name: 'TypeScript', cat: 'frontend', x: 370, y: 500, text: 'JavaScript with static types, so mistakes surface before they reach the browser.' },
  { id: 'react', name: 'React.js', cat: 'frontend', x: 470, y: 330, text: 'Component-based library for building interactive user interfaces.' },
  { id: 'rn', name: 'React Native', cat: 'frontend', x: 560, y: 480, text: "React's component model applied to native iOS and Android apps." },
  { id: 'node', name: 'Node.js', cat: 'backend', x: 650, y: 320, text: 'JavaScript runtime for servers, tooling and build scripts.' },
  { id: 'express', name: 'Express.js', cat: 'backend', x: 780, y: 210, text: 'Minimal Node.js framework for routing and building APIs.' },
  { id: 'rest', name: 'RESTful API', cat: 'backend', x: 620, y: 110, text: 'The contract between interface and server: resources, HTTP verbs, JSON.' },
  { id: 'mongoose', name: 'Mongoose.js', cat: 'database', x: 810, y: 390, text: 'Schema and modelling layer between Node.js and MongoDB.' },
  { id: 'mongodb', name: 'MongoDB', cat: 'database', x: 900, y: 510, text: 'Document database that stores data as flexible JSON-like documents.' },
  { id: 'python', name: 'Python', cat: 'tools', x: 900, y: 80, text: 'General-purpose language for scripting, automation and data work.' },
  { id: 'git', name: 'Git', cat: 'tools', x: 80, y: 520, text: 'Version control: branches, commits and a readable history.' },
  { id: 'github', name: 'GitHub', cat: 'tools', x: 200, y: 560, text: 'Hosting, collaboration and code review for Git repositories.' },
];

// How the technologies relate in practice.
export const links: [string, string][] = [
  ['html', 'css'],
  ['css', 'sass'],
  ['css', 'tailwind'],
  ['css', 'bootstrap'],
  ['html', 'js'],
  ['js', 'ts'],
  ['js', 'react'],
  ['ts', 'react'],
  ['react', 'rn'],
  ['js', 'node'],
  ['node', 'express'],
  ['express', 'rest'],
  ['react', 'rest'],
  ['node', 'mongoose'],
  ['express', 'mongoose'],
  ['mongoose', 'mongodb'],
  ['git', 'github'],
];

export type Milestone = {
  id: string;
  kind: 'work' | 'study';
  title: string;
  place: string;
  detail?: string;
  start: number; // decimal year
  end: number | null; // null = ongoing
  range: string;
};

// Chronological order of the journey.
export const journey: Milestone[] = [
  {
    id: 'azuac',
    kind: 'study',
    title: 'Information Technologies',
    place: 'Azerbaijan University of Architecture and Construction',
    detail: "Bachelor's degree",
    start: 2021,
    end: 2025,
    range: '2021 – 2025',
  },
  {
    id: 'code',
    kind: 'study',
    title: 'FullStack Development',
    place: 'Code Academy',
    start: 2023,
    end: 2024,
    range: '2023 – 2024',
  },
  {
    id: 'bmp',
    kind: 'work',
    title: 'Reception',
    place: 'Baku Medikal Plaza, central branch',
    start: 2024 + 7 / 12,
    end: null,
    range: 'Aug 2024 – present',
  },
  {
    id: 'asoiu',
    kind: 'study',
    title: 'Information System Security',
    place: 'Azerbaijan State Oil and Industry University',
    start: 2025,
    end: null,
    range: '2025 – present',
  },
];

export type Project = {
  id: string;
  name: string;
  domain: string;
  url: string;
  // The CV lists only name and domain. Add a one-line description when ready;
  // the page shows it only when it exists.
  description?: string;
};

export const projects: Project[] = [
  { id: 'ofisart', name: 'Ofisart', domain: 'ofisart.az', url: 'https://ofisart.az' },
  { id: 'edupredictor', name: 'EduPredictor', domain: 'edupredictor.com', url: 'https://edupredictor.com' },
];

export const sections = [
  { id: 'intro', label: 'Intro' },
  { id: 'about', label: 'About' },
  { id: 'stack', label: 'Stack' },
  { id: 'experience', label: 'Experience' },
  { id: 'work', label: 'Work' },
  { id: 'contact', label: 'Contact' },
] as const;

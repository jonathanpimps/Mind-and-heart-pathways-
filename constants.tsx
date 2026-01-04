
import React from 'react';
import { Church, Heart, Zap, Brain, Leaf } from 'lucide-react';
import { Service, ServiceCategory, Resource } from './types';

export const SERVICES: Service[] = [
  {
    id: ServiceCategory.MINISTRY,
    title: 'Ministry',
    description: 'Find spiritual guidance and support through faith-based counseling and prayer. A serene path to spiritual wellness and communal connection.',
    icon: 'Church',
    color: 'bg-violet-100',
    secondaryColor: 'text-violet-600',
    themeClass: 'from-violet-50/50 to-blue-50/50',
    vibe: 'Serene & Faith-based 🕊️'
  },
  {
    id: ServiceCategory.COUNSELING,
    title: 'Counseling',
    description: 'Professional emotional support tailored to your unique journey. We provide a safe, empathetic space for healing and personal growth.',
    icon: 'Heart',
    color: 'bg-sky-100',
    secondaryColor: 'text-sky-600',
    themeClass: 'from-blue-50/50 to-emerald-50/50',
    vibe: 'Supportive & Empathetic 💼'
  },
  {
    id: ServiceCategory.LIFE_COACHING,
    title: 'Life Coaching',
    description: 'Unlock your potential and achieve your dreams with actionable strategies and motivational guidance designed to empower your future.',
    icon: 'Zap',
    color: 'bg-amber-100',
    secondaryColor: 'text-amber-600',
    themeClass: 'from-orange-50/50 to-yellow-50/50',
    vibe: 'Empowering & Motivational 💪'
  },
  {
    id: ServiceCategory.ABA_THERAPY,
    title: 'ABA Therapy',
    description: 'Evidence-based behavioral therapy focusing on development and skill-building in a professional, nurturing environment for all ages.',
    icon: 'Brain',
    color: 'bg-teal-100',
    secondaryColor: 'text-teal-600',
    themeClass: 'from-teal-50/50 to-slate-100/50',
    vibe: 'Nurturing & Professional 🧠'
  },
  {
    id: ServiceCategory.MENTAL_THERAPY,
    title: 'Mental Therapy',
    description: 'Deep therapeutic interventions for complex mental health needs, focusing on long-term stability, peace, and cognitive resilience.',
    icon: 'Leaf',
    color: 'bg-fuchsia-100',
    secondaryColor: 'text-fuchsia-600',
    themeClass: 'from-purple-50/50 to-indigo-50/50',
    vibe: 'Peaceful & Therapeutic 🌿'
  }
];

export const RESOURCES: Resource[] = [
  {
    id: '1',
    title: 'Finding Peace in Daily Chaos',
    excerpt: 'Simple mindfulness techniques to help you stay grounded when life gets overwhelming and the world feels too loud.',
    category: 'Mental Health',
    date: 'Oct 24, 2024',
    image: 'https://picsum.photos/seed/peace/600/400'
  },
  {
    id: '2',
    title: 'The Power of Faith in Healing',
    excerpt: 'How spiritual practices can complement traditional therapy for a holistic recovery and long-term peace of mind.',
    category: 'Ministry',
    date: 'Oct 20, 2024',
    image: 'https://picsum.photos/seed/faith/600/400'
  },
  {
    id: '3',
    title: 'Goal Setting for Success',
    excerpt: 'Practical steps to transform your vision into reality through structured coaching and actionable behavioral changes.',
    category: 'Life Coaching',
    date: 'Oct 15, 2024',
    image: 'https://picsum.photos/seed/goals/600/400'
  }
];

export const getIcon = (name: string, className?: string) => {
  switch (name) {
    case 'Church': return <Church className={className} />;
    case 'Heart': return <Heart className={className} />;
    case 'Zap': return <Zap className={className} />;
    case 'Brain': return <Brain className={className} />;
    case 'Leaf': return <Leaf className={className} />;
    default: return <Heart className={className} />;
  }
};

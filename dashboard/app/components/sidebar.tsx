'use client'

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Users,
  GraduationCap,
  DollarSign,
  CheckCircle,
  UserCheck,
  Building,
  BarChart4,
  Home
} from 'lucide-react';

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
}

function NavItem({ href, icon, label, isActive }: NavItemProps) {
  return (
    <Link href={href} className="block mx-2">
      <div className={`flex items-center space-x-3 px-3 py-2.5 rounded-md transition-all duration-200 ${
        isActive 
          ? 'bg-blue-900/30 text-blue-100 border-l-2 border-blue-500' 
          : 'text-gray-400 hover:text-white hover:bg-gray-800/70'
      }`}>
        <div className="flex-shrink-0">
          {icon}
        </div>
        <span className="font-medium">{label}</span>
      </div>
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  
  const navItems = [
    {
      href: '/',
      icon: <Home className="w-5 h-5" />,
      label: 'Overview'
    },
    {
      href: '/dashboard/registrations',
      icon: <Users className="w-5 h-5" />,
      label: 'Registrations'
    },
    {
      href: '/dashboard/finances',
      icon: <DollarSign className="w-5 h-5" />,
      label: 'Finances'
    },
    {
      href: '/dashboard/academics',
      icon: <GraduationCap className="w-5 h-5" />,
      label: 'Academics'
    },
    {
      href: '/dashboard/attendance',
      icon: <CheckCircle className="w-5 h-5" />,
      label: 'Attendance'
    },
    {
      href: '/dashboard/teaching',
      icon: <UserCheck className="w-5 h-5" />,
      label: 'Teaching'
    },
    {
      href: '/dashboard/rooms',
      icon: <Building className="w-5 h-5" />,
      label: 'Rooms'
    }
  ];

  return (
    <div className="w-64 min-h-screen bg-gray-950 border-r border-gray-800 flex flex-col">
      {/* Logo/Header */}
      <div className="p-4 border-b border-gray-800 bg-gray-900">
        <div className="flex items-center space-x-3">
          <BarChart4 className="w-7 h-7 text-blue-500" />
          <h1 className="text-lg font-bold text-white">SIAK Dashboard</h1>
        </div>
      </div>
      
      {/* Navigation */}
      <div className="flex-1 py-2 space-y-0.5">
        {navItems.map((item, index) => (
          <NavItem
            key={index}
            href={item.href}
            icon={item.icon}
            label={item.label}
            isActive={pathname === item.href || pathname.startsWith(`${item.href}/`)}
          />
        ))}
      </div>
      
      {/* Footer */}
      <div className="py-3 border-t border-gray-800 bg-gray-900/50">
        <div className="flex items-center justify-center px-4">
          <div className="text-xs text-gray-500">SIAK Analytics Dashboard</div>
        </div>
      </div>
    </div>
  );
}

import React from 'react';

/**
 * Team page component
 */
export default function TeamPage() {
  return (
    <div className="max-w-4xl mx-auto mt-10">
      <h1 className="text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">Our Team</h1>
      <p className="mb-8 text-lg text-gray-200">Meet the talented individuals behind the Zephra framework.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {TEAM_MEMBERS.map(member => (
          <div key={member.name} className="bg-white/10 rounded-xl shadow-lg p-6 flex flex-col items-center border border-white/20">
            <div className="w-16 h-16 bg-blue-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mb-4 shadow-lg">{member.name.substring(0, 1)}</div>
            <h3 className="text-xl font-semibold mb-1 text-blue-200">{member.name}</h3>
            <p className="text-sm text-purple-300 mb-1">{member.role}</p>
            <p className="text-sm text-gray-300 text-center">{member.bio}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Sample team data
const TEAM_MEMBERS = [
  {
    name: 'Alex Johnson',
    role: 'Lead Developer',
    bio: 'Creator of the core Zephra engine and API framework.'
  },
  {
    name: 'Sarah Chen',
    role: 'Frontend Architect',
    bio: 'Designer of the file-based routing system and React integration.'
  },
  {
    name: 'Miguel Rodriguez',
    role: 'Performance Engineer',
    bio: 'Responsible for making Zephra one of the fastest frameworks available.'
  },
  {
    name: 'Taylor Smith',
    role: 'Documentation Lead',
    bio: 'Ensures developers have the best experience learning Zephra.'
  }
]; 
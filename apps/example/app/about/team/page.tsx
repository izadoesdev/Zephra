import React from 'react';

/**
 * Team page component
 */
export default function TeamPage() {
  return (
    <div>
      <h1>Our Team</h1>
      <p>Meet the talented individuals behind the Zephra framework.</p>
      
      <div className="team-grid">
        {TEAM_MEMBERS.map(member => (
          <div key={member.name} className="team-member">
            <div className="avatar">{member.name.substring(0, 1)}</div>
            <h3>{member.name}</h3>
            <p className="role">{member.role}</p>
            <p className="bio">{member.bio}</p>
          </div>
        ))}
      </div>
      
      <style>{`
        .team-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 2rem;
          margin-top: 2rem;
        }
        
        .team-member {
          background-color: white;
          border-radius: 0.5rem;
          padding: 1.5rem;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }
        
        .avatar {
          width: 60px;
          height: 60px;
          background-color: #3b82f6;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 1rem;
        }
        
        .role {
          color: #6b7280;
          margin-top: 0;
        }
        
        .bio {
          font-size: 0.9rem;
        }
      `}</style>
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
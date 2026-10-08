export interface JobProfile {
  id: string;
  title: string;
  department: string;
  institute: string;
  location: string;
  type: 'Part-Time' | 'Full-Time' | 'Internship' | 'Work-Study';
  stipend: string;
  postedDate: string;
  deadline: string;
  status: 'Open' | 'Interviewing' | 'Closed';
  applicantsCount: number;
  description: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  tags: string[];
  owner: {
    id: string;
    name: string;
    title: string;
    role: string;
    department: string;
    avatar: string;
    email: string;
    bio: string;
    verified: boolean;
    responseRate: string;
  };
}

export const CAMPUS_JOBS: JobProfile[] = [
  {
    id: 'job_ai_research_fellow',
    title: 'AI Research Assistant - Large Language Models & Academic Tutoring',
    department: 'Department of Computer Science & AI',
    institute: 'Dot X Institute of Advanced Technology',
    location: 'Campus Turing Hall / Hybrid Remote',
    type: 'Part-Time',
    stipend: '$28.50 / hr + Research Fellowship Credit',
    postedDate: 'Oct 6, 2026',
    deadline: 'Nov 15, 2026',
    status: 'Open',
    applicantsCount: 14,
    description: 'We are seeking an enthusiastic student or graduate researcher to collaborate on multimodal educational LLMs and intelligent question-generation systems within the Dot X learning platform.',
    responsibilities: [
      'Assist in evaluating automated quiz generation accuracy and rubric validation',
      'Benchmark response latency for real-time WebRTC collaborative classroom integrations',
      'Curate academic reference datasets across computer science and engineering coursework',
      'Prepare weekly lab notes and co-author campus technical publications'
    ],
    requirements: [
      'Enrolled undergraduate or graduate student in Computer Science, Data Science, or related field',
      'Proficiency in Python or TypeScript with interest in generative models',
      'Strong academic standing (minimum 3.2 GPA or equivalent)',
      'Commitment of 10-15 hours per week during the active semester'
    ],
    benefits: [
      'Direct faculty mentorship with publishing opportunities',
      'Flexible study-friendly scheduling around lecture times',
      'Formal academic recommendation letter upon completion'
    ],
    tags: ['Artificial Intelligence', 'TypeScript', 'NLP', 'Research'],
    owner: {
      id: 'owner_elena_vance',
      name: 'Dr. Elena Vance',
      title: 'Professor & Director of Applied AI Research',
      role: 'faculty',
      department: 'Computer Science & AI',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      email: 'elena.vance@dotx.edu',
      bio: 'Leading the AI Lab at Dot X. Passionate about student mentorship, neural architectures, and intelligent tutoring systems.',
      verified: true,
      responseRate: 'Typically replies in ~15 minutes'
    }
  },
  {
    id: 'job_peer_tutor_cs',
    title: 'Peer Academic Tutor - Data Structures & Algorithms',
    department: 'Undergraduate Academic Success Center',
    institute: 'Central Polytechnic Campus',
    location: 'Student Learning Commons, Room 204',
    type: 'Work-Study',
    stipend: '$22.00 / hr',
    postedDate: 'Oct 5, 2026',
    deadline: 'Oct 30, 2026',
    status: 'Open',
    applicantsCount: 9,
    description: 'Help fellow students conquer core data structures, asymptotic analysis, dynamic programming, and graph algorithms through weekly one-on-one and small group tutoring sessions.',
    responsibilities: [
      'Lead 1-on-1 tutoring appointments and group problem-solving workshops',
      'Develop exam review study guides and practice problem walkthroughs',
      'Collaborate with course instructors to track student improvement metrics',
      'Maintain tutoring logs in the Dot X learning system'
    ],
    requirements: [
      'Grade of A- or higher in Data Structures & Algorithms or equivalent coursework',
      'Patient communication skills and desire to help peers succeed',
      'Available 8-12 hours per week'
    ],
    benefits: [
      'Official campus peer-tutoring certification',
      'Strengthen your own technical interview readiness',
      'Competitive hourly student campus wage'
    ],
    tags: ['Tutoring', 'Algorithms', 'Peer Support', 'Work-Study'],
    owner: {
      id: 'owner_marcus_sterling',
      name: 'Marcus Sterling',
      title: 'Coordinator of Academic Tutoring Services',
      role: 'faculty',
      department: 'Student Academic Success',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      email: 'marcus.sterling@dotx.edu',
      bio: 'Dedicated to empowering every student to master engineering and mathematics fundamentals with confidence.',
      verified: true,
      responseRate: 'Replies within an hour'
    }
  },
  {
    id: 'job_digital_librarian',
    title: 'Digital Library Archival & Metadata Cataloger',
    department: 'University Central Library & Digital Repositories',
    institute: 'Dot X Institute of Advanced Technology',
    location: 'Central Library Archives / Hybrid',
    type: 'Part-Time',
    stipend: '$24.00 / hr',
    postedDate: 'Oct 4, 2026',
    deadline: 'Nov 20, 2026',
    status: 'Open',
    applicantsCount: 6,
    description: 'Assist in digitizing, cataloging, and enhancing search metadata for rare scientific publications, university theses, and open-access STEM textbooks across the digital catalog.',
    responsibilities: [
      'Inspect OCR accuracy and structured tags for uploaded academic PDFs',
      'Map catalog items into Dublin Core and Library of Congress subject headings',
      'Curate featured weekly reading lists for undergraduate courses'
    ],
    requirements: [
      'Keen attention to detail and good organizational skills',
      'Familiarity with digital document formats and search filtering',
      'Available 10 hours per week'
    ],
    benefits: [
      'Comprehensive hands-on training with modern digital repository tools',
      'Quiet, scholarly work atmosphere in the campus library archives'
    ],
    tags: ['Library', 'Cataloging', 'Digital Archives', 'Metadata'],
    owner: {
      id: 'owner_sophia_chen',
      name: 'Dr. Sophia Chen',
      title: 'Head of Digital Archival Systems',
      role: 'faculty',
      department: 'University Library System',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      email: 'sophia.chen@dotx.edu',
      bio: 'Library scientist and advocate for open-access academic literature. Managing over 50,000 digital textbooks.',
      verified: true,
      responseRate: 'Replies within 30 minutes'
    }
  },
  {
    id: 'job_fullstack_campus_dev',
    title: 'Campus Web & Collaborative Systems Developer',
    department: 'University Information Technology Services',
    institute: 'Metropolitan Polytechnic University',
    location: 'Innovation Lab / Remote',
    type: 'Internship',
    stipend: '$30.00 / hr + Tuition Subsidy',
    postedDate: 'Oct 7, 2026',
    deadline: 'Nov 30, 2026',
    status: 'Open',
    applicantsCount: 22,
    description: 'Work directly with the core engineering team on building real-time collaboration features, Firestore sync, WebRTC video classroom tools, and responsive student portals.',
    responsibilities: [
      'Implement responsive React components with TypeScript and Tailwind CSS',
      'Test WebSocket and WebRTC signaling gateways for multi-user classrooms',
      'Write robust unit and integration tests for academic APIs'
    ],
    requirements: [
      'Experience with modern React, TypeScript, and state management',
      'Understanding of real-time concepts (WebSockets, Firebase Firestore)',
      'Passion for building high-quality, accessible user experiences'
    ],
    benefits: [
      'Ship production features used daily by thousands of students',
      'Direct 1-on-1 mentorship with senior software architects',
      'Portfolio-ready production code and engineering credits'
    ],
    tags: ['React', 'TypeScript', 'WebRTC', 'Firebase', 'Full-Stack'],
    owner: {
      id: 'owner_sarah_jenkins',
      name: 'Sarah Jenkins',
      title: 'Lead Campus Software Architect',
      role: 'admin',
      department: 'University IT Services',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      email: 'sarah.jenkins@dotx.edu',
      bio: 'Leading student systems engineering. Always excited to meet passionate student coders building modern web apps.',
      verified: true,
      responseRate: 'Replies in ~10 minutes'
    }
  }
];

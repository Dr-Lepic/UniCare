import { useParams } from 'react-router-dom';

export default function Dashboard() {
  const { role } = useParams();
  
  // Dummy data based on role
  const getDummyData = () => {
    switch(role) {
      case 'doctor':
        return {
          stats: [
            { label: 'Total Patients', value: 145 },
            { label: 'Appointments Today', value: 8 },
            { label: 'Pending Reports', value: 3 }
          ],
          recentActivity: [
            'Reviewed patient John Doe records',
            'Completed shift round at 10:00 AM'
          ]
        };
      case 'nurse':
        return {
          stats: [
            { label: 'Assigned Patients', value: 12 },
            { label: 'Medications Given', value: 45 },
            { label: 'Vitals Pending', value: 2 }
          ],
          recentActivity: [
            'Administered IV to Room 302',
            'Updated vitals for Room 304'
          ]
        };
      case 'student':
        return {
          stats: [
            { label: 'Total visit', value: 3 },
            { label: 'Insurance amount', value: 1 },
            { label: 'upcoming appointment', value: 2 }
          ],
          recentActivity: [
            'Submitted Anatomy Assignment',
            'Viewed midterm grades'
          ]
        };
      default:
        return { stats: [], recentActivity: [] };
    }
  };

  const data = getDummyData();

  return (
    <div className="dashboard-page">
      <h2>Dashboard Overview</h2>
      
      <div className="stats-grid">
        {data.stats.map((stat, idx) => (
          <div key={idx} className="stat-card">
            <h3>{stat.label}</h3>
            <p className="stat-value">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="recent-activity">
        <h3>Recent Activity</h3>
        <ul>
          {data.recentActivity.map((act, idx) => (
            <li key={idx}>{act}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

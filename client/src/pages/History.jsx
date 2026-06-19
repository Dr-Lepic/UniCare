import { useParams } from 'react-router-dom';

export default function History() {
  const { role } = useParams();

  // Dummy history data based on role
  const getHistoryData = () => {
    switch(role) {
      case 'doctor':
        return [
          { date: '2023-10-15', detail: 'Discharged Patient XYZ' },
          { date: '2023-10-14', detail: 'Performed Surgery ABC' }
        ];
      case 'nurse':
        return [
          { date: '2023-10-15', detail: 'Night shift completed' },
          { date: '2023-10-14', detail: 'Assisted in Surgery ABC' }
        ];
      case 'student':
        return [
          { date: '2023-10-15', detail: 'Attended Clinical Rotation' },
          { date: '2023-10-12', detail: 'Completed Quiz 2' }
        ];
      default:
        return [];
    }
  };

  const history = getHistoryData();

  return (
    <div className="history-page">
      <h2>History Log</h2>
      <table className="history-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {history.map((item, idx) => (
            <tr key={idx}>
              <td>{item.date}</td>
              <td>{item.detail}</td>
            </tr>
          ))}
          {history.length === 0 && (
            <tr><td colSpan="2">No history found.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

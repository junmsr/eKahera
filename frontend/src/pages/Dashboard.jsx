import Card from '../components/Card';
import Button from '../components/Button';
import '../index.css';

function Dashboard() {
  return (
    <div className="dashboard flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <h1>Dashboard</h1>
      <Card title="Welcome to the Dashboard" description="This is your dashboard where you can manage your settings and view your data.">
        <Button label="Get Started" onClick={() => alert('Getting started!')} />
      </Card>
    </div>
  );
}

export default Dashboard;
import Card from '../components/Card';
import Button from '../components/Button';
import { useNavigate } from 'react-router-dom';
import '../index.css';

function Home() {
  const navigate = useNavigate();

  return (
    <section id="home">
      <div className="home flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <h1 className="text-3xl font-bold mb-4">Smart Sales.</h1>
        <h1 className="text-3xl font-bold mb-4">Simple Checkout.</h1>
        <Card title="Get Started" description="Choose your portal to continue.">
          <div className="flex flex-col md:flex-row gap-4">
            <Button
              label="Customer"
              onClick={() => navigate('/customer')}
              className="bg-purple-500 text-white px-4 py-2 rounded-full hover:bg-purple-600 md:mr-4 md:mb-0 mb-4"
            />
            <Button
              label="Cashier/Admin"
              onClick={() => navigate('/login')}
              className="bg-purple-500 text-white px-4 py-2 rounded-full hover:bg-purple-600"
            />
          </div>
        </Card>
      </div>
    </section>
  );
}

export default Home;
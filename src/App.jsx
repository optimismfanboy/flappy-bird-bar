import { useState } from 'react'
import FlappyStart from './components/FlappyStart'
import FlappyModal from './components/FlappyModal'
import './App.css'

function App() {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleButtonClick = () => {
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
  };

  return (
    <div className="app-container">
      
      <FlappyStart onClick={handleButtonClick} />
      <FlappyModal isVisible={isModalVisible} onClose={handleCloseModal} />
    </div>
  )
}

export default App

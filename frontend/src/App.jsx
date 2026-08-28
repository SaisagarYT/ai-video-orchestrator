import React from 'react'
import './index.css'
import Navbar from './Components/ui/Navbar'
import Homescreen from './screens/Homescreen'

const App = () => {
  return (
    <div className='w-screen h-screen bg-(--white)'>
      {/* Hero */}
      <div className='w-full h-full'>
        <Homescreen/>
      </div>
    </div>
  )
}

export default App

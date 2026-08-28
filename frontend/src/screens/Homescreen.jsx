import React from 'react'
import Navbar from '../Components/ui/Navbar'

const Homescreen = () => {
  return (
    <div className='w-screen flex flex-col h-screen gap-3 p-3 '>
      <Navbar/>
      <div className='w-full h-full flex bg-white rounded-2xl border border-gray-300 shadow-sm'>
        <div className='h-full p-2 w-100 bg-(--gray)'>
            <div className='w-full h-full flex flex-col justify-between'>
                <div className='w-full h-15 bg-gray-400'>

                </div>
                <div className='w-full h-30 bg-black rounded-xl'>

                </div>
                <div className='w-full h-30 bg-gray-400 rounded-xl'>

                </div>
                <div className='w-full h-40 bg-gray-400 rounded-xl'>

                </div>
                <div className='w-full h-13 bg-gray-400 rounded-md'>

                </div>

                <div className='w-full h-12 flex gap-2 bg-gray-400'>
                    <span className='flex w-1/3 rounded-sm h-full bg-(--white)'>

                    </span>
                    <span className='flex w-1/3 rounded-sm h-full bg-(--white)'>

                    </span>
                    <span className='flex w-1/3 rounded-sm h-full bg-(--white)'>

                    </span>
                </div>

                <div className='w-full h-10 bg-gray-400 rounded-sm'>

                </div>
                <button className='w-full h-14 bg-(--dark-blue) rounded-md'></button>
            </div>
        </div>
        <div className='h-full w-full p-3 bg-(--dark-blue)'>
            <div className='w-full h-full bg-(--white)'>

            </div>
        </div>
      </div>
    </div>
  )
}

export default Homescreen

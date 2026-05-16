import React from 'react'


const Card = (props) => {
  console.log(props);
  
  return (
    <div className=' m-15 border-2 p-10 w-1/5 flex-col'>
      <h3>{props.name}</h3>
      <p>{props.age}</p>
    </div>
  )
}

export default Card